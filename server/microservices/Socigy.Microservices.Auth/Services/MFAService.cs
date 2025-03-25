using Google.Protobuf.WellKnownTypes;
using Microsoft.AspNetCore.DataProtection;
using NpgsqlTypes;
using Socigy.Connectors.User.Info;
using Socigy.Microservices.Auth.Enums;
using Socigy.Microservices.Auth.Resources.EmailTemplates;
using Socigy.Microservices.Auth.Structures;
using Socigy.Middlewares.Helpers;
using Socigy.Services.Communication;
using Socigy.Services.Database;
using Socigy.Services.Emailing;
using Socigy.Structures;
using Socigy.Structures.API;
using Socigy.Structures.API.Communication;
using System;
using System.Buffers.Text;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using UAParser;

namespace Socigy.Microservices.Auth.Services
{
    public class MFAService : IMFAService
    {
        private readonly IEmailService _Emails;
        private readonly ITokenService _Tokens;
        private readonly IDatabaseService _Db;
        private readonly ILogger<MFAService> _Logger;
        private readonly IDataProtector _Protector;

        private readonly UserInfoGrpcService.UserInfoGrpcServiceClient _User;

        private static readonly TimeSpan _TimeStep;
        private static readonly int _Digits = 6;
        private const int _MaxFailedAttempts = 5;
        private const int _LockoutMinutes = 15;
        public MFAService(IEmailService emailing, ITokenService tokens, IDatabaseService db, ILogger<MFAService> logger, UserInfoGrpcService.UserInfoGrpcServiceClient user, IDataProtectionProvider dataProtectionProvider)
        {
            _Emails = emailing;
            _Tokens = tokens;
            _Db = db;
            _User = user;
            _Logger = logger;
            _Protector = dataProtectionProvider.CreateProtector("MFATotp.Secrets.Encrypt");
        }

        #region Email
        public async Task<AsyncResult<bool>> VerifyEmailMFA(Guid targetUser, short deviceId, string emailCode)
        {
            var now = DateTimeOffset.UtcNow;
            var emailToken = await _Db.GetByIdAsync<UserToken, (short, Guid, UserTokenType)>((deviceId, targetUser, UserTokenType.EmailMFA));
            if (emailToken.Value == null ||
                emailToken.Value.ExpiresAt <= now ||
               (emailToken.Value.RevokedAt != null && emailToken.Value.RevokedAt < now) ||
                !_Tokens.VerifyToken(emailCode, emailToken.Value.Token))
                return new(ErrorHelper.FromCode(Socigy.Structures.API.Enums.ErrorCode.INVALID_MFA_CODE_ERROR));

            // Deleting used Email token
            if (!await emailToken.Value.TryDeleteAsync<UserToken, (short, Guid, UserTokenType)>(_Db))
                _Logger.LogWarning("Failed to delete email MFA token");

            var mfaSettings = (await _Db.GetByIdAsync<MFASettings, (MfaType, Guid)>((MfaType.Email, targetUser))).Value;
            if (mfaSettings == null)
                return new(ErrorHelper.FromCode(Socigy.Structures.API.Enums.ErrorCode.UNEXPECTED_ERROR));

            if (!mfaSettings.IsEnabled)
            {
                mfaSettings.IsEnabled = true;
                mfaSettings.UpdatedAt = DateTime.UtcNow;
                await mfaSettings.UpdateAsync<MFASettings, (MfaType, Guid)>(_Db, null, nameof(MFASettings.IsEnabled), nameof(MFASettings.UpdatedAt));

                await new SecurityLog()
                {
                    ID = (await SecurityLog.NextId(_Db, targetUser), targetUser),
                    Details = $"MFA of type Email was enabled",
                    EventType = Enums.SecurityEventType.MFA_REMOVED,
                    IpAddress = IPAddress.None, // LOW - Pass down the IP Address
                }.TryInsertAsyncOverride<SecurityLog, (int, Guid)>(_Db, false, overrides: ("arguments", NpgsqlDbType.Jsonb));

                // MEDIUM - Send better email
                var userDetails = await _User.GetUserInfoByIdInternalAsync(new UserInfoRequest() { TargetUserId = targetUser.ToString() });
                await _Emails.BuildEmail()
                    .WithReceiver(userDetails.FirstName, userDetails.Email)
                    .WithSubject("Security Alert - MFA method enabled")
                    .WithBody("Security alert. Email MFA method was enabled on your account...")
                    .SendAsync();
            }

            return new(emailToken.Value.IsRecovery);
        }

        public async Task SendEmailMFA(Guid targetUser, short deviceId, string email, string firstName, bool recovery = false)
        {
            var emailToken = await _Tokens.GenerateEmailMfaCode(targetUser, deviceId);
            emailToken.Token.IsRecovery = recovery;

            if ((await emailToken.Token.TryInsertAsync<UserToken, (short, Guid, UserTokenType)>(_Db, false)) == null)
            {
                await emailToken.Token.UpdateAsync<UserToken, (short, Guid, UserTokenType)>(_Db, null,
                    nameof(UserToken.IssuedAt),
                    nameof(UserToken.ExpiresAt),
                    nameof(UserToken.RevokedAt),
                    nameof(UserToken.IsRecovery),
                    nameof(UserToken.Token));
            }

            string emailCode = $"{emailToken.Raw[..3]} {emailToken.Raw[3..]}";
            await _Emails.BuildEmail()
                .WithSubject("🌟 Almost There! Please Verify Your Email to Get Started ✨")
                .WithBody(new CodeVerificationTemplate()
                {
                    CodeLifespan = Constants.Auth.Tokens.EmailVerificationValidity,

                    Title = "Verify your email address",
                    Description = "Please click the button below or type in your code in the app to confirm your email address and finish setting up your account",
                    Code = emailCode,
                    ButtonText = "Verify email",
                    LinkText = "Email verification link",
                    UrlLink = $"https://socigy.com/mfa/validate?type=email&code={Base64Url.EncodeToString(Encoding.UTF8.GetBytes(emailCode.Replace(" ", "")))}&email={Base64Url.EncodeToString(Encoding.UTF8.GetBytes(email))}",
                    EndDescription = "If you did not sign up for an account, please ignore this email",
                }
                .TransformText())
                .WithReceiver(firstName, email).SendAsync();
        }
        #endregion

        #region TOTP
        private static string GenerateTotpSecret()
        {
            var randomBytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomBytes);
            }

            return Convert.ToBase64String(randomBytes);
        }
        private string Base32Encode(string base64Secret)
        {
            var bytes = Convert.FromBase64String(base64Secret);
            const string alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

            int bitsLeft = 0;
            int buffer = 0;
            var result = new StringBuilder();

            foreach (byte b in bytes)
            {
                buffer = (buffer << 8) | b;
                bitsLeft += 8;
                while (bitsLeft >= 5)
                {
                    int index = (buffer >> (bitsLeft - 5)) & 31;
                    bitsLeft -= 5;
                    result.Append(alphabet[index]);
                }
            }

            if (bitsLeft > 0)
            {
                int index = (buffer << (5 - bitsLeft)) & 31;
                result.Append(alphabet[index]);
            }

            return result.ToString();
        }

        public string GenerateTotpUri(string secret, string accountName, string issuer)
        {
            var encodedIssuer = Uri.EscapeDataString(issuer);
            var encodedAccount = Uri.EscapeDataString(accountName);
            return $"otpauth://totp/{encodedIssuer}:{encodedAccount}?secret={Base32Encode(secret)}&issuer={encodedIssuer}&algorithm=SHA1&digits={_Digits}&period={(int)_TimeStep.TotalSeconds}";
        }
        public async Task<(string Url, string[] BackupCodes)?> EnableTotpAsync(Guid targetUser, short deviceId)
        {
            string secret = GenerateTotpSecret();

            var mfa = (await _Db.GetByIdAsync<MFASettings, (MfaType, Guid)>((MfaType.Authenticator, targetUser))).Value;
            if (mfa != null)
                return null;

            await new MFASettings()
            {
                ID = (MfaType.Authenticator, targetUser),
                Secret = EncryptSecret(secret),
                IsEnabled = false
            }.TryInsertAsync<MFASettings, (MfaType, Guid)>(_Db, false);

            await new UserToken()
            {
                ID = (deviceId, targetUser, UserTokenType.TotpMFA),
                IsRecovery = false,
                ExpiresAt = null,
                RevokedAt = null,
                LastUsedAt = null,
                FailedAttempts = 0
            }.TryInsertAsync<UserToken, (short, Guid, UserTokenType)>(_Db, false);

            var backupCodes = await GenerateBackupCodesAsync(targetUser);
            if (backupCodes == null)
                return null;

            var details = await _User.GetUserInfoByIdInternalAsync(new UserInfoRequest() { TargetUserId = targetUser.ToString() });
            await _Emails.BuildEmail()
                .WithReceiver(details.FirstName, details.LastName)
                .WithSubject("Security Alert - Authenticator MFA was enabled")
                .WithBody("Security Alert - Authenticator MFA was enabled")
                .SendAsync();

            return (GenerateTotpUri(secret, $"Socigy - {details.Username} #{details.Tag.ToString("D4")}", "Socigy"), backupCodes);
        }
        public async Task<bool> DisableTotpAsync(Guid targetUser, short deviceId, bool sendEmails = true)
        {
            var defaultMfa = await GetDefaultMfa(targetUser);
            if (defaultMfa == null || defaultMfa.ID.Item1 == MfaType.Authenticator)
                return false;

            await _Db.DeleteByIdAsync<MFASettings, (MfaType, Guid)>(new() { ID = (MfaType.Authenticator, targetUser) });
            await _Db.ExecuteNonQueryAsync($"DELETE FROM {_Db.GetTableName<UserToken>()} WHERE user_uuid = @user_id AND token_type = IN(@token_types)", null,
                ("user_id", targetUser),
                ("token_types", new UserTokenType[] { UserTokenType.TotpMFABackup, UserTokenType.TotpMFA }));

            var details = await _User.GetUserInfoByIdInternalAsync(new UserInfoRequest() { TargetUserId = targetUser.ToString() });
            await _Emails.BuildEmail()
                .WithReceiver(details.FirstName, details.LastName)
                .WithSubject("Security Alert - Authenticator MFA was removed")
                .WithBody($"Security Alert - Authenticator MFA was removed from device {deviceId}")
                .SendAsync();

            return true;
        }

        public async Task<AsyncResult<(string Url, string[] BackupCodes)>> RecoverTotp(Guid targetUser, string backupCode, short deviceId)
        {
            if (await IsRateLimited(targetUser, deviceId))
                return new(ErrorHelper.FromCode(Socigy.Structures.API.Enums.ErrorCode.TOO_MANY_ATTEMPTS_ERROR));

            var foundToken = (await _Db.GetByIdAsync<UserToken, (short, Guid, UserTokenType)>((deviceId, targetUser, UserTokenType.TotpMFA))).Value;
            foundToken ??= await new UserToken()
            {
                ID = (deviceId, targetUser, UserTokenType.TotpMFA),
                IsRecovery = false,
                ExpiresAt = null,
                RevokedAt = null,
                LastUsedAt = null,
                FailedAttempts = 0
            }.TryInsertAsync<UserToken, (short, Guid, UserTokenType)>(_Db, false);
            if (foundToken == null)
                return new(ErrorHelper.FromCode(Socigy.Structures.API.Enums.ErrorCode.UNEXPECTED_ERROR));

            var recovery = (await _Db.GetByIdAsync<UserToken, (short, Guid, UserTokenType)>((0, targetUser, UserTokenType.TotpMFABackup))).Value;
            if (recovery == null)
                return new(ErrorHelper.FromCode(Socigy.Structures.API.Enums.ErrorCode.UNEXPECTED_ERROR));

            if (recovery.Token.Split(' ').FirstOrDefault(x => x == HashCode(backupCode)) == null)
            {
                foundToken.FailedAttempts++;
                foundToken.LastUsedAt = DateTime.UtcNow;
                await foundToken.UpdateAsync<UserToken, (short, Guid, UserTokenType)>(_Db, null,
                    nameof(UserToken.FailedAttempts),
                    nameof(UserToken.LastUsedAt));

                return new(ErrorHelper.FromCode(Socigy.Structures.API.Enums.ErrorCode.INVALID_MFA_CODE_ERROR));
            }

            await DisableTotpAsync(targetUser, deviceId, false);
            var response = await EnableTotpAsync(targetUser, deviceId);
            if (response == null)
                return new(ErrorHelper.FromCode(Socigy.Structures.API.Enums.ErrorCode.CONTACT_SUPPORT, "TOTP_MFA_CRITICAL"));

            return new(response.Value);
        }

        private string EncryptSecret(string secret)
        {
            return _Protector.Protect(secret);
        }
        private string DecryptSecret(string encryptedSecret)
        {
            return _Protector.Unprotect(encryptedSecret);
        }

        private async Task<bool> IsRateLimited(Guid targetUser, short deviceId)
        {
            var token = (await _Db.GetByIdAsync<UserToken, (short, Guid, UserTokenType)>((deviceId, targetUser, UserTokenType.TotpMFA))).Value;
            if (token == null)
                return false;

            if (token.FailedAttempts >= _MaxFailedAttempts)
            {
                var lastAttempt = token.LastUsedAt ?? DateTime.UtcNow;
                if (lastAttempt.AddMinutes(_LockoutMinutes) > DateTime.UtcNow)
                    return true;

                token.FailedAttempts = 0;
                await token.UpdateAsync<UserToken, (short, Guid, UserTokenType)>(_Db, null, nameof(UserToken.FailedAttempts));
            }

            return false;
        }
        public async Task<AsyncResult<bool>> VerifyTotpCode(Guid targetUser, string code, short deviceId, DateTime? time = null, int windowSize = 1)
        {
            if (await IsRateLimited(targetUser, deviceId))
                return new(ErrorHelper.FromCode(Socigy.Structures.API.Enums.ErrorCode.TOO_MANY_ATTEMPTS_ERROR));

            var currentTime = time ?? DateTime.UtcNow;
            var mfaSetting = (await _Db.GetByIdAsync<MFASettings, (MfaType, Guid)>((MfaType.Authenticator, targetUser))).Value;
            if (mfaSetting == null || mfaSetting.Secret == null)
                return new(ErrorHelper.FromCode(Socigy.Structures.API.Enums.ErrorCode.TOTP_NOT_ENABLED));

            var foundToken = (await _Db.GetByIdAsync<UserToken, (short, Guid, UserTokenType)>((deviceId, targetUser, UserTokenType.TotpMFA))).Value;
            foundToken ??= await new UserToken()
            {
                ID = (deviceId, targetUser, UserTokenType.TotpMFA),
                IsRecovery = false,
                ExpiresAt = null,
                RevokedAt = null,
                LastUsedAt = null,
                FailedAttempts = 0
            }.TryInsertAsync<UserToken, (short, Guid, UserTokenType)>(_Db, false);
            if (foundToken == null)
                return new(ErrorHelper.FromCode(Socigy.Structures.API.Enums.ErrorCode.UNEXPECTED_ERROR));

            if (foundToken.RevokedAt.HasValue)
                return new(ErrorHelper.FromCode(Socigy.Structures.API.Enums.ErrorCode.TOTP_REVOKED));

            var secret = DecryptSecret(mfaSetting.Secret!);
            for (int i = -windowSize; i <= windowSize; i++)
            {
                var checkTime = currentTime.AddSeconds(i * _TimeStep.TotalSeconds);
                var expectedCode = GenerateCode(secret, checkTime);
                if (expectedCode == code)
                {
                    if (!mfaSetting.IsEnabled)
                    {
                        mfaSetting.IsEnabled = true;
                        await mfaSetting.UpdateAsync<MFASettings, (MfaType, Guid)>(_Db, null, nameof(MFASettings.IsEnabled));
                    }

                    foundToken.LastUsedAt = DateTime.UtcNow;
                    foundToken.FailedAttempts = 0;
                    await foundToken.UpdateAsync<UserToken, (short, Guid, UserTokenType)>(_Db, null,
                        nameof(UserToken.LastUsedAt),
                        nameof(UserToken.FailedAttempts));

                    return new(foundToken.IsRecovery);
                }
            }

            foundToken.FailedAttempts++;
            foundToken.LastUsedAt = DateTime.UtcNow;
            await foundToken.UpdateAsync<UserToken, (short, Guid, UserTokenType)>(_Db, null,
                nameof(UserToken.FailedAttempts),
                nameof(UserToken.LastUsedAt));

            return new(ErrorHelper.FromCode(Socigy.Structures.API.Enums.ErrorCode.INVALID_MFA_CODE_ERROR));
        }

        public async Task<string[]?> GenerateBackupCodesAsync(Guid targetUser)
        {
            if ((await _Db.GetByIdAsync<UserToken, (short, Guid, UserTokenType)>((0, targetUser, UserTokenType.TotpMFABackup))).Value != null)
                return null; // Already generated

            const int numberOfCodes = 10;
            const int codeLength = 8;
            var codes = new string[numberOfCodes];

            for (int i = 0; i < numberOfCodes; i++)
            {
                var codeBytes = new byte[codeLength];
                using (var rng = RandomNumberGenerator.Create())
                {
                    rng.GetBytes(codeBytes);
                }

                codes[i] = BitConverter.ToString(codeBytes).Replace("-", "")[..codeLength];
            }

            var backupToken = new UserToken()
            {
                ID = (0, targetUser, UserTokenType.TotpMFABackup),
                IsRecovery = true,
                ExpiresAt = null,
                Token = string.Join(' ', codes.Select(HashCode)),
                RevokedAt = null
            };

            await backupToken.TryInsertAsync<UserToken, (short, Guid, UserTokenType)>(_Db, false);

            return codes;
        }
        private string HashCode(string code)
        {
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(code));
            return Convert.ToBase64String(hash);
        }

        private static string GenerateCode(string secret, DateTime? time = null)
        {
            var counter = GetCounter(time ?? DateTime.UtcNow);
            var secretBytes = Convert.FromBase64String(secret);

            using var hmac = new HMACSHA1(secretBytes);
            var counterBytes = BitConverter.GetBytes(counter);
            if (BitConverter.IsLittleEndian)
                Array.Reverse(counterBytes);

            var hash = hmac.ComputeHash(counterBytes);

            var offset = hash[^1] & 0x0F;
            var binary =
                ((hash[offset] & 0x7F) << 24) |
                ((hash[offset + 1] & 0xFF) << 16) |
                ((hash[offset + 2] & 0xFF) << 8) |
                (hash[offset + 3] & 0xFF);

            var code = binary % (int)Math.Pow(10, _Digits);
            return code.ToString().PadLeft(_Digits, '0');
        }
        private static long GetCounter(DateTime time)
        {
            var unixEpoch = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            var elapsedTime = time - unixEpoch;
            return (long)(elapsedTime.TotalSeconds / _TimeStep.TotalSeconds);
        }
        #endregion

        #region Default
        public async Task<MFASettings?> GetDefaultMfa(Guid targetUser)
        {
            return await _Db.GetWhen<MFASettings, (MfaType, Guid)>("user_uuid = @user_id AND is_default = TRUE", null,
                ("user_id", targetUser));
        }

        public async Task<MfaType?> ExecuteDefaultMfa(Guid targetUser, short deviceId, bool recovery = false)
        {
            var defaultMfa = await GetDefaultMfa(targetUser);
            if (defaultMfa == null)
            {
                // Auto enabling email mfa
                defaultMfa = await new MFASettings()
                {
                    ID = (MfaType.Email, targetUser),
                    IsDefault = true,
                    IsEnabled = true
                }.TryInsertAsync<MFASettings, (MfaType, Guid)>(_Db, false);
                if (defaultMfa == null)
                    return null;
            }

            switch (defaultMfa.ID.Item1)
            {
                case MfaType.Email:
                    {
                        var userInfo = await _User.GetUserInfoByIdInternalAsync(new UserInfoRequest() { TargetUserId = targetUser.ToString() });
                        if (userInfo == null)
                            return null;

                        await SendEmailMFA(targetUser, deviceId, userInfo.Email, userInfo.FirstName, recovery);
                    }
                    break;
            }

            return defaultMfa.ID.Item1;
        }
        #endregion
    }
}

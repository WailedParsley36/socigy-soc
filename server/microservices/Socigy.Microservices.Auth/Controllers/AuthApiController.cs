using Azure;
using Azure.Core;
using Fido2NetLib;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Server.HttpSys;
using NpgsqlTypes;
using Org.BouncyCastle.Asn1.Ocsp;
using Socigy.Connectors.User.Info;
using Socigy.Microservices.Auth.Enums;
using Socigy.Microservices.Auth.Middlewares;
using Socigy.Microservices.Auth.Requests;
using Socigy.Microservices.Auth.Resources.EmailTemplates;
using Socigy.Microservices.Auth.Responses;
using Socigy.Microservices.Auth.Services;
using Socigy.Microservices.Auth.Structures;
using Socigy.Middlewares.Attributes;
using Socigy.Middlewares.Helpers;
using Socigy.Services.Communication;
using Socigy.Services.Database;
using Socigy.Services.Emailing;
using Socigy.Structures;
using Socigy.Structures.API;
using Socigy.Structures.API.Enums;
using Socigy.Structures.Helpers;
using System;
using System.Buffers.Text;
using System.Reflection.Metadata.Ecma335;
using System.Text;
using System.Text.Json.Serialization.Metadata;
using UAParser;

namespace Socigy.Microservices.Auth.Controllers
{
    [Auth]
    public class AuthApiController : BaseApiController
    {
        private readonly IDatabaseService _Db;
        private readonly UserInfoGrpcService.UserInfoGrpcServiceClient _User;
        private readonly IEmailService _Emails;
        private readonly ITokenService _Tokens;
        private readonly IMFAService _Mfa;
        private readonly IFido2Service _Fido;
        private readonly IAntiforgery _AntiForgery;
        public AuthApiController(IJsonTypeInfoResolver jsonTypeInfoResolver,
            ITokenService tokens,
            IDatabaseService db,
            UserInfoGrpcService.UserInfoGrpcServiceClient userService,
            IEmailService emailing,
            IMFAService mfa,
            IFido2Service fido,
            IAntiforgery antiForgery) : base(jsonTypeInfoResolver)
        {
            _Db = db;
            _User = userService;
            _Emails = emailing;
            _Tokens = tokens;
            _Mfa = mfa;
            _Fido = fido;
            _AntiForgery = antiForgery;
        }

        #region MFA

        [Auth(Ignore = true)]
        public async Task<IResult> VerifyEmailCode(HttpContext context)
        {
            var deviceInfo = UserAgentHelper.GetUserDeviceInfo(context);
            var request = await RequestAsync<EmailMfaCodeRequest>(context);
            if (request.Error != null)
                return request.Error;

            var deviceFingerprint = Socigy.Middlewares.AuthMiddleware.GetHashedFingerprint(context);
            if (deviceFingerprint == null)
                return BadRequest();

            var uuid = request.Result!.UserId;
            var foundUser = await _User.GetUserInfoByIdInternalAsync(new UserInfoRequest() { TargetUserId = uuid.ToString() });
            if (foundUser == null)
                return BadRequest();

            var device = await GetUserDevice(uuid, deviceFingerprint);
            if (device == null)
                return Error(ErrorCode.EXISTING_DEVICE_REQUIRED_ERROR);

            var result = await _Mfa.VerifyEmailMFA(uuid, device.ID.Item1, request.Result!.Code);
            if (result.Error != null)
                return Error(result.Error);

            // Sets EmailVerified to true
            await _User.VerifyUserEmailInternalAsync(new UserInfoRequest() { TargetUserId = uuid.ToString() });

            var tokenResponse = await GenerateTokensForUser(uuid, device.ID.Item1, foundUser.Username, (short)foundUser.Tag);
            if (tokenResponse == null)
                return Unexpected();

            if (request.Result.Trust.HasValue && request.Result.Trust.Value)
            {
                device.IsTrusted = true;
                await device.UpdateAsync<UserDevice, (short, Guid)>(_Db, null, nameof(UserDevice.IsTrusted));

                await _Emails.BuildEmail()
                    .WithReceiver(foundUser.FirstName, foundUser.Email)
                    .WithSubject($"Device {device.DeviceName} is trusted now")
                    .WithBody($"Device {device.DeviceName} has been added to trusted devices. If this wasn't you please take an action to secure your account")
                    .SendAsync();
            }

            tokenResponse.IsRecovery = result.Result;
            if (deviceInfo.Type.HasFlag(Socigy.Structures.Enums.DeviceType.App))
                return Response(tokenResponse);

            AddAuthCookies(context, tokenResponse.AccessToken!, tokenResponse.RefreshToken!, tokenResponse.AccessExpiry, tokenResponse.RefreshExpiry);

            // Removing the from body
            tokenResponse.AccessToken = null;
            tokenResponse.RefreshToken = null;

            return Response(tokenResponse);
        }

        [Auth(Ignore = true)]
        public async Task<IResult> ResendEmailCode(HttpContext context)
        {
            var request = await GetFromBodyAsync<UserIdRequest>(context);
            if (request == null)
                return BadRequest();

            var deviceFingerprint = Socigy.Middlewares.AuthMiddleware.GetHashedFingerprint(context);
            if (deviceFingerprint == null)
                return BadRequest();

            var device = await GetUserDevice(request.UserId, deviceFingerprint);
            if (device == null)
                return Error(ErrorCode.EXISTING_DEVICE_REQUIRED_ERROR);

            var foundUser = await _User.GetUserInfoByIdInternalAsync(new UserInfoRequest() { TargetUserId = request.UserId.ToString() });
            if (foundUser == null)
                return BadRequest();

            var mfa = await _Db.GetByIdAsync<UserToken, (short, Guid, UserTokenType)>((device.ID.Item1, request.UserId, UserTokenType.EmailMFA));
            if (mfa.Value == null || mfa.Value.ExpiresAt < DateTimeOffset.UtcNow)
                return Results.Unauthorized();
            else if ((DateTimeOffset.UtcNow - mfa.Value.IssuedAt!.Value).TotalSeconds < Constants.Auth.Tokens.EmailCodeInterval)
                return Results.BadRequest();

            await _Mfa.SendEmailMFA(request.UserId, (short)device.ID.Item1, foundUser.Email, foundUser.FirstName);

            return Results.Ok();
        }

        public async Task<IResult> VerifyTotp(HttpContext context)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var deviceInfo = UserAgentHelper.GetUserDeviceInfo(context);

            var uuid = Guid.Parse(currentUser.UserId);

            var request = await RequestAsync<TotpCodeRequest>(context);
            if (request.Error != null)
                return request.Error;
            else if (request.Result!.Code == null)
                return BadRequest();

            var secret = await _Mfa.VerifyTotpCode(uuid, request.Result.Code, (short)currentUser.DeviceId);
            if (secret.Error != null)
                return Error(secret.Error);

            var userInfo = AuthMiddleware.SplitUsernameAndTag(currentUser);
            if (!userInfo.HasValue)
                return Unexpected();

            var tokenResponse = await GenerateTokensForUser(uuid, (short)currentUser.DeviceId, userInfo.Value.Username, userInfo.Value.Tag);
            if (tokenResponse == null)
                return Unexpected();

            tokenResponse.IsRecovery = false;
            if (deviceInfo.Type.HasFlag(Socigy.Structures.Enums.DeviceType.App))
                return Response(tokenResponse);

            if (request.Result.Trust.HasValue && request.Result.Trust.Value)
            {
                var device = (await _Db.GetByIdAsync<UserDevice, (short, Guid)>(((short)currentUser.DeviceId, uuid))).Value;
                if (device == null)
                    return Unexpected();

                device.IsTrusted = true;
                await device.UpdateAsync<UserDevice, (short, Guid)>(_Db, null, nameof(UserDevice.IsTrusted));

                var userDetails = await _User.GetUserInfoByIdInternalAsync(new UserInfoRequest() { TargetUserId = uuid.ToString() });
                await _Emails.BuildEmail()
                    .WithReceiver(userDetails.FirstName, userDetails.Email)
                    .WithSubject($"Device {device.DeviceName} is trusted now")
                    .WithBody($"Device {device.DeviceName} has been added to trusted devices. If this wasn't you please take an action to secure your account")
                    .SendAsync();
            }

            AddAuthCookies(context, tokenResponse.AccessToken!, tokenResponse.RefreshToken!, tokenResponse.AccessExpiry, tokenResponse.RefreshExpiry);

            // Removing the from body
            tokenResponse.AccessToken = null;
            tokenResponse.RefreshToken = null;

            return Response(tokenResponse);
        }
        public async Task<IResult> RecoveryThroughTotp(HttpContext context)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var deviceInfo = UserAgentHelper.GetUserDeviceInfo(context);

            var uuid = Guid.Parse(currentUser.UserId);

            var request = await RequestAsync<TotpCodeRequest>(context);
            if (request.Error != null)
                return request.Error;
            else if (request.Result!.RecoveryCode == null)
                return BadRequest();

            var secret = await _Mfa.RecoverTotp(uuid, request.Result.RecoveryCode, (short)currentUser.DeviceId);
            if (secret.Error != null)
                return Error(secret.Error);

            return Response(new EnableTotpResponse()
            {
                BackupCodes = secret.Result.BackupCodes,
                Url = secret.Result.Url
            });
        }
        #endregion

        #region Registration
        [Auth(Ignore = true)]
        public async Task<IResult> RegisterAsync(HttpContext context)
        {
            var request = await RequestAsync<RegistrationRequest>(context, _Db, _User);
            if (request.Error != null || request.Result == null)
                return request.Error!;

            var info = UserAgentHelper.GetUserDeviceInfo(context);
            var deviceFingerprint = Socigy.Middlewares.AuthMiddleware.GetHashedFingerprint(context);
            if (deviceFingerprint == null)
                return BadRequest();

            string[] nameParts = request.Result.FullName.Split(" ");
            var result = await _User.RegisterNewUserInternalAsync(new()
            {
                Email = request.Result.Email,

                Username = request.Result.Username,
                Tag = request.Result.Tag,

                FirstName = nameParts[0],
                LastName = string.Join(' ', nameParts[1..]),
            });
            if (result == null)
                return Unexpected();

            var uuid = Guid.Parse(result.NewUserId);
            var newDevice = await new UserDevice()
            {
                ID = (0, uuid),
                DeviceName = info.Name,
                Type = info.Type,
                Fingerprint = deviceFingerprint,
            }.TryInsertAsync<UserDevice, (short, Guid)>(_Db, false);
            if (newDevice == null)
            {
                await _User.RemoveRegisteredNewUserInternalAsync(new() { TargetUserId = result.NewUserId });
                return Unexpected();
            }

            var loginAttempt = await new UserLoginAttempt()
            {
                ID = (0, uuid),
                Success = true,
                DeviceId = newDevice.ID.Item1,
                IpAddress = info.IP,
                UserAgent = context.Request.Headers.UserAgent.ToString(),
            }.TryInsertAsync<UserLoginAttempt, (int, Guid)>(_Db, false);
            if (loginAttempt == null)
            {
                await newDevice.DeleteAsync<UserDevice, (short, Guid)>(_Db);
                await _User.RemoveRegisteredNewUserInternalAsync(new() { TargetUserId = result.NewUserId });
                return Unexpected();
            }

            // MFA
            var mfaSettings = await new MFASettings()
            {
                ID = ((short)MfaType.Email, uuid),
                IsEnabled = true,
                IsDefault = true,
            }.TryInsertAsync<MFASettings, (MfaType, Guid)>(_Db, false);
            await _Mfa.SendEmailMFA(uuid, newDevice.ID.Item1, request.Result.Email, nameParts[0]);

            // Generating passkey token
            var passkeyChallenge = await _Tokens.GeneratePasskeyChallenge(uuid, newDevice.ID.Item1);
            await passkeyChallenge.Token.TryInsertAsync<UserToken, (short, Guid, UserTokenType)>(_Db, false);

            // Response
            var tokenResponse = await GenerateTokensForUser(uuid, newDevice.ID.Item1, request.Result.Username, request.Result.Tag);
            if (tokenResponse == null)
                return Unexpected();

            tokenResponse.Challenge = passkeyChallenge.Raw;
            if (info.Type.HasFlag(Socigy.Structures.Enums.DeviceType.App))
                return Response(tokenResponse);

            AddAuthCookies(context, tokenResponse.AccessToken, tokenResponse.RefreshToken, tokenResponse.AccessExpiry, tokenResponse.RefreshExpiry);

            // Removing the from body
            tokenResponse.AccessToken = null;
            tokenResponse.RefreshToken = null;

            return Response(tokenResponse);
        }

        [Auth(false, true)]
        public async Task<IResult> LinkUserPasskey(HttpContext context)
        {
            var requestResult = await GetFromBodyAsync<AuthenticatorAttestationRawResponse>(context);
            if (requestResult == null)
                return BadRequest();

            var deviceInfo = UserAgentHelper.GetUserDeviceInfo(context);
            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var uuid = Guid.Parse(currentUser.UserId);

            var userDevice = await _Db.GetByIdAsync<UserDevice, (short, Guid)>(((short)currentUser.DeviceId, uuid));
            if (userDevice.Value == null || userDevice.Value.IsBlocked)
                return Results.Unauthorized();

            var passkeyChallenge = await _Db.GetByIdAsync<UserToken, (short, Guid, UserTokenType)>(((short)currentUser.DeviceId, uuid, UserTokenType.PasskeyChallenge));
            if (passkeyChallenge.Value == null)
                return Error(ErrorCode.BAD_REQUEST_ERROR);

            var passkeyResult = await _Fido.LinkPasskeyTo(passkeyChallenge.Value, requestResult);
            if (passkeyResult.Error != null)
                return Error(passkeyResult.Error);

            await passkeyChallenge.Value.DeleteAsync<UserToken, (short, Guid, UserTokenType)>(_Db);

            var userInfo = await _User.GetUserInfoByIdInternalAsync(new UserInfoRequest() { TargetUserId = currentUser.UserId });
            if (userInfo == null)
                return Unexpected();

            if (AuthMiddleware.IsRegistered(context) != false)
            {
                // OPTIMAL - Send BETTER email notification about new passkey being linked to the account
                await _Emails.BuildEmail()
                    .WithReceiver(userInfo.FirstName, userInfo.Email)
                    .WithSubject("Security Alert - New Passkey was linked to your account")
                    .WithBody("Security alert! If this wasn't you, take immediate action!")
                    .SendAsync();
            }

            await new SecurityLog()
            {
                ID = (await SecurityLog.NextId(_Db, uuid), uuid),
                Details = $"New passkey has been linked to {userDevice.Value.DeviceName} device",
                EventType = SecurityEventType.NEW_PASSKEY_LINKED_TO_ACCOUNT,
                IpAddress = deviceInfo.IP,
                Arguments = $"{{\"deviceId\":{currentUser.DeviceId}}}"
            }.TryInsertAsyncOverride<SecurityLog, (int, Guid)>(_Db, false, overrides: ("arguments", NpgsqlDbType.Jsonb));

            return Results.Ok();
        }

        [Auth(false, true)]
        public async Task<IResult> GenerateLinkUserPasskeyChallenge(HttpContext context)
        {
            var deviceInfo = UserAgentHelper.GetUserDeviceInfo(context);
            var currentUser = AuthMiddleware.GetCurrentUser(context)!;
            var uuid = Guid.Parse(currentUser.UserId);

            var foundChallenge = (await _Db.GetByIdAsync<UserToken, (short, Guid, UserTokenType)>(((short)currentUser.DeviceId, uuid, UserTokenType.PasskeyChallenge))).Value;
            var utcNow = DateTime.UtcNow;
            if (foundChallenge != null && foundChallenge.RevokedAt > utcNow)
                return Error(ErrorCode.REVOKED_ERROR, args: "passkey challenge");

            var generated = await _Tokens.GeneratePasskeyChallenge(uuid, (short)currentUser.DeviceId);
            if (foundChallenge == null)
            {
                await generated.Token.TryInsertAsync<UserToken, (short, Guid, UserTokenType)>(_Db, false);
            }
            else
            {
                await generated.Token.UpdateAsync<UserToken, (short, Guid, UserTokenType)>(_Db, null,
                    nameof(UserToken.IssuedAt),
                    nameof(UserToken.Token),
                    nameof(UserToken.ExpiresAt),
                    nameof(UserToken.RevokedAt),
                    nameof(UserToken.FailedAttempts),
                    nameof(UserToken.LastUsedAt));
            }

            return Response(new TokenResponse
            {
                Challenge = generated.Raw
            });
        }
        #endregion

        #region Auth
        [Auth(Ignore = true)]
        public async Task<IResult> GetPasskeyChallengeFor(HttpContext context)
        {
            var request = await RequestAsync<PasskeysLoginRequest>(context);
            if (request.Error != null)
                return request.Error;

            var checkRequest = new CheckInfoExistsInternalRequest();
            if (request.Result!.Email != null)
                checkRequest.Email = request.Result.Email;
            else if (request.Result!.Username != null && request.Result.Tag.HasValue)
            {
                checkRequest.Tag = request.Result.Tag.Value;
                checkRequest.Username = request.Result.Username;
            }
            else
                return BadRequest();

            var response = await _User.CheckUserInfoExistsInternalAsync(checkRequest);
            if (!response.Result)
                return Results.NotFound();

            var isRegistrationComplete = await _User.CheckUserIsRegisteredInternalAsync(new UserInfoRequest() { TargetUserId = response.UserUuid });
            if (!isRegistrationComplete.Result)
                return Error(ErrorCode.REGISTRATION_NOT_COMPLETED_ERROR);

            var uuid = Guid.Parse(response.UserUuid);
            var deviceInfo = UserAgentHelper.GetUserDeviceInfo(context);
            var deviceFingerprint = Socigy.Middlewares.AuthMiddleware.GetHashedFingerprint(context);
            if (deviceFingerprint == null)
                return BadRequest();

            var foundDevice = await GetUserDevice(uuid, deviceFingerprint);
            if (foundDevice == null)
            {
                var deviceResult = await RegisterNewUserDevice(uuid, deviceInfo, deviceFingerprint);
                if (deviceResult.Error != null)
                    return Error(deviceResult.Error);

                foundDevice = deviceResult.Result;
            }
            else if (foundDevice.IsBlocked)
                return Results.Unauthorized();

            var passkeyChallenge = await _Tokens.GeneratePasskeyChallenge(uuid, foundDevice.ID.Item1);

            var now = DateTime.UtcNow;
            if (await passkeyChallenge.Token.TryInsertAsync<UserToken, (short, Guid, UserTokenType)>(_Db, false) == null)
            {
                await passkeyChallenge.Token.UpdateAsync<UserToken, (short, Guid, UserTokenType)>(_Db, null,
                    nameof(UserToken.IssuedAt),
                    nameof(UserToken.ExpiresAt),
                    nameof(UserToken.IsRecovery),
                    nameof(UserToken.Token),
                    nameof(UserToken.RevokedAt));
            }

            await new UserLoginAttempt()
            {
                ID = (await UserLoginAttempt.NextId(_Db, uuid), uuid),
                IpAddress = deviceInfo.IP,
                Success = null,
                UserAgent = context.Request.Headers.UserAgent.ToString(),
                DeviceId = foundDevice.ID.Item1,

            }.TryInsertAsync<UserLoginAttempt, (int, Guid)>(_Db, false);

            return Response(new PasskeyChallengeResponse()
            {
                User = new Fido2User()
                {
                    Id = uuid.ToByteArray(),
                    Name = response.Email,
                    DisplayName = UserHelper.FormatUsername(response.Username, (short)response.Tag),
                },
                Challenge = passkeyChallenge.Raw,
            });
        }
        [Auth(Ignore = true)]
        public async Task<IResult> SignInWithPasskey(HttpContext context)
        {
            var request = await RequestAsync<SignInWithPasskeyRequest>(context);
            if (request.Error != null)
                return request.Error;

            var deviceInfo = UserAgentHelper.GetUserDeviceInfo(context);
            var deviceFingerprint = Socigy.Middlewares.AuthMiddleware.GetHashedFingerprint(context);
            if (deviceFingerprint == null)
                return BadRequest();

            var userVerified = await _User.CheckUserIsRegisteredInternalAsync(new UserInfoRequest() { TargetUserId = request.Result!.UserId.ToString() });
            if (!userVerified.Result)
                return Error(ErrorCode.REGISTRATION_NOT_COMPLETED_ERROR);

            var userDevice = await GetUserDevice(request.Result!.UserId, deviceFingerprint);
            if (userDevice == null)
                return Error(ErrorCode.EXISTING_DEVICE_REQUIRED_ERROR);
            else if (userDevice.IsBlocked)
                return Results.Unauthorized();

            var passkeyChallenge = await _Db.GetByIdAsync<UserToken, (short, Guid, UserTokenType)>((userDevice.ID.Item1, request.Result.UserId, UserTokenType.PasskeyChallenge));
            if (passkeyChallenge.Value == null)
                return Results.Unauthorized();

            var userPasskey = await _Db.GetWhen<UserPasskey, (int, Guid)>("user_uuid = @user_id AND credential_id = @credential_id", null,
                ("user_id", request.Result.UserId),
                ("credential_id", request.Result.Credential.Id));
            if (userPasskey == null)
                return Error(ErrorCode.PASSKEY_CORRUPTED_ERROR);

            var result = await _Fido.ValidatePasskey(passkeyChallenge.Value, userPasskey, request.Result.Credential);
            if (!result)
                return Error(ErrorCode.PASSKEY_CORRUPTED_ERROR);

            // MFA
            if (!userDevice.IsTrusted)
            {
                var mfaType = await _Mfa.ExecuteDefaultMfa(request.Result.UserId, userDevice.ID.Item1);
                if (mfaType == null)
                    return Unexpected();

                return Response(new MfaRequiredResponse() { UserId = userPasskey.ID.Item2, Type = mfaType.Value });
            }

            var tokens = await GenerateTokensForUser(request.Result.UserId, userDevice.ID.Item1, userVerified.Username, (short)userVerified.Tag);
            if (tokens == null)
                return Unexpected();

            if (userDevice.IsNew)
            {
                var userInfo = await _User.GetUserInfoByIdInternalAsync(new UserInfoRequest() { TargetUserId = request.Result.UserId.ToString() });

                // OPTIMAL - Better security alert message
                await _Emails.BuildEmail()
                    .WithReceiver(userInfo.FirstName, userInfo.Email)
                    .WithSubject("Security Alert - New Device Sign-In")
                    .WithBody("Security alert! If this wasn't your, take immediate action!")
                    .SendAsync();

                userDevice.IsNew = false;
                await userDevice.UpdateAsync<UserDevice, (short, Guid)>(_Db, null, nameof(UserDevice.IsNew));
            }

            await new UserLoginAttempt()
            {
                ID = (await UserLoginAttempt.NextId(_Db, userPasskey.ID.Item2), userPasskey.ID.Item2),
                IpAddress = deviceInfo.IP,
                Success = true,
                UserAgent = context.Request.Headers.UserAgent.ToString(),
                DeviceId = userDevice.ID.Item1,

            }.TryInsertAsync<UserLoginAttempt, (int, Guid)>(_Db, false);

            if (deviceInfo.Type.HasFlag(Socigy.Structures.Enums.DeviceType.App))
                return Response(tokens);

            AddAuthCookies(context, tokens.AccessToken!, tokens.RefreshToken!, tokens.AccessExpiry, tokens.RefreshExpiry);

            // Removing the from body
            tokens.AccessToken = null;
            tokens.RefreshToken = null;

            return Response(tokens);
        }

        [Auth]
        public async Task<IResult> Logout(HttpContext context)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context)!;

            context.Response.Cookies.Delete(Socigy.Middlewares.AuthMiddleware.AccessTokenCookie);
            context.Response.Cookies.Delete(Socigy.Middlewares.AuthMiddleware.RefreshTokenCookie);

            var guid = Guid.Parse(currentUser.UserId);
            // Access
            await _Db.TryDeleteByIdAsync<UserToken, (short, Guid, UserTokenType)>(new UserToken()
            {
                ID = ((short)currentUser.DeviceId, guid, UserTokenType.Access)
            });
            // Refresh
            await _Db.TryDeleteByIdAsync<UserToken, (short, Guid, UserTokenType)>(new UserToken()
            {
                ID = ((short)currentUser.DeviceId, guid, UserTokenType.Refresh)
            });

            return Results.Ok();
        }

        [Auth]
        public async Task<IResult> DeleteAccount(HttpContext context)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context)!;

            var userInfo = await _User.GetUserInfoByIdInternalAsync(new UserInfoRequest() { TargetUserId = currentUser.UserId });
            if (userInfo == null)
                return Unexpected();

            await _Emails.BuildEmail()
                .WithReceiver(userInfo.FirstName, userInfo.Email)
                .WithSubject("Account Removal - 30 days until removal")
                .SendAsync();

            var result = await new AccountRemoval()
            {
                ID = Guid.Parse(currentUser.UserId),
                Deadline = DateTime.UtcNow.AddDays(30)
            }.TryInsertAsync<AccountRemoval, Guid>(_Db);
            if (result == null)
                return Unexpected();

            // HIGH - Remove the account after 30 days using cron job which will be run each day and would check the DB for account-removals. It would also check if user has logged in after the creation date

            return Results.Ok();
        }
        #endregion

        #region Recovery
        [Auth(Ignore = true)]
        public async Task<IResult> RecoverAccount(HttpContext context)
        {
            var request = await RequestAsync<PasskeysLoginRequest>(context);
            if (request.Error != null)
                return request.Error;

            var checkRequest = new CheckInfoExistsInternalRequest();
            if (request.Result!.Email != null)
                checkRequest.Email = request.Result.Email;
            else if (request.Result!.Username != null && request.Result.Tag.HasValue)
            {
                checkRequest.Tag = request.Result.Tag.Value;
                checkRequest.Username = request.Result.Username;
            }
            else
                return BadRequest();

            var response = await _User.CheckUserInfoExistsInternalAsync(checkRequest);
            if (!response.Result)
                return Results.NotFound();

            var uuid = Guid.Parse(response.UserUuid);
            var userInfo = await _User.GetUserInfoByIdInternalAsync(new UserInfoRequest() { TargetUserId = response.UserUuid });

            var deviceInfo = UserAgentHelper.GetUserDeviceInfo(context);
            var deviceFingerprint = Socigy.Middlewares.AuthMiddleware.GetHashedFingerprint(context);
            if (deviceFingerprint == null)
                return BadRequest();

            var foundDevice = await GetUserDevice(uuid, deviceFingerprint);
            if (foundDevice == null)
            {
                var result = await RegisterNewUserDevice(uuid, deviceInfo, deviceFingerprint);
                if (result.Error != null)
                    return Unexpected();

                foundDevice = result.Result!;
            }

            await _Emails.BuildEmail()
                .WithReceiver(userInfo.FirstName, userInfo.Email)
                .WithSubject("Account Recovery - Take Action")
                .WithBody($"{(foundDevice.IsNew ? "This request comes from a new device. " : string.Empty)}If this wasn't you, take immediate action")
                .SendAsync();

            var mfaType = await _Mfa.ExecuteDefaultMfa(uuid, 0, true);
            if (!mfaType.HasValue)
                return Unexpected();

            return Response(new MfaRequiredResponse() { UserId = uuid, Type = mfaType.Value });
        }
        #endregion

        #region Token Automation
        private void AddAuthCookies(HttpContext context, string accessToken, string refreshToken, long accessExpiry, long refreshExpiry)
        {
            context.Response.Cookies.Append(Socigy.Middlewares.AuthMiddleware.AccessTokenCookie, accessToken, new CookieOptions()
            {
                HttpOnly = true,
                Secure = true,
                IsEssential = true,
                Domain = ".socigy.com",

                Expires = DateTimeOffset.FromUnixTimeSeconds(accessExpiry),
                SameSite = SameSiteMode.None
            });
            context.Response.Cookies.Append(Socigy.Middlewares.AuthMiddleware.RefreshTokenCookie, refreshToken, new CookieOptions()
            {
                HttpOnly = true,
                Secure = true,
                IsEssential = true,
                Domain = "api.socigy.com",

                Expires = DateTimeOffset.FromUnixTimeSeconds(refreshExpiry),
                SameSite = SameSiteMode.Strict
            });
        }
        private async Task<TokenResponse?> GenerateTokensForUser(Guid targetUser, short deviceId, string username, short tag)
        {
            var accessToken = await _Tokens.GenerateAccessToken(targetUser, deviceId, username, tag);
            var refreshToken = await _Tokens.GenerateRefreshToken(targetUser, deviceId, username, tag);

            await InsertOrUpdateToken(accessToken.Token);
            await InsertOrUpdateToken(refreshToken.Token);

            return new TokenResponse()
            {
                UserId = targetUser,

                AccessToken = accessToken.Raw,
                RefreshToken = refreshToken.Raw,

                AccessExpiry = new DateTimeOffset(accessToken.Token.ExpiresAt!.Value).ToUnixTimeSeconds(),
                RefreshExpiry = new DateTimeOffset(refreshToken.Token.ExpiresAt!.Value).ToUnixTimeSeconds(),
            };
        }
        private async Task InsertOrUpdateToken(UserToken token)
        {
            if (await token.TryInsertAsync<UserToken, (short, Guid, UserTokenType)>(_Db, false) == null)
                await token.UpdateAsync<UserToken, (short, Guid, UserTokenType)>(_Db, null,
                    nameof(UserToken.Token),
                    nameof(UserToken.ExpiresAt),
                    nameof(UserToken.IsRecovery),
                    nameof(UserToken.IssuedAt),
                    nameof(UserToken.RevokedAt));
        }
        #endregion

        #region User Devices
        private async Task<AsyncResult<UserDevice>> RegisterNewUserDevice(Guid targetUser, UserAgentDevice device, string fingerprint)
        {
            var result = await new UserDevice()
            {
                ID = (await UserDevice.NextId(_Db, targetUser), targetUser),
                Fingerprint = fingerprint,
                DeviceName = device.Name,
                IsNew = true,
                Type = device.Type
            }.TryInsertAsync<UserDevice, (short, Guid)>(_Db, false);
            if (result == null)
                return new(ErrorHelper.FromCode(ErrorCode.UNEXPECTED_ERROR));

            await new SecurityLog()
            {
                ID = (await SecurityLog.NextId(_Db, targetUser), targetUser),
                IpAddress = device.IP,
                Details = "New device bound to your user account",
                Arguments = $"{{\"deviceId\":{result.ID.Item1}}}"
            }.TryInsertAsyncOverride<SecurityLog, (int, Guid)>(_Db, false, overrides: ("arguments", NpgsqlDbType.Jsonb));

            return new(result);
        }
        private async Task<UserDevice?> GetUserDevice(Guid userId, string fingerprint)
        {
            return await _Db.GetWhen<UserDevice, (short, Guid)>("user_uuid = @user_id AND fingerprint = @fingerprint", null,
                ("user_id", userId),
                ("fingerprint", fingerprint));
        }
        #endregion

        [Auth(Ignore = true)]
        public async Task<IResult> AntiForgery(HttpContext context)
        {
            var tokens = _AntiForgery.GetAndStoreTokens(context);
            return Results.Ok();
        }

        public override void MapRoutes(IEndpointRouteBuilder routeBuilder)
        {
            routeBuilder.MapPost("/register", (Delegate)RegisterAsync);
            routeBuilder.MapGet("/passkey/link/generate", (Delegate)GenerateLinkUserPasskeyChallenge);
            routeBuilder.MapPost("/passkey/link", (Delegate)LinkUserPasskey);

            routeBuilder.MapGet("/logout", (Delegate)Logout);

            routeBuilder.MapPost("/challenge/passkey", (Delegate)GetPasskeyChallengeFor);
            routeBuilder.MapPost("/signIn/passkey", (Delegate)SignInWithPasskey);

            // LOW - Passkey unlink
            routeBuilder.MapPost("/passkey/unlink", (Delegate)LinkUserPasskey);

            routeBuilder.MapPost("/recover", (Delegate)RecoverAccount);

            routeBuilder.MapPost("/mfa/email", (Delegate)VerifyEmailCode);
            routeBuilder.MapPost("/mfa/email/resend", (Delegate)ResendEmailCode);

            routeBuilder.MapPost("/mfa/totp", (Delegate)VerifyTotp);
            routeBuilder.MapPost("/mfa/totp/recover", (Delegate)RecoveryThroughTotp);

            routeBuilder.MapGet("/antiforgery", (Delegate)AntiForgery);
            // HIGH - QR Code sign in
        }
    }
}
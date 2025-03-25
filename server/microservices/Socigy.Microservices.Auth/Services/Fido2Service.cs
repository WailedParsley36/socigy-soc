using Fido2NetLib.Objects;
using Fido2NetLib;
using Socigy.Structures;
using Socigy.Connectors.User.Info;
using Socigy.Microservices.Auth.Structures;
using NSec.Cryptography;
using Socigy.Structures.API.Communication;
using Socigy.Structures.API;
using Socigy.Services.Database;
using Socigy.Services.Communication;
using Serilog;

namespace Socigy.Microservices.Auth.Services
{
    public class Fido2Service : IFido2Service
    {
        private static readonly List<PubKeyCredParam> _PubKeyCredParams = [new(COSE.Algorithm.ES256), new(COSE.Algorithm.ES384), new(COSE.Algorithm.ES512), new(COSE.Algorithm.RS256), new(COSE.Algorithm.RS384), new(COSE.Algorithm.RS512)];
        public static readonly PublicKeyCredentialRpEntity _Rp = new("socigy.com", "Socigy");

        private readonly IFido2 Fido2;
        private readonly IDatabaseService _Db;
        public Fido2Service(IDatabaseService db)
        {
            _Db = db;
            Fido2 = new Fido2(new Fido2Configuration()
            {
                ChallengeSize = Constants.Auth.Tokens.PasskeyChallengeLength,
                ServerDomain = "socigy.com",
                ServerName = "Socigy",
                UndesiredAuthenticatorMetadataStatuses =
                [
                    AuthenticatorStatus.NOT_FIDO_CERTIFIED,
                    AuthenticatorStatus.REVOKED,

                    AuthenticatorStatus.USER_VERIFICATION_BYPASS,
                    AuthenticatorStatus.USER_KEY_PHYSICAL_COMPROMISE,
                    AuthenticatorStatus.USER_KEY_REMOTE_COMPROMISE
                ],
                Origins = ["https://localhost:80", "https://socigy.com:80", "https://socigy.com", "android:apk-key-hash:d98GqLz8bwmPhySsDCA2t6SP83dYiPYaPAddz9rsp-I"]
            });
        }

        public string GenerateChallenge(Guid id)
        {
            var credentialOptions = Fido2.RequestNewCredential(new Fido2User()
            {
                DisplayName = id.ToString(),
                Id = id.ToByteArray(),
                Name = id.ToString()
            }, []);

            return Convert.ToBase64String(credentialOptions.Challenge);
        }

        public async Task<AsyncResult<UserPasskey>> LinkPasskeyTo(UserToken passkeyToken, AuthenticatorAttestationRawResponse request)
        {
            if (passkeyToken.ID.Item3 != Enums.UserTokenType.PasskeyChallenge)
                return null;

            CredentialCreateOptions options = new()
            {
                User = new()
                {
                    DisplayName = "NotImportant",
                    Id = passkeyToken.ID.Item2.ToByteArray(),
                    Name = "NotImportant"
                },
                Challenge = Convert.FromBase64String(passkeyToken.Token),
                Attestation = AttestationConveyancePreference.None,
                ExcludeCredentials = [],
                PubKeyCredParams = _PubKeyCredParams,
                Rp = _Rp,
            };

            AttestationVerificationSuccess verificationResult;
            try
            {
                var result = await Fido2.MakeNewCredentialAsync(request, options, IsCredentialUnique);
                if (result == null || result.Result == null || result.Status != "ok")
                    return new(ErrorHelper.FromCode(Socigy.Structures.API.Enums.ErrorCode.PASSKEY_CORRUPTED_ERROR));

                verificationResult = result.Result;
            }
            catch (Fido2VerificationException)
            {
                return new(ErrorHelper.FromCode(Socigy.Structures.API.Enums.ErrorCode.PASSKEY_CORRUPTED_ERROR));
            }

            var newPasskey = await new UserPasskey()
            {
                ID = (await UserPasskey.NextId(_Db, passkeyToken.ID.Item2), passkeyToken.ID.Item2),
                SignCount = verificationResult.Counter,
                CredentialId = verificationResult.CredentialId,
                PublicKey = verificationResult.PublicKey
            }.TryInsertAsync<UserPasskey, (int, Guid)>(_Db, false);
            if (newPasskey == null)
                return new(ErrorHelper.FromCode(Socigy.Structures.API.Enums.ErrorCode.UNEXPECTED_ERROR));

            return new(newPasskey);
        }

        private async Task<bool> IsCredentialUnique(IsCredentialIdUniqueToUserParams credentialIdUserParams, CancellationToken cancellationToken)
        {
            var isUnique = !await _Db.GetSingleValue("SELECT EXISTS (SELECT 1 FROM passkey_registrations WHERE user_uuid = @user_id AND credential_id = @credential_id)",
                reader => reader.GetBoolean(0),
                ("user_id", new Guid(credentialIdUserParams.User.Id)),
                ("credential_id", credentialIdUserParams.CredentialId));

            return isUnique;
        }

        public async Task<bool> ValidatePasskey(UserToken passkeyToken, UserPasskey passkey, AuthenticatorAssertionRawResponse credential)
        {
            AssertionOptions options = new()
            {
                UserVerification = UserVerificationRequirement.Required,
                Challenge = Convert.FromBase64String(passkeyToken.Token),
                RpId = _Rp.Id
            };

            IsUserHandleOwnerOfCredentialIdAsync a;
            try
            {
                var result = await Fido2.MakeAssertionAsync(credential, options, passkey.PublicKey, 0, async (args, cancellationToken) =>
                {
                    return args.CredentialId.SequenceEqual(passkey.CredentialId) && new Guid(args.UserHandle) == passkey.ID.Item2;
                });
                return result != null && result.Status == "ok";
            }
            catch (Fido2VerificationException)
            {
                return false;
            }
            catch (Exception ex)
            {
                return false;
            }
        }
    }
}

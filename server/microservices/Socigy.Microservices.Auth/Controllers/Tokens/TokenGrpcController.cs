using Grpc.Core;
using Socigy.Connectors.Auth.Tokens;
using Socigy.Connectors.User.Info;
using Socigy.Microservices.Auth.Services;
using Socigy.Microservices.Auth.Structures;
using Socigy.Middlewares.Attributes;
using Socigy.Services.Database;

namespace Socigy.Microservices.Auth.Controllers.Tokens
{
    [InternalOnly]
    public class TokenGrpcController : TokenGrpcService.TokenGrpcServiceBase
    {
        private readonly ITokenService _Tokens;
        private readonly IDatabaseService _Db;
        private readonly UserInfoGrpcService.UserInfoGrpcServiceClient _User;
        public TokenGrpcController(ITokenService tokens, IDatabaseService db, UserInfoGrpcService.UserInfoGrpcServiceClient user)
        {
            _Tokens = tokens;
            _Db = db;
            _User = user;
        }

        [InternalOnly]
        public override async Task<TokenDetailsResponse> VerifyAccessToken(AccessTokenVerification request, ServerCallContext context)
        {
            if (request.DeviceFingerprint == null)
                return new TokenDetailsResponse() { IsValid = false };

            var response = await _Tokens.ValidateAccessToken(request.AccessToken);

            var usersDevice = await _Db.GetByIdAsync<UserDevice, (short, Guid)>(((short)response.DeviceId, Guid.Parse(response.UserId)));
            if (
                usersDevice.Value == null ||
                usersDevice.Value.IsBlocked ||
                request.DeviceFingerprint != usersDevice.Value.Fingerprint
               )
            {
                return new TokenDetailsResponse() { IsValid = false };
            }

            if (request.VerifyUser)
            {
                if (await _Tokens.VerifyTokenUser(Guid.Parse(response.UserId)))
                    return response;
                else
                    return new() { IsValid = false };
            }

            if (request.VerifyRegistration)
            {
                if ((await _User.CheckUserIsRegisteredInternalAsync(new() { TargetUserId = response.UserId })).Result)
                    return response;
                else
                    return new() { IsValid = false };
            }

            return response;
        }

        [InternalOnly]
        public override async Task<TempChallengeResponse> GenerateTempChallengeInternal(TempChallengeRequest request, ServerCallContext context)
        {
            //_Tokens.GenerateTempChallenge();

            return new TempChallengeResponse()
            {
                //RawChallenge = 
            };
        }

        [InternalOnly]
        public override async Task<VerifyTempChallengeResponse> VerifyTempChallengeInternal(VerifyTempChallengeRequest request, ServerCallContext context)
        {
            //return base.VerifyTempChallengeInternal(request, context);
            return new VerifyTempChallengeResponse() { IsValid = false };
        }

        [InternalOnly]
        public override async Task<Connectors.Auth.Tokens.Empty> DeleteTempChallengeInternal(DeleteTempChallengeRequest request, ServerCallContext context)
        {
            return new Connectors.Auth.Tokens.Empty();
        }
    }
}

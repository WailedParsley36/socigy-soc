using Microsoft.IdentityModel.Tokens;
using Socigy.Connectors.Auth.Tokens;
using Socigy.Microservices.Auth.Structures;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Socigy.Microservices.Auth.Services
{
    public interface ITokenService
    {
        Task<TokenDetailsResponse> ValidateAccessToken(string accessToken);
        Task<TokenDetailsResponse> ValidateRefreshToken(string refreshToken);

        Task<(string Raw, UserToken Token)> GenerateAccessToken(Guid userId, short deviceId, string username, short tag);
        Task<(string Raw, UserToken Token)> GenerateRefreshToken(Guid userId, short deviceId, string username, short tag);

        Task<(string Raw, UserToken Token)> GenerateEmailMfaCode(Guid userId, short deviceId);
        Task<(string Raw, UserToken Token)> GeneratePasskeyChallenge(Guid userId, short deviceId);

        Task<bool> VerifyTokenUser(Guid userId);

        Task<(string Raw, UserToken Token)> GenerateTempChallenge(Guid userId);

        bool VerifyToken(string token, string hashedToken);
    }
}

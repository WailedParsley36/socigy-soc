using Azure;
using Microsoft.IdentityModel.Tokens;
using Socigy.Connectors.Auth.Tokens;
using Socigy.Connectors.User.Info;
using Socigy.Microservices.Auth.Enums;
using Socigy.Microservices.Auth.Structures;
using Socigy.Services.Database;
using Socigy.Structures;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Socigy.Microservices.Auth.Services
{
    public class TokenService : ITokenService
    {
        private readonly byte[] _RefreshSecret;
        private readonly byte[] _AccessSecret;

        private readonly IDatabaseService _Db;
        private readonly IFido2Service _Fido;
        private readonly UserInfoGrpcService.UserInfoGrpcServiceClient _User;

        public TokenService(IConfiguration config, IDatabaseService db, UserInfoGrpcService.UserInfoGrpcServiceClient userService, IFido2Service fido)
        {
            _AccessSecret = Encoding.UTF8.GetBytes(config.GetValue<string>("SOCIGY_ACCESS_SECRET") ?? throw new Exception("Socigy Access secret was not provided"));
            _RefreshSecret = Encoding.UTF8.GetBytes(config.GetValue<string>("SOCIGY_REFRESH_SECRET") ?? throw new Exception("Socigy Refresh secret was not provided"));
            _Db = db;
            _User = userService;
            _Fido = fido;
        }

        public async Task<TokenDetailsResponse> ValidateAccessToken(string accessToken)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var validationParams = new TokenValidationParameters()
            {
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,

                ValidateIssuer = true,
                ValidIssuer = "socigy-issuer",

                ValidateAudience = true,
                ValidAudience = "socigy-app",

                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(_AccessSecret),

                RequireExpirationTime = true,
            };

            var validationResult = await tokenHandler.ValidateTokenAsync(accessToken, validationParams);

            if (!validationResult.IsValid)
                return new TokenDetailsResponse() { IsValid = false };

            var token = tokenHandler.ReadJwtToken(accessToken);

            string? userId = token.Claims.FirstOrDefault(x => x.Type == JwtRegisteredClaimNames.NameId)?.Value;
            string? username = token.Claims.FirstOrDefault(x => x.Type == JwtRegisteredClaimNames.Name)?.Value;
            string? userDeviceId = token.Claims.FirstOrDefault(x => x.Type == "dev")?.Value;
            if (userId == null || userDeviceId == null || username == null || !Guid.TryParse(userId, out Guid userIdGuid) || !short.TryParse(userDeviceId, out short userDeviceIdNumber))
                return new TokenDetailsResponse() { IsValid = false };

            var userToken = await _Db.GetByIdAsync<UserToken, (short, Guid, UserTokenType)>((userDeviceIdNumber, userIdGuid, UserTokenType.Access));
            var now = DateTime.UtcNow;
            if (userToken.Value == null || userToken.Value.ExpiresAt < now || userToken.Value.RevokedAt > now)
                return new TokenDetailsResponse() { IsValid = false };

            if (userToken.Value.Token != HashToken(accessToken))
                return new TokenDetailsResponse() { IsValid = false };

            return new TokenDetailsResponse()
            {
                IsValid = validationResult.IsValid,
                UserId = userId,
                Expiry = (long)(userToken.Value.ExpiresAt!.Value - new DateTime(1970, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc)).TotalSeconds,
                Username = username,
                DeviceId = userDeviceIdNumber
            };
        }
        public async Task<TokenDetailsResponse> ValidateRefreshToken(string refreshToken)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var validationParams = new TokenValidationParameters()
            {
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,

                ValidateIssuer = true,
                ValidIssuer = "socigy-issuer",

                ValidateAudience = true,
                ValidAudience = "socigy-app",

                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(_RefreshSecret),

                RequireExpirationTime = true,
            };

            var validationResult = await tokenHandler.ValidateTokenAsync(refreshToken, validationParams);

            if (!validationResult.IsValid)
                return new TokenDetailsResponse() { IsValid = false };

            var token = tokenHandler.ReadJwtToken(refreshToken);

            string? userId = token.Claims.FirstOrDefault(x => x.Type == JwtRegisteredClaimNames.NameId)?.Value;
            string? username = token.Claims.FirstOrDefault(x => x.Type == JwtRegisteredClaimNames.Name)?.Value;
            string? userDeviceId = token.Claims.FirstOrDefault(x => x.Type == "dev")?.Value;
            if (userId == null || userDeviceId == null || username == null || !Guid.TryParse(userId, out Guid userIdGuid) || !short.TryParse(userDeviceId, out short userDeviceIdNumber))
                return new TokenDetailsResponse() { IsValid = false };

            var userToken = await _Db.GetByIdAsync<UserToken, (short, Guid, UserTokenType)>((userDeviceIdNumber, userIdGuid, UserTokenType.Refresh));
            var now = DateTime.UtcNow;
            if (userToken.Value == null || userToken.Value.ExpiresAt < now || userToken.Value.RevokedAt > now)
                return new TokenDetailsResponse() { IsValid = false };

            if (userToken.Value.Token != HashToken(refreshToken))
                return new TokenDetailsResponse() { IsValid = false };

            return new TokenDetailsResponse()
            {
                IsValid = validationResult.IsValid,
                UserId = userId,
                Expiry = (long)(userToken.Value.ExpiresAt!.Value - new DateTime(1970, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc)).TotalSeconds,
                Username = username,
                DeviceId = userDeviceIdNumber
            };
        }
        public async Task<bool> VerifyTokenUser(Guid userId)
        {
            return (await _User.CheckUserInfoVerifiedInternalAsync(new UserInfoRequest()
            {
                TargetUserId = userId.ToString()
            })).Result;
        }

        public async Task<(string Raw, UserToken Token)> GenerateAccessToken(Guid userId, short deviceId, string username, short tag)
        {
            var key = new SymmetricSecurityKey(_AccessSecret);
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var tokenHandler = new JwtSecurityTokenHandler();
            var utcNow = DateTime.UtcNow;
            var expiry = utcNow.AddMinutes(Constants.Auth.Tokens.AccessTokenValidity);
            var jwtToken = tokenHandler.CreateJwtSecurityToken("socigy-issuer",
                "socigy-app",
                new ClaimsIdentity([
                    new(JwtRegisteredClaimNames.Name, $"{username} #{tag}"),
                    new(JwtRegisteredClaimNames.NameId, userId.ToString()),
                    new("dev", deviceId.ToString()),
                    new(JwtRegisteredClaimNames.Iss, "socigy-issuer"),
                    new(JwtRegisteredClaimNames.Aud, "socigy-app"),
                ]),
                utcNow, expiry, utcNow, credentials);

            var token = tokenHandler.WriteToken(jwtToken);
            return (token, new UserToken()
            {
                ID = (deviceId, userId, Enums.UserTokenType.Access),
                RevokedAt = null,
                ExpiresAt = expiry,
                IssuedAt = utcNow,
                Token = HashToken(token)
            });
        }
        public async Task<(string Raw, UserToken Token)> GenerateRefreshToken(Guid userId, short deviceId, string username, short tag)
        {
            var key = new SymmetricSecurityKey(_RefreshSecret);
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var tokenHandler = new JwtSecurityTokenHandler();
            var utcNow = DateTime.UtcNow;
            var expiry = utcNow.AddHours(Constants.Auth.Tokens.RefreshTokenValidity);
            var jwtToken = tokenHandler.CreateJwtSecurityToken("socigy-issuer",
                "socigy-app",
                new ClaimsIdentity([
                    new(JwtRegisteredClaimNames.Name, $"{username} #{tag}"),
                    new(JwtRegisteredClaimNames.NameId, userId.ToString()),
                    new("dev", deviceId.ToString()),
                    new(JwtRegisteredClaimNames.Iss, "socigy-issuer"),
                    new(JwtRegisteredClaimNames.Aud, "socigy-app"),
                ]),
                utcNow, expiry, utcNow, credentials);


            var token = tokenHandler.WriteToken(jwtToken);
            return (token, new UserToken()
            {
                ID = (deviceId, userId, Enums.UserTokenType.Refresh),
                RevokedAt = null,
                ExpiresAt = expiry,
                IssuedAt = utcNow,
                Token = HashToken(token)
            });
        }

        public async Task<(string Raw, UserToken Token)> GenerateEmailMfaCode(Guid userId, short deviceId)
        {
            int code = RandomNumberGenerator.GetInt32(0, 1000000);
            string codeStr = code.ToString("D6");

            return new(codeStr, new()
            {
                ID = (deviceId, userId, UserTokenType.EmailMFA),
                ExpiresAt = DateTime.UtcNow.AddHours(Constants.Auth.Tokens.EmailVerificationValidity),
                Token = HashToken(codeStr),
            });
        }
        public async Task<(string Raw, UserToken Token)> GeneratePasskeyChallenge(Guid userId, short deviceId)
        {
            string codeStr = _Fido.GenerateChallenge(userId);
            return new(codeStr, new()
            {
                ID = (deviceId, userId, UserTokenType.PasskeyChallenge),
                ExpiresAt = DateTime.UtcNow.AddHours(Constants.Auth.Tokens.PasskeyChallengeValidity),
                Token = codeStr,
            });
        }

        public bool VerifyToken(string code, string hashedCode)
        {
            return HashToken(code) == hashedCode;
        }
        private string HashToken(string rawToken)
        {
            return Convert.ToBase64String(SHA512.HashData(Encoding.UTF8.GetBytes(rawToken)));
        }

        public Task<(string Raw, UserToken Token)> GenerateTempChallenge(Guid userId)
        {
            throw new NotImplementedException();
        }
    }
}
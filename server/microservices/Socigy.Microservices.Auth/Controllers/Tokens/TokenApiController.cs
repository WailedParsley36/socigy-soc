using Socigy.Connectors.Auth.Tokens;
using Socigy.Connectors.User.Info;
using Socigy.Microservices.Auth.Enums;
using Socigy.Microservices.Auth.Responses;
using Socigy.Microservices.Auth.Services;
using Socigy.Microservices.Auth.Structures;
using Socigy.Middlewares;
using Socigy.Middlewares.Attributes;
using Socigy.Middlewares.Helpers;
using Socigy.Services.Communication;
using Socigy.Services.Database;
using Socigy.Structures;
using Socigy.Structures.API;
using System.Net;
using System.Net.Http.Headers;
using System.Reflection.Metadata;
using System.Text.Json.Serialization.Metadata;

namespace Socigy.Microservices.Auth.Controllers.Tokens
{
    public class TokenApiController : BaseApiController
    {
        private readonly ILogger<TokenApiController> _Logger;
        private readonly IDatabaseService _Db;
        private readonly ITokenService _Tokens;
        public TokenApiController(ILogger<TokenApiController> logger, IDatabaseService database, ITokenService tokenService, IJsonTypeInfoResolver jsonTypeInfoResolver) : base(jsonTypeInfoResolver)
        {
            _Logger = logger;
            _Db = database;
            _Tokens = tokenService;
        }

        public async Task<IResult> VerifyTokens(HttpContext context)
        {
            if (!context.Request.Cookies.TryGetValue(AuthMiddleware.AccessTokenCookie, out string? accessToken) ||
               !context.Request.Cookies.TryGetValue(AuthMiddleware.RefreshTokenCookie, out string? refreshToken))
                return Results.Unauthorized();

            var validation = await _Tokens.ValidateAccessToken(accessToken);
            if (!validation.IsValid)
            {
                context.Response.Cookies.Delete(AuthMiddleware.AccessTokenCookie);
                return Results.Unauthorized();
            }

            var accessExpiry = validation.Expiry;

            validation = await _Tokens.ValidateRefreshToken(refreshToken);
            if (!validation.IsValid)
            {
                context.Response.Cookies.Delete(AuthMiddleware.RefreshTokenCookie);
                return Results.Unauthorized();
            }

            var deviceInfo = UserAgentHelper.GetUserDeviceInfo(context);
            var deviceFingerprint = AuthMiddleware.GetHashedFingerprint(context);
            if (deviceFingerprint == null)
                return BadRequest();

            var userDevice = await _Db.GetByIdAsync<UserDevice, (short, Guid)>(((short)validation.DeviceId, Guid.Parse(validation.UserId)));
            if (userDevice.Value == null || userDevice.Value.IsBlocked || userDevice.Value.Fingerprint != deviceFingerprint)
                return Results.Unauthorized();

            return Response(new TokenResponse()
            {
                UserId = Guid.Parse(validation.UserId),

                AccessExpiry = accessExpiry,
                RefreshExpiry = validation.Expiry
            });
        }
        public async Task<IResult> RefreshTokens(HttpContext context)
        {
            if (!context.Request.Cookies.TryGetValue(AuthMiddleware.RefreshTokenCookie, out string? refreshToken))
            {
                context.Response.Cookies.Delete(AuthMiddleware.RefreshTokenCookie);
                context.Response.Cookies.Delete(AuthMiddleware.AccessTokenCookie);
                return Results.Unauthorized();
            }

            var validation = await _Tokens.ValidateRefreshToken(refreshToken);
            if (!validation.IsValid)
            {
                context.Response.Cookies.Delete(AuthMiddleware.RefreshTokenCookie);
                context.Response.Cookies.Delete(AuthMiddleware.AccessTokenCookie);
                return Results.Unauthorized();
            }

            var userId = Guid.Parse(validation.UserId);
            var issuedAt = DateTime.UtcNow;
            var usernameParts = validation.Username.Split("#");

            var username = usernameParts[0].Trim();
            var tag = short.Parse(usernameParts[1]);

            var deviceInfo = UserAgentHelper.GetUserDeviceInfo(context);
            var deviceFingerprint = AuthMiddleware.GetHashedFingerprint(context);
            if (deviceFingerprint == null)
                return BadRequest();

            var userDevice = await _Db.GetByIdAsync<UserDevice, (short, Guid)>(((short)validation.DeviceId, userId));
            if (userDevice.Value == null || userDevice.Value.IsBlocked || userDevice.Value.Fingerprint != deviceFingerprint)
                return Results.Unauthorized();

            var tokens = await GenerateTokensForUser(userId, (short)validation.DeviceId, username, tag);
            if (tokens == null)
                return Unexpected();

            if (deviceInfo.Type.HasFlag(Socigy.Structures.Enums.DeviceType.App))
                return Response(tokens);

            AddAuthCookies(context, tokens.AccessToken!, tokens.RefreshToken!, tokens.AccessExpiry, tokens.RefreshExpiry);

            // Removing the from body
            tokens.AccessToken = null;
            tokens.RefreshToken = null;

            return Response(tokens);
        }

        #region Testing
        public async Task<IResult> HelloWorld(HttpContext context)
        {
            return Results.Content($"Hi, it looks like you like these languages 👍 -> {context.Request.Headers.AcceptLanguage}");
        }

        public async Task<IResult> BeingCalledByUser(HttpContext context)
        {
            return Results.Content($"Someone called me! WHAT IS IT!");
        }

        [InternalOnly]
        public async Task<IResult> InternalMethod(HttpContext context)
        {
            return Results.Content($"Pssst! This is only for internal purposes");
        }

        public async Task<IResult> TestDbConnection()
        {
            await _Db.ExecuteQueryAsync("SELECT * FROM user_devices LIMIT 10");

            return Results.Ok();
        }
        #endregion

        #region Token Automation
        private void AddAuthCookies(HttpContext context, string accessToken, string refreshToken, long accessExpiry, long refreshExpiry)
        {
            context.Response.Cookies.Append(AuthMiddleware.AccessTokenCookie, accessToken, new CookieOptions()
            {
                HttpOnly = true,
                Secure = true,
                IsEssential = true,
                Domain = ".socigy.com",

                Expires = DateTimeOffset.FromUnixTimeSeconds(accessExpiry),
                SameSite = SameSiteMode.None
            });
            context.Response.Cookies.Append(AuthMiddleware.RefreshTokenCookie, refreshToken, new CookieOptions()
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
                    nameof(UserToken.IsRecovery),
                    nameof(UserToken.ExpiresAt),
                    nameof(UserToken.IssuedAt),
                    nameof(UserToken.RevokedAt));
        }
        #endregion

        public override void MapRoutes(IEndpointRouteBuilder routeBuilder)
        {
            routeBuilder.MapGrpcService<TokenGrpcController>();

            routeBuilder.MapGet("/", (Delegate)HelloWorld);
            routeBuilder.MapGet("/call", (Delegate)BeingCalledByUser);
            routeBuilder.MapGet("/internal", (Delegate)InternalMethod);
            routeBuilder.MapGet("/db-test", (Delegate)TestDbConnection);

            var group = routeBuilder.MapGroup("/tokens");
            group.MapGet("/verify", (Delegate)VerifyTokens);
            group.MapGet("/refresh", (Delegate)RefreshTokens);

            _Logger.LogInformation("Mapped TokenApiController");
        }
    }
}

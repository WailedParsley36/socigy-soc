using global::Socigy.Connectors.Auth.Tokens;
using global::Socigy.Microservices.Auth.Services;
using global::Socigy.Middlewares.Attributes;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;
using Socigy.Connectors.User.Info;
using Socigy.Microservices.Auth.Structures;
using Socigy.Services.Database;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Socigy.Microservices.Auth.Middlewares
{
    public class AuthMiddleware : IMiddleware
    {
        private readonly ILogger<AuthMiddleware> _Logger;
        private readonly ITokenService _Tokens;
        private readonly IDatabaseService _Db;
        private readonly UserInfoGrpcService.UserInfoGrpcServiceClient _User;
        public AuthMiddleware(ILogger<AuthMiddleware> logger, ITokenService tokens, IDatabaseService db, UserInfoGrpcService.UserInfoGrpcServiceClient user)
        {
            _Logger = logger;
            _Tokens = tokens;
            _Db = db;
            _User = user;
        }

        public static TokenDetailsResponse? GetCurrentUser(HttpContext context)
        {
            return (TokenDetailsResponse?)context.Items[Socigy.Middlewares.AuthMiddleware.CurrentUserItem];
        }

        public static bool? IsRegistered(HttpContext context)
        {
            return (bool?)context.Items[Socigy.Middlewares.AuthMiddleware.UserRegistered];
        }
        public static bool? HasVerifiedEmail(HttpContext context)
        {
            return (bool?)context.Items[Socigy.Middlewares.AuthMiddleware.UserHasVerifiedEmail];
        }

        public static (string Username, short Tag)? SplitUsernameAndTag(TokenDetailsResponse response)
        {
            var parts = response.Username.Split("#");
            if (!short.TryParse(parts[1], out short parsedTag))
                return null;

            return (parts[0].Trim(), parsedTag);
        }

        public async Task InvokeAsync(HttpContext context, RequestDelegate next)
        {
            var endpoint = context.GetEndpoint();
            var attribute = endpoint?.Metadata.GetMetadata<AuthAttribute>();
            if (attribute == null)
            {
                var controllerActionDescriptor = endpoint?.Metadata.GetMetadata<MethodInfo>();
                if (controllerActionDescriptor != null)
                    attribute = controllerActionDescriptor.DeclaringType?.GetCustomAttribute<AuthAttribute>();
            }

            if (attribute != null && !attribute.Ignore)
            {
                if (attribute.AdminOnly)
                {
                    Socigy.Middlewares.AuthMiddleware.Unauthorized(context, _Logger);
                    return;
                }

                if (!context.Request.Cookies.TryGetValue(Socigy.Middlewares.AuthMiddleware.AccessTokenCookie, out string? accessToken))
                {
                    Socigy.Middlewares.AuthMiddleware.Unauthorized(context, _Logger);
                    return;
                }

                var result = await _Tokens.ValidateAccessToken(accessToken);
                if (result == null || !result.IsValid)
                {
                    Socigy.Middlewares.AuthMiddleware.Unauthorized(context, _Logger);
                    return;
                }

                var uuid = Guid.Parse(result.UserId);

                if (!attribute.AllowUnverifiedEmail)
                {
#if !DEBUG
                    if (!await _Tokens.VerifyTokenUser(uuid))
                    {
                        Socigy.Middlewares.AuthMiddleware.Unauthorized(context, _Logger);
                        return;
                    }
#endif

                    context.Items[Socigy.Middlewares.AuthMiddleware.UserHasVerifiedEmail] = true;
                }

                if (!attribute.AllowNonRegistered)
                {
#if !DEBUG
                    if (!(await _User.CheckUserIsRegisteredInternalAsync(new UserInfoRequest() { TargetUserId = result.UserId })).Result)
                    {
                        Socigy.Middlewares.AuthMiddleware.Unauthorized(context, _Logger);
                        return;
                    }
#endif

                    context.Items[Socigy.Middlewares.AuthMiddleware.UserRegistered] = true;
                }

                // Checking if the DeviceID and DeviceFingerprint are matching
                var usersDevice = await _Db.GetByIdAsync<UserDevice, (short, Guid)>(((short)result.DeviceId, Guid.Parse(result.UserId)));
                if (
                    usersDevice.Value == null ||
                    usersDevice.Value.IsBlocked ||
                    Socigy.Middlewares.AuthMiddleware.GetHashedFingerprint(context) != usersDevice.Value.Fingerprint
                   )
                {
                    // Valid device fingerprint was not in the request. Unable to check if the device is bound to this token...
                    Socigy.Middlewares.AuthMiddleware.Unauthorized(context, _Logger);
                    return;
                }

                context.Items[Socigy.Middlewares.AuthMiddleware.CurrentUserItem] = result;
            }

            await next(context);
        }
    }
}

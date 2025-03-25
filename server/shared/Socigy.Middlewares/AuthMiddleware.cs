using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;
using Serilog.Core;
using Socigy.Connectors.Auth.Internal;
using Socigy.Connectors.Auth.Tokens;
using Socigy.Middlewares.Attributes;
using Socigy.Services.Database;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Socigy.Middlewares
{
    public class AuthMiddleware : IMiddleware
    {
        public const string AccessTokenCookie = "Access";
        public const string RefreshTokenCookie = "Refresh";
        public const string CurrentUserItem = "CurrentUser";
        public const string UserRegistered = "UserRegistered";
        public const string UserHasVerifiedEmail = "UserHasVerifiedEmail";
        public const string DeviceIdentifier = "X-Device-Id";

        private readonly ILogger<AuthMiddleware> _Logger;
        private readonly TokenGrpcService.TokenGrpcServiceClient _Verifier;
        public AuthMiddleware(ILogger<AuthMiddleware> logger, TokenGrpcService.TokenGrpcServiceClient verifier)
        {
            _Verifier = verifier;
            _Logger = logger;
        }

        public static string? GetHashedFingerprint(HttpContext context)
        {
            if (!context.Request.Headers.TryGetValue(DeviceIdentifier, out StringValues fingerprintValues))
                return null;

            return Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(fingerprintValues.ToString())));
        }
        public static TokenDetailsResponse? GetCurrentUser(HttpContext context)
        {
            return (TokenDetailsResponse?)context.Items[CurrentUserItem];
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
                    AuthMiddleware.Unauthorized(context, _Logger);
                    return;
                }

                if (!context.Request.Cookies.TryGetValue(AccessTokenCookie, out string? accessToken))
                {
                    AuthMiddleware.Unauthorized(context, _Logger);
                    return;
                }

                var result = await _Verifier.VerifyAccessTokenAsync(new AccessTokenVerification()
                {
                    AccessToken = accessToken,
                    VerifyUser = !attribute.AllowUnverifiedEmail,
                    VerifyRegistration = !attribute.AllowNonRegistered,
                    DeviceFingerprint = GetHashedFingerprint(context)
                });

                if (result == null || !result.IsValid)
                {
                    AuthMiddleware.Unauthorized(context, _Logger);
                    return;
                }

                context.Items[CurrentUserItem] = result;
            }

            await next(context);
        }

        public static void Unauthorized(HttpContext context, ILogger logger)
        {
            logger.LogWarning("Blocked unauthorized request to an authorized endpoint.");
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        }
    }
}

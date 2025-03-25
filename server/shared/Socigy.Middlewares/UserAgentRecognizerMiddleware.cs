using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using UAParser;

namespace Socigy.Middlewares
{
    public class UserAgentRecognizer : IMiddleware
    {
        private readonly Parser UAParser = Parser.GetDefault();

        public const string ClientInfo = "clientInfo";

        public async Task InvokeAsync(HttpContext context, RequestDelegate next)
        {
            string? userAgent = context.Request.Headers.UserAgent;
            if (userAgent == null)
            {
                await next(context);
                return;
            }

            context.Items.Add(ClientInfo, UAParser.Parse(userAgent));
            await next(context);
        }

        public static ClientInfo? GetClientInfo(HttpContext context)
        {
            context.Items.TryGetValue(ClientInfo, out object? info);
            return (ClientInfo?)info;
        }

        public static Device? GetDeviceInfo(HttpContext context)
        {
            var info = GetClientInfo(context);
            return info?.Device;
        }

        public static OS? GetOSInfo(HttpContext context)
        {
            var info = GetClientInfo(context);
            return info?.OS;
        }

        public static UserAgent? GetUserAgent(HttpContext context)
        {
            var info = GetClientInfo(context);
            return info?.UA;
        }
    }
}

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Socigy.Connectors.Auth.Internal;
using Socigy.Microservices.Auth.Controllers.Internal;
using Socigy.Middlewares.Attributes;
using Socigy.Services.Database;
using Socigy.Services.Internal;
using Socigy.Structures.API;
using System.Net;
using System.Reflection;

namespace Socigy.Microservices.Auth.Middlewares
{
    public class InternalOnlyMiddleware : IMiddleware
    {
        private readonly ILogger<InternalOnlyMiddleware> _Logger;
        private readonly InternalgRPCTokenVerifier _Verifier;
        public InternalOnlyMiddleware(ILogger<InternalOnlyMiddleware> logger, IDatabaseService db)
        {
            _Logger = logger;
            _Verifier = new InternalgRPCTokenVerifier(db);
        }

        public async Task InvokeAsync(HttpContext context, RequestDelegate next)
        {
            var endpoint = context.GetEndpoint();
            var attribute = endpoint?.Metadata.GetMetadata<InternalOnlyAttribute>();
            if (attribute == null)
            {
                var controllerActionDescriptor = endpoint?.Metadata.GetMetadata<MethodInfo>();
                if (controllerActionDescriptor != null)
                    attribute = controllerActionDescriptor.DeclaringType?.GetCustomAttribute<InternalOnlyAttribute>();
            }

            if (attribute != null)
            {
                if (!await IsInternalRequest(context))
                {
                    // Returning 404 (nothing on this path exists to the external world)
                    _Logger.LogWarning("Blocked external request to an internal-only endpoint.");
                    context.Response.StatusCode = StatusCodes.Status404NotFound;
                    return;
                }
            }

            await next(context);
        }

        public async Task<bool> IsInternalRequest(HttpContext context)
        {
            var clientIdHeader = context.Request.Headers.FirstOrDefault(x => x.Key == InternalHelper.ClientIdHeader);
            var clientSecretHeader = context.Request.Headers.FirstOrDefault(x => x.Key == InternalHelper.ClientSecretHeader);

            if (string.IsNullOrEmpty(clientIdHeader.Value) || string.IsNullOrEmpty(clientSecretHeader.Value))
                return false;

            _Logger.LogInformation("Verifying internal request client details");

            return (await _Verifier.Verify(new ClientDetails()
            {
                ClientId = clientIdHeader.Value,
                ClientSecret = clientSecretHeader.Value,
            }, null)).IsValid;
        }
    }


    //public class InternalOnlyMiddleware : IMiddleware
    //{
    //    private readonly ILogger<InternalOnlyMiddleware> _Logger;
    //    private readonly IDatabaseService _Db;

    //    public InternalOnlyMiddleware(ILogger<InternalOnlyMiddleware> logger, IConfiguration config)
    //    {
    //        _Logger = logger;
    //        //_Db = db;
    //    }

    //    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    //    {
    //        var clientCert = context.Connection.ClientCertificate;
    //        _Logger.LogWarning(clientCert != null ? "The client has presented a certificate" : "The client does not have any certificate");
    //        _Logger.LogInformation($"Remote IP Address: {context.Connection.RemoteIpAddress} - Host: {context.Request.Host}");

    //        var endpoint = context.GetEndpoint();
    //        if (endpoint?.Metadata.GetMetadata<InternalOnlyAttribute>() != null)
    //        {
    //            if (!IsInternalRequest(context))
    //            {
    //                // Returning 404 (nothing on this path exists to the external world)
    //                _Logger.LogWarning("Blocked external request to an internal-only endpoint.");
    //                context.Response.StatusCode = StatusCodes.Status404NotFound;
    //                return;
    //            }
    //        }

    //        await next(context);
    //    }

    //    private X509Certificate2? GetClientCertificate(HttpContext context)
    //    {
    //        var clientCertHeader = context.Request.Headers["x-forwarded-client-cert"];

    //        if (!string.IsNullOrEmpty(clientCertHeader))
    //        {
    //            var parts = clientCertHeader.ToString().Split(';');

    //            var certPart = parts.FirstOrDefault(p => p.StartsWith("Cert="));
    //            if (certPart != null)
    //            {
    //                var base64Cert = certPart.Substring(5).Trim('\"');
    //                var clientCert = new X509Certificate2(Encoding.UTF8.GetBytes(Uri.UnescapeDataString(base64Cert)));

    //                return clientCert;
    //            }
    //        }

    //        return null;
    //    }

    //    private bool IsInternalRequest(HttpContext context)
    //    {
    //        var clientCert = GetClientCertificate(context);
    //        var headers = context.Request.Headers.ToDictionary();
    //        foreach (var header in headers)
    //        {
    //            _Logger.LogWarning($"Client sent header -> {header.Key} = {header.Value}");
    //        }

    //        if (clientCert == null)
    //        {
    //            _Logger.LogWarning("No client certificate found. Request is external.");
    //            return false;
    //        }

    //        var spiffeId = GetServiceIdentityFromCertificate(clientCert);
    //        if (spiffeId != null && IsValidSpiffeId(spiffeId))
    //        {
    //            _Logger.LogInformation($"Verified internal service: {spiffeId}");

    //            if (IsServiceAllowed(spiffeId))
    //            {
    //                return true;
    //            }
    //            else
    //            {
    //                _Logger.LogWarning("Access denied: Service is nginx.");
    //                return false;
    //            }
    //        }
    //        else
    //        {
    //            _Logger.LogWarning($"Request with invalid or untrusted SPIFFE ID: {spiffeId}");
    //            return false;
    //        }
    //    }

    //    private string? GetServiceIdentityFromCertificate(X509Certificate2 cert)
    //    {
    //        var sanExtension = cert.Extensions["2.5.29.17"];
    //        if (sanExtension == null) return null;

    //        var sanString = sanExtension.Format(false);
    //        var identities = sanString.Split(',');

    //        foreach (var identity in identities)
    //        {
    //            string[] splitted = identity.Split('=');
    //            if (splitted.Length == 1)
    //                splitted = identity.Split("URI:");

    //            if (splitted.Length != 2)
    //                return null;

    //            _Logger.LogWarning($"Identity found {splitted[1]} - {splitted.Length}");
    //            if (splitted[1].Trim().StartsWith("spiffe://"))
    //            {
    //                return splitted[1].Trim();
    //            }
    //        }

    //        return null;
    //    }

    //    private bool IsValidSpiffeId(string spiffeId)
    //    {
    //        // Checking if SPIFFE ID matches this pattern spiffe://<UUID>.consul/ns/default/dc/<DC>/svc/<SERVICE>
    //        return spiffeId.StartsWith("spiffe://") && spiffeId.Contains(".consul/ns/default/dc/") && spiffeId.Contains("/svc/");
    //    }

    //    private bool IsServiceAllowed(string spiffeId)
    //    {
    //        // If it was sent from nginx it was a public request
    //        var parts = spiffeId.Split('/');
    //        var service = parts.LastOrDefault();
    //        return service == "user" || service == "content" || service == "plugins" || service == "auth";
    //    }
    //}
}

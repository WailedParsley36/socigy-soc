using Grpc.Core;
using Grpc.Net.ClientFactory;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Headers;

namespace Socigy.Services.Internal
{
    public class InternalHelper : IInternalHelper
    {
        private readonly string _ClientId;
        private readonly string _ClientSecret;

        public const string ClientIdHeader = "internal-client-id";
        public const string ClientSecretHeader = "internal-client-secret";

        private static InternalHelper _Instance;
        public InternalHelper(IConfiguration config)
        {
            _ClientId = config.GetValue<string>("INTERNAL_CLIENT_ID") ?? throw new Exception("INTERNAL_CLIENT_ID was not defined");
            _ClientSecret = config.GetValue<string>("INTERNAL_CLIENT_SECRET") ?? throw new Exception("INTERNAL_CLIENT_SECRET was not defined");
            _Instance = this;
        }

        public void AddInternalHeaders(HttpHeaders headers)
        {
            headers.Add(ClientIdHeader, _ClientId);
            headers.Add(ClientSecretHeader, _ClientSecret);
        }

        public static void AddGrpcInternalHeaders(CallOptionsContext context)
        {
            if (context.CallOptions.Headers == null)
                context.CallOptions = context.CallOptions.WithHeaders([]);

            context.CallOptions.Headers!.Add(ClientIdHeader, _Instance._ClientId);
            context.CallOptions.Headers!.Add(ClientSecretHeader, _Instance._ClientSecret);
        }

        public HttpClient GetInternalClient()
        {
            var client = new HttpClient();
            AddInternalHeaders(client.DefaultRequestHeaders);

            return client;
        }

    }
}

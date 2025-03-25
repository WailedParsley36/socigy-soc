using Grpc.Core;
using Socigy.Connectors.Auth.Internal;
using Socigy.Microservices.Auth.Structures;
using Socigy.Services.Database;
using System.Buffers.Text;
using System.Security.Cryptography;
using System.Text;

namespace Socigy.Microservices.Auth.Controllers.Internal
{
    public class InternalgRPCTokenVerifier : InternalCredVerifier.InternalCredVerifierBase
    {
        private readonly IDatabaseService _Db;
        public InternalgRPCTokenVerifier(IDatabaseService db)
        {
            _Db = db;
        }

        public override async Task<VerificationResponse> Verify(ClientDetails request, ServerCallContext context)
        {
            var foundClient = await _Db.GetByIdAsync<OAuthClient, string>(request.ClientId);
            if (foundClient.Value == null ||
                !foundClient.Value.IsInternal)
                return new VerificationResponse() { IsValid = false, Error = new Error() { Message = "Client not found" } };

            var computedSecret = Convert.ToBase64String(SHA512.HashData(Encoding.UTF8.GetBytes(request.ClientSecret)));
            return new VerificationResponse() { IsValid = computedSecret == foundClient.Value.ClientSecret };
        }
    }
}

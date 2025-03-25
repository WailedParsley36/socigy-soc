using Socigy.Services.Communication;
using Socigy.Services.Database;

namespace Socigy.Microservices.Auth.Requests
{
    public class TotpCodeRequest : IRequest
    {
        public string? Code { get; set; }
        public string? RecoveryCode { get; set; }
        public bool? Trust { get; set; }

        public async Task<bool> IsValid(IDatabaseService database, object? additional = null)
        {
            return Code != null || RecoveryCode != null;
        }
    }
}

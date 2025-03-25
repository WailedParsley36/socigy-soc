using Socigy.Services.Communication;
using Socigy.Services.Database;

namespace Socigy.Microservices.Auth.Requests
{
    public class EmailMfaCodeRequest : IRequest
    {
        public string Code { get; set; }
        public Guid UserId { get; set; }
        public bool? Trust { get; set; }

        public async Task<bool> IsValid(IDatabaseService database, object? additional = null)
        {
            return Code.Length == 6;
        }
    }
}

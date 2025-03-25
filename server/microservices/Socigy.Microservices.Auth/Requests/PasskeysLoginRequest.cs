using Socigy.Services.Communication;
using Socigy.Services.Database;

namespace Socigy.Microservices.Auth.Requests
{
    public class PasskeysLoginRequest : IRequest
    {
        public string? Username { get; set; }
        public short? Tag { get; set; }

        public string? Email { get; set; }

        public async Task<bool> IsValid(IDatabaseService database, object? additional = null)
        {
            return Email != null || (Username != null && Tag != null);
        }
    }
}

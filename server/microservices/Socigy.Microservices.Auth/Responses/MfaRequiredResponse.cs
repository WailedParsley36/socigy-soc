using Socigy.Microservices.Auth.Enums;

namespace Socigy.Microservices.Auth.Responses
{
    public class MfaRequiredResponse
    {
        public Guid UserId { get; set; }
        public MfaType Type { get; set; }
    }
}

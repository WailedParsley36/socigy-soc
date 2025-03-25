using Socigy.Microservices.Auth.Enums;

namespace Socigy.Microservices.Auth.Requests
{
    public class EditMFARequest
    {
        public MfaType Type { get; set; }
        public bool? IsDefault { get; set; }
    }
}

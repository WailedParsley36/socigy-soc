using Socigy.Microservices.Auth.Enums;

namespace Socigy.Microservices.Auth.Responses
{
    public class MFASettingsResponse
    {
        public MfaType Type { get; set; }

        public bool IsEnabled { get; set; }
        public bool IsDefault { get; set; }

        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}

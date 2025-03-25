using System.Text.Json.Serialization;

namespace Socigy.Microservices.Auth.Responses
{
    [JsonSourceGenerationOptions(DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull | JsonIgnoreCondition.WhenWritingDefault)]
    public class TokenResponse
    {
        public Guid UserId { get; set; }

        public string? AccessToken { get; set; }
        public string? RefreshToken { get; set; }

        public long AccessExpiry { get; set; }
        public long RefreshExpiry { get; set; }

        public string? Challenge { get; set; }
        public bool IsRecovery { get; set; } = false;
    }
}

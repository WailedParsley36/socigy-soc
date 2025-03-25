using Socigy.Microservices.Content.Enums;

namespace Socigy.Microservices.Content.Requests.Content
{
    public class InteractionRequest
    {
        public Guid PostId { get; set; }
        public InteractionType Type { get; set; }
        public float? ViewSeconds { get; set; }
    }
}

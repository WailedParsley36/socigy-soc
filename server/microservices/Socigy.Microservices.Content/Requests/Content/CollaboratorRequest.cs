using Socigy.Microservices.Content.Enums;

namespace Socigy.Microservices.Content.Requests.Content
{
    public class CollaboratorRequest
    {
        public Guid UserId { get; set; }
        public CollaborationRole Role { get; set; }
        public int Position { get; set; }
    }
}

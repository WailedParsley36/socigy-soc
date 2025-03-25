using Socigy.Structures.Database;

namespace Socigy.Microservices.Auth.Structures
{
    public class ParentAnonymousAccount : IDBObject<Guid>
    {
        public Guid ID { get; set; }

        public string Email { get; set; }
        public string Password { get; set; }

        public DateTime? CreatedAt { get; set; }
    }
}

using Socigy.Structures.Database;

namespace Socigy.Microservices.Content.Structures.Categorization
{
    public class PostInterests : IDBObject<(Guid, Guid)>
    {
        public (Guid, Guid) ID { get; set; }
    }
}

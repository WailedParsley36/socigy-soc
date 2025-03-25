using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Content.Structures.Categorization
{
    public class Interest : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("id")]
        public Guid ID { get; set; }

        public Guid CategoryId { get; set; }

        public string Name { get; set; }
        public string Emoji { get; set; }

        public string Description { get; set; }

        public short MinAge { get; set; }
    }
}

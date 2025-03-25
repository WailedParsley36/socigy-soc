using Socigy.Structures.Database;
using Socigy.Structures.Enums;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Content.Structures.Profiles
{
    public class UserContentProfile : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("id")]
        public Guid ID { get; set; }

        [JsonPropertyName("owner_uuid")]
        public Guid Owner { get; set; }

        public string Name { get; set; }
        public string? Description { get; set; }

        public bool IsDefault { get; set; }

        public ContentProfileVisibility Visibility { get; set; }
    }
}

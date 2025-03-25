using Socigy.Connectors.User.Info;
using Socigy.Microservices.Content.Structures.Categorization;
using Socigy.Microservices.Content.Structures.Posts.Interactions;
using Socigy.Microservices.Content.Structures.Posts.Queries;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Content.Responses
{
    [JsonSerializable(typeof(CreateContentProfileResponse))]
    [JsonSerializable(typeof(PostRecommendationResponse))]
    [JsonSerializable(typeof(CreatePostResponse))]
    [JsonSerializable(typeof(IEnumerable<Category>))]
    [JsonSerializable(typeof(IEnumerable<Interest>))]
    [JsonSerializable(typeof(IEnumerable<RecommendedPost>))]
    [JsonSerializable(typeof(IEnumerable<Comment>))]
    public partial class ResponseJsonContext : JsonSerializerContext
    {
    }
}

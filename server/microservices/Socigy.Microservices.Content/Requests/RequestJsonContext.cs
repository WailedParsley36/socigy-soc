using Socigy.Connectors.User.Info;
using Socigy.Microservices.Content.Requests.Content;
using Socigy.Microservices.Content.Requests.Content.Polls;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Content.Requests
{
    [JsonSerializable(typeof(ContentProfileRequest))]
    [JsonSerializable(typeof(SetProfileContentPreferencesRequest))]
    [JsonSerializable(typeof(CreatePostRequest))]
    [JsonSerializable(typeof(InteractionRequest))]

    [JsonSerializable(typeof(VoteRequest))]
    [JsonSerializable(typeof(CommentRequest))]
    [JsonSerializable(typeof(RecommendationRequest))]
    public partial class RequestJsonContext : JsonSerializerContext
    {
    }
}

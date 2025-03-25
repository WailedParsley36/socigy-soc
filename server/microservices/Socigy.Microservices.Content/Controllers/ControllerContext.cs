using Socigy.Microservices.Content.Controllers.Posts;
using Socigy.Microservices.Content.Controllers.Profiles;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Content.Controllers
{
    [JsonSerializable(typeof(ContentProfileController))]
    [JsonSerializable(typeof(ContentUploadController))]
    [JsonSerializable(typeof(ContentInteractionController))]
    [JsonSerializable(typeof(ContentRecommendationController))]
    public partial class ControllerContext : JsonSerializerContext
    {
    }
}

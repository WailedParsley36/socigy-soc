using Socigy.Microservices.Content.Structures.Posts.Queries;

namespace Socigy.Microservices.Content.Responses
{
    public class PostRecommendationResponse
    {
        public Dictionary<Guid, UserShallowInfo> Users { get; set; }

        public IEnumerable<RecommendedPost> Posts { get; set; }
    }
}

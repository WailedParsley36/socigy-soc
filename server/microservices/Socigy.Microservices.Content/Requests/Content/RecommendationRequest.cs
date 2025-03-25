using Socigy.Microservices.Content.Enums;

namespace Socigy.Microservices.Content.Requests.Content
{
    public class RecommendationRequest
    {
        public List<ContentType>? ContentTypes { get; set; }
        public Guid? ContentProfile { get; set; }
        public DateTime? PostedBefore { get; set; }
        public DateTime? PostedAfter { get; set; }
        public List<Guid>? CreatorIds { get; set; }
        public List<Guid>? CategoryIds { get; set; }
        public List<Guid>? InterestIds { get; set; }
        public List<Guid>? ExcludedCreatorIds { get; set; }
        public List<Guid>? ExcludedCategoryIds { get; set; }
        public List<Guid>? ExcludedInterestIds { get; set; }
        public int Limit { get; set; } = 10;
        public int Offset { get; set; } = 0;

        public string? Search { get; set; }
        public Guid? TargetUserId { get; set; }
    }
}

using Socigy.Microservices.Plugins.Enums;
using Socigy.Services.Communication;
using Socigy.Services.Database;

namespace Socigy.Microservices.Plugins.Requests
{
    public class PluginRecommendationRequest : IRequest
    {
        public string? Search { get; set; }
        public Guid? OwnerId { get; set; }
        public List<Guid>? CategoryIds { get; set; }
        public List<Guid>? ExcludedCategoryIds { get; set; }
        public List<Guid>? CreatorIds { get; set; }
        public List<Guid>? ExcludedCreatorIds { get; set; }
        public DateTime? PostedAfter { get; set; }
        public DateTime? PostedBefore { get; set; }
        public IEnumerable<VerificationStatus>? MinVerificationStatuses { get; set; }
        public IEnumerable<PluginCoreLanguage>? PluginLanguages { get; set; }
        public IEnumerable<string>? RegionCodes { get; set; }
        public short? MinAgeRating { get; set; }
        public short? MaxAgeRating { get; set; }
        public short? PaymentType { get; set; }
        public short? Platforms { get; set; }
        public bool? ActiveOnly { get; set; } = true;
        public IEnumerable<PublishStatus>? PublishStatuses { get; set; }
        public int Limit { get; set; } = 10;
        public int Offset { get; set; }

        public string? SortBy { get; set; }
        public string? SortDirection { get; set; }

        public async Task<bool> IsValid(IDatabaseService database, object? additional = null)
        {
            if (PublishStatuses == null)
                PublishStatuses = [Enums.PublishStatus.Published];

            return Limit > 0 && Offset >= 0;
        }
    }
}

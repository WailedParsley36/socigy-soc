namespace Socigy.Microservices.Plugins.Responses
{
    public class PluginStorePageResponse
    {
        public IEnumerable<PluginRecommendation> Hot { get; set; }
        public IEnumerable<PluginRecommendation> NewArrivals { get; set; }
        public IEnumerable<PluginRecommendation> StaffPicks { get; set; }
        public IEnumerable<PluginRecommendation> RecommendedForYou { get; set; }
    }
}

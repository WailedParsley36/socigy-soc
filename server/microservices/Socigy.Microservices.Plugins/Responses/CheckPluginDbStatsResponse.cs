namespace Socigy.Microservices.Plugins.Responses
{
    public class CheckPluginDbStatsResponse
    {
        public int RowMaxLimit { get; set; }
        public int SizeMaxLimit { get; set; }

        public int TotalRows { get; set; }
        public int OccupiedSize { get; set; }
    }
}

using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Structures.Queries
{
    public class CheckPluginDbLimitsResult : IDBObject<int>
    {
        [JsonRequired]
        public int ID { get; set; }

        public bool IsWithinRowLimit { get; set; }
        public bool IsWithinSizeLimit { get; set; }

        public int OccupiedSize { get; set; }
        public int Rows { get; set; }
    }
}

using Socigy.Microservices.Content.Enums;
using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Content.Structures.Posts.Scheduling
{
    public class RecurringStream : IDBObject<Guid>
    {
        [JsonRequired, JsonPropertyName("id")]
        public Guid ID { get; set; }
        public Guid PostId { get; set; }
        public string StreamKey { get; set; }
        public string Platform { get; set; }
        public RecurrencePattern RecurrencePattern { get; set; }
        public int RecurrenceInterval { get; set; }
        public int[] DaysOfWeek { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public TimeSpan TimeOfDay { get; set; }
        public int? EstimatedDuration { get; set; }
        public DateTime? NextStreamAt { get; set; }
        public string Timezone { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

using Socigy.Microservices.Content.Enums;
using Socigy.Microservices.Content.Structures;
using Socigy.Microservices.Content.Structures.Categorization;
using Socigy.Services.Communication;
using Socigy.Services.Database;
using System.Text.Json;

namespace Socigy.Microservices.Content.Requests.Content
{
    public class CreatePostRequest
    {
        // Basic post properties
        public ContentType ContentType { get; set; }
        public string? Title { get; set; }
        public string? Content { get; set; }
        public string? ExternalUrl { get; set; }
        public VisibilityType Visibility { get; set; } = VisibilityType.Public;
        public bool IsDraft { get; set; } = false;
        public JsonDocument? Metadata { get; set; }

        // Media files
        public List<IFormFile>? Files { get; set; }

        // Collaborators
        public List<CollaboratorRequest>? Collaborators { get; set; }

        // Locations
        public List<LocationRequest>? Locations { get; set; }

        // Categories and interests
        public List<Guid>? InterestIds { get; set; }

        // Privacy
        public List<Guid>? CircleIds { get; set; }

        // Polls
        public string? PollQuestion { get; set; }
        public List<string>? PollOptions { get; set; }

        // Series
        public Guid? SeriesId { get; set; }
        public int? EpisodeNumber { get; set; }
        public string? EpisodeTitle { get; set; }

        // Scheduling
        public bool IsScheduled { get; set; }
        public DateTime? ScheduledFor { get; set; }
        public bool IsRecurring { get; set; }
        public RecurrencePattern? RecurrencePattern { get; set; }
        public int? RecurrenceInterval { get; set; }
        public IEnumerable<int>? DaysOfWeek { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Timezone { get; set; }

        // Streams
        public string? Platform { get; set; }
        public int? EstimatedDuration { get; set; }

        // Sequences
        public bool IsSequence { get; set; }
        public string? SequenceName { get; set; }
        public string? SequenceDescription { get; set; }
        public int? IntervalDays { get; set; }

        public async Task<bool> IsValid(IDatabaseService db, object? additional = null)
        {
            // Basic validation
            if (ContentType == ContentType.Quote && string.IsNullOrEmpty(Title) && string.IsNullOrEmpty(Content) && string.IsNullOrEmpty(ExternalUrl) && (Files == null || Files.Count == 0))
                return false;

            if (ContentType == ContentType.Poll && (string.IsNullOrEmpty(PollQuestion) || PollOptions == null || PollOptions.Count < 2))
                return false;

            if (IsScheduled && !ScheduledFor.HasValue)
                return false;

            if (IsRecurring && !RecurrencePattern.HasValue)
                return false;

            if (Visibility == VisibilityType.CustomCircles && (CircleIds == null || CircleIds.Count == 0))
                return false;

            // Validate that all interest IDs exist if provided
            if (InterestIds != null && InterestIds.Count > 0)
            {
                // OPTIMAL -> Check all interests using one query
                foreach (var interestId in InterestIds)
                {
                    var interest = (await db.GetByIdAsync<Interest, Guid>(interestId)).Value;
                    if (interest == null)
                        return false;
                }
            }

            switch (ContentType)
            {
                case ContentType.Poll:
                    return !string.IsNullOrEmpty(PollQuestion) &&
                    PollOptions != null &&
                           PollOptions.Count >= 2;

                case ContentType.Frame:
                case ContentType.FullFrame:
                case ContentType.Take:
                    return Files != null && Files.Count > 0;

                case ContentType.Stream:
                case ContentType.LiveTake:
                case ContentType.LivePodcast:
                    // Streams can be scheduled without files
                    return true;

                default:
                    return true;
            }
        }
    }

    public static class CreatePostRequestExtensions
    {
        public static CreatePostRequest ParseFormRequest(HttpContext context)
        {
            var form = context.Request.Form;

            // Parse the CreatePostRequest object
            var request = new CreatePostRequest
            {
                ContentType = Enum.Parse<ContentType>(form["ContentType"]!),
                Title = form["Title"],
                Content = form["Content"],
                ExternalUrl = form["ExternalUrl"],
                Visibility = Enum.TryParse(form["Visibility"], out VisibilityType visibility) ? visibility : VisibilityType.Public,
                IsDraft = bool.TryParse(form["IsDraft"], out bool isDraft) && isDraft,
                Metadata = ParseJsonDocument(form["Metadata"]),
                Files = context.Request.Form.Files.ToList(),
                Collaborators = ParseCollaborators(form["Collaborators"]),
                Locations = ParseLocations(form["Locations"]),
                InterestIds = ParseGuidList(form["InterestIds"]),
                CircleIds = ParseGuidList(form["CircleIds"]),
                PollQuestion = form["PollQuestion"],
                PollOptions = form["PollOptions"].ToString()?.Split(',').ToList(),
                SeriesId = Guid.TryParse(form["SeriesId"], out Guid seriesId) ? seriesId : (Guid?)null,
                EpisodeNumber = int.TryParse(form["EpisodeNumber"], out int episodeNumber) ? episodeNumber : (int?)null,
                EpisodeTitle = form["EpisodeTitle"],
                IsScheduled = bool.TryParse(form["IsScheduled"], out bool isScheduled) && isScheduled,
                ScheduledFor = DateTime.TryParse(form["ScheduledFor"], out DateTime scheduledFor) ? scheduledFor : (DateTime?)null,
                IsRecurring = bool.TryParse(form["IsRecurring"], out bool isRecurring) && isRecurring,
                RecurrencePattern = Enum.TryParse(form["RecurrencePattern"], out RecurrencePattern recurrencePattern) ? recurrencePattern : (RecurrencePattern?)null,
                RecurrenceInterval = int.TryParse(form["RecurrenceInterval"], out int recurrenceInterval) ? recurrenceInterval : (int?)null,
                DaysOfWeek = ParseIntArray(form["DaysOfWeek"]),
                EndDate = DateTime.TryParse(form["EndDate"], out DateTime endDate) ? endDate : (DateTime?)null,
                Timezone = form["Timezone"],
                Platform = form["Platform"],
                EstimatedDuration = int.TryParse(form["EstimatedDuration"], out int estimatedDuration) ? estimatedDuration : (int?)null,
                IsSequence = bool.TryParse(form["IsSequence"], out bool isSequence) && isSequence,
                SequenceName = form["SequenceName"],
                SequenceDescription = form["SequenceDescription"],
                IntervalDays = int.TryParse(form["IntervalDays"], out int intervalDays) ? intervalDays : (int?)null
            };

            return request;
        }

        private static JsonDocument? ParseJsonDocument(string? jsonString)
        {
            if (string.IsNullOrEmpty(jsonString))
            {
                return null;
            }

            try
            {
                return JsonDocument.Parse(jsonString);
            }
            catch (JsonException)
            {
                return null;
            }
        }

        private static List<Guid>? ParseGuidList(string? input)
        {
            if (string.IsNullOrEmpty(input))
                return null;

            return input.Split(',')
                        .Select(id => Guid.TryParse(id, out var guid) ? guid : (Guid?)null)
                        .Where(guid => guid.HasValue)
                        .Select(guid => guid.Value)
                        .ToList();
        }

        private static List<int>? ParseIntArray(string? input)
        {
            if (string.IsNullOrEmpty(input))
                return null;

            return input.Split(',')
                        .Select(id => int.TryParse(id, out var number) ? number : (int?)null)
                        .Where(number => number.HasValue)
                        .Select(number => number.Value)
                        .ToList();
        }

        private static List<CollaboratorRequest>? ParseCollaborators(string? input)
        {
            if (string.IsNullOrEmpty(input))
                return null;

            // Assuming CollaboratorRequest can be parsed from JSON or a string format
            return System.Text.Json.JsonSerializer.Deserialize<List<CollaboratorRequest>>(input);
        }

        private static List<LocationRequest>? ParseLocations(string? input)
        {
            if (string.IsNullOrEmpty(input))
                return null;

            // Assuming LocationRequest can be parsed from JSON or a string format
            return System.Text.Json.JsonSerializer.Deserialize<List<LocationRequest>>(input);
        }
    }

}

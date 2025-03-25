import { Guid } from "../../Guid";
import { ContentType } from "./RecommendationRequest";
import { VisibilityType } from "./RecommendedPost";

export interface PostUploadData {
  contentType: ContentType;
  title?: string;
  content?: string;
  externalUrl?: string;
  visibility?: VisibilityType;
  isDraft?: boolean;
  metadata?: Record<string, any>;
  files?: File[];
  collaborators?: Array<{ id: string; role: string }>;
  locations?: Array<{ latitude: number; longitude: number; name: string }>;
  interestIds?: string[];
  circleIds?: string[];
  pollQuestion?: string;
  pollOptions?: string[];
  seriesId?: string;
  episodeNumber?: number;
  episodeTitle?: string;
  isScheduled?: boolean;
  scheduledFor?: Date;
  isRecurring?: boolean;
  recurrencePattern?: "Daily" | "Weekly" | "Monthly" | "Yearly";
  recurrenceInterval?: number;
  daysOfWeek?: number[];
  endDate?: Date;
  timezone?: string;
  platform?: string;
  estimatedDuration?: number;
  isSequence?: boolean;
  sequenceName?: string;
  sequenceDescription?: string;
  intervalDays?: number;
}

export function createPostFormData(request: PostUploadData): FormData {
  const formData = new FormData();

  // Add all fields from the request to the FormData
  formData.append("ContentType", ContentType[request.contentType]);

  if (request.title) formData.append("Title", request.title);
  if (request.content) formData.append("Content", request.content);
  if (request.externalUrl) formData.append("ExternalUrl", request.externalUrl);
  if (request.visibility)
    formData.append("Visibility", VisibilityType[request.visibility]);
  if (request.isDraft !== undefined)
    formData.append("IsDraft", request.isDraft.toString());

  if (request.metadata)
    formData.append("Metadata", JSON.stringify(request.metadata));

  // Add files
  if (request.files && request.files.length > 0) {
    request.files.forEach((file) => {
      formData.append("Files", file);
    });
  }

  // Add arrays and objects
  if (request.collaborators)
    formData.append("Collaborators", JSON.stringify(request.collaborators));
  if (request.locations)
    formData.append("Locations", JSON.stringify(request.locations));

  if (request.interestIds && request.interestIds.length > 0) {
    formData.append("InterestIds", request.interestIds.join(","));
  }

  if (request.circleIds && request.circleIds.length > 0) {
    formData.append("CircleIds", request.circleIds.join(","));
  }

  if (request.pollQuestion)
    formData.append("PollQuestion", request.pollQuestion);

  if (request.pollOptions && request.pollOptions.length > 0) {
    formData.append("PollOptions", request.pollOptions.join(","));
  }

  if (request.seriesId) formData.append("SeriesId", request.seriesId);
  if (request.episodeNumber !== undefined)
    formData.append("EpisodeNumber", request.episodeNumber.toString());
  if (request.episodeTitle)
    formData.append("EpisodeTitle", request.episodeTitle);

  if (request.isScheduled !== undefined)
    formData.append("IsScheduled", request.isScheduled.toString());
  if (request.scheduledFor)
    formData.append("ScheduledFor", request.scheduledFor.toISOString());

  if (request.isRecurring !== undefined)
    formData.append("IsRecurring", request.isRecurring.toString());
  if (request.recurrencePattern)
    formData.append("RecurrencePattern", request.recurrencePattern);
  if (request.recurrenceInterval !== undefined)
    formData.append(
      "RecurrenceInterval",
      request.recurrenceInterval.toString()
    );

  if (request.daysOfWeek && request.daysOfWeek.length > 0) {
    formData.append("DaysOfWeek", JSON.stringify(request.daysOfWeek));
  }

  if (request.endDate)
    formData.append("EndDate", request.endDate.toISOString());
  if (request.timezone) formData.append("Timezone", request.timezone);
  if (request.platform) formData.append("Platform", request.platform);

  if (request.estimatedDuration !== undefined) {
    formData.append("EstimatedDuration", request.estimatedDuration.toString());
  }

  if (request.isSequence !== undefined)
    formData.append("IsSequence", request.isSequence.toString());
  if (request.sequenceName)
    formData.append("SequenceName", request.sequenceName);
  if (request.sequenceDescription)
    formData.append("SequenceDescription", request.sequenceDescription);
  if (request.intervalDays !== undefined)
    formData.append("IntervalDays", request.intervalDays.toString());

  return formData;
}

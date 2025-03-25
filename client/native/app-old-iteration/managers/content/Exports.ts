import { UserTagInfo } from "@/components/frames/edit/Types";
import ContentManager from "./V1ContentManager"
import { ImageInfo } from "@/contexts/images/NewSelectedImageContext";
import { ShallowUserInfo } from "../user/Exports";
import { PostVisibility } from "@/app/app/create/images/full-frame/complete";
import { Category } from "@/data/content/Category";
import { Interest } from "@/data/content/Interest";

export type ContentManagerType = ActualContentType;
export type ActualContentType = ContentManager;

export const ContentManagerId = "content"

export const ContentVersions: { [version: string]: () => ContentManagerType } = {
    "v1.0.0": () => new ContentManager(),
}

export interface PostLocation {
    latitude: number
    Longitude: number
}

export type AttachmentType = ImageInfo

export interface PostCollaborator {
    username: string
    tag: number
    description: string
}

export interface BasePostInfo {
    userTags?: UserTagInfo[][]
    locations?: (PostLocation | undefined)[]

    location?: PostLocation
    visibility: PostVisibility

    posted?: (Date | undefined)
    collaborators?: PostCollaborator[]

    categories?: Category[]
    specificCategories?: Category[][]

    interests?: Interest[]
    specificInterests?: Interest[][]
}

export interface FramePost extends BasePostInfo {
    description?: string

    attachments?: ImageInfo[]
    attachmentVisibilities?: PostVisibility[]
    attachmentsPosted?: (Date | undefined)[]
}
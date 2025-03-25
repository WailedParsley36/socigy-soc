import { PostVisibility } from "@/app/app/create/images/full-frame/complete";
import { UserTagInfo } from "@/components/frames/edit/Types";
import { ContentVisibility, PostType } from "./Enums";
import { ShallowUserInfo } from "@/managers/user/Exports";
import { PostLocation } from "@/managers/content/Exports";
import { Interest } from "@/data/content/Interest";
import { Category } from "@/data/content/Category";
import { Guid } from "expo-passkeys/build/ExpoPasskeys.types";

export interface BasePost {
    id: Guid
    owner: ShallowUserInfo

    likes: number
    dislikes: number
    views: number
    shares: number
    forwards: number

    type: PostType,

    comments: any[]

    visibility: ContentVisibility,
    userTags?: UserTagInfo[][],

    posted: Date
    collaborators?: ShallowUserInfo[]
    location?: PostLocation,
    locations?: PostLocation[],

    interests?: Interest[]
    categories?: Category[]
}
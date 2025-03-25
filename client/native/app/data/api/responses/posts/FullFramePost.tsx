import { ImageInfo } from "@/contexts/images/NewSelectedImageContext"
import { BasePost } from "./BasePost"

export interface FullFramePost extends BasePost {
    attachments: ImageInfo[]
}
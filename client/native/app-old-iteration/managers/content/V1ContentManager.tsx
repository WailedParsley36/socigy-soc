import AppInfo from "@/constants/AppInfo";
import { AppState, BaseManager, LogLevel } from "../BaseManager";
import { AsyncResult } from "@/data/api/responses/AsyncResponse";
import { Category } from "@/data/content/Category";
import { Interest } from "@/data/content/Interest";
import { ErrorResponse } from "@/data/api/responses/ErrorResponse";
import { BasePostInfo, FramePost } from "./Exports";
import { FullFramePost } from "@/data/api/responses/posts/FullFramePost";
import { BasePost } from "@/data/api/responses/posts/BasePost";
import { Guid } from "expo-passkeys/build/ExpoPasskeys.types";
import { PostInteractionType } from "@/data/content/PostInteraction";

export default class V1ContentManager extends BaseManager {
    constructor() {
        super("ContentManager", "v1.0.0")
    }

    async initializeAsync(logLevel: LogLevel, updateState: (state: AppState) => void): Promise<AppState> {
        this.logger._setLogLevel(logLevel)
        this.updateState = updateState;

        this.logger.info("Initialized")
        return AppState.Created;
    }

    async getPopularCategories(limit?: number, offset?: number): Promise<AsyncResult<Category[]>> {
        let url = AppInfo.servers.content + '/category/popular';
        if (limit)
            url += `?limit=${limit}`;
        if (offset)
            url += `${limit ? '&' : '?'}offset=${offset}`;

        const response = await fetch(url);
        if (response.status != 200)
            return { error: await response.json() };

        return {
            result: (await response.json()).map((x: any) => {
                const space = x.name.indexOf(' ');
                return { ...x, name: x.name.substring(space + 1), emoji: x.name.substring(0, space) }
            })
        };
    }

    async getRecommendedInterests(limit?: number, offset?: number): Promise<AsyncResult<Interest[]>> {
        let url = AppInfo.servers.content + '/interest/recommend';
        if (limit)
            url += `?limit=${limit}`;
        if (offset)
            url += `${limit ? '&' : '?'}offset=${offset}`;

        const response = await fetch(url);
        if (response.status != 200)
            return { error: await response.json() };

        return {
            result: (await response.json()).map((x: any) => {
                const space = x.name.indexOf(' ');
                return { ...x, name: x.name.substring(space + 1), emoji: x.name.substring(0, space) }
            })
        };
    }

    async initializeUserCategories(categories: { id: number, score: number }[]) {
        const response = await fetch(AppInfo.servers.content + '/category/initial', {
            method: "POST",
            body: JSON.stringify(categories)
        });
        if (response.status != 200)
            return await response.json() as ErrorResponse;
    }

    async initializeUserInterests(interests: { id: number, score: number }[]) {
        const response = await fetch(AppInfo.servers.content + '/interest/initial', {
            method: "POST",
            body: JSON.stringify(interests)
        });
        if (response.status != 200)
            return await response.json() as ErrorResponse;
    }

    async shareFullFramePost({ attachments, attachmentVisibilities, attachmentsPosted, location, interests, specificCategories, specificInterests, categories, userTags, description, visibility, collaborators, posted, locations }: FramePost): Promise<AsyncResult<boolean>> {
        try {
            const formData = new FormData();
            formData.append("post[visibility]", Number(visibility).toString())
            attachments!.forEach((x, index) => {
                //@ts-ignore
                formData.append(`post[attachments[${index}]]`, { uri: x.edited.uri, name: `attachment${index}.jpg`, type: "image/jpg" })
            })
            attachmentVisibilities && formData.append(`post[attachmentVisibilities]`, JSON.stringify(attachmentVisibilities.map(x => Number(x))))
            description && formData.append("post[description]", description)
            userTags && formData.append("post[userTags]", JSON.stringify(userTags.map(x => [...x.map(y => ({
                username: y.user.username,
                tag: Number(y.user.tag),
                position: y.position
            }))])))
            collaborators && formData.append("post[collaborators]", JSON.stringify(collaborators));
            posted && formData.append("post[posted]", JSON.stringify(posted));
            attachmentsPosted && formData.append("post[attachmentsPosted]", JSON.stringify(attachmentsPosted));
            locations && formData.append("post[locations]", JSON.stringify(locations));
            location && formData.append("post[location]", JSON.stringify(location));

            categories && formData.append("post[categories]", JSON.stringify(categories));
            specificCategories && formData.append("post[specificCategories]", JSON.stringify(specificCategories));

            interests && formData.append("post[interests]", JSON.stringify(interests));
            specificInterests && formData.append("post[specificInterests]", JSON.stringify(specificInterests));

            const response = await fetch(AppInfo.servers.content + "/full-frame/upload", {
                method: "POST",
                headers: {
                    'Content-Type': "multipart/form-data"
                },
                credentials: "include",
                body: formData
            })
            console.log("POST RESPONSE", response.statusText, "\r\nRESPONSE BODY", response.body)
        }
        catch (e) {
            console.error(e)
            return { result: false }
        }

        return { result: true }
    }

    async getPostRecommendations(limit: number = 7, offset: number = 0): Promise<AsyncResult<BasePost[]>> {
        const response = await fetch(AppInfo.servers.content + `/recommend?limit=${limit}&offset=${offset}`);
        if (response.status != 200)
            return { error: await response.json() as ErrorResponse }

        return { result: await response.json() as BasePost[] }
    }

    async batchViewPosts(ids: Guid[]): Promise<ErrorResponse | undefined> {
        const response = await fetch(AppInfo.servers.content + '/view', { method: "POST", body: JSON.stringify(ids) });
        if (response.status != 200)
            return await response.json() as ErrorResponse

        return undefined;
    }

    async interactWithPost(type: PostInteractionType, id: Guid): Promise<ErrorResponse | undefined> {
        const response = await fetch(AppInfo.servers.content + '/interact', {
            method: "POST",
            body: JSON.stringify([{
                type: type,
                postId: id
            }])
        });
        if (response.status != 200)
            return await response.json() as ErrorResponse

        return undefined;
    }

    async getRecommendedFullFrames(): Promise<AsyncResult<FullFramePost[]>> {
        const response = await fetch(AppInfo.servers.content + '/full-frame/recommend');
        if (response.status != 200)
            return { error: await response.json() as ErrorResponse }

        return { result: await response.json() as FullFramePost[] }
    }
}
import AppInfo from "@/constants/AppInfo";
import { AppState, BaseManager, LogLevel } from "../BaseManager";
import { ErrorResponse } from "@/data/api/responses/ErrorResponse";
import { createAsync, signInAsync } from "expo-passkeys";
import Constants from 'expo-constants';
import { TokenResponse } from "@/data/api/responses/TokenResponse";
import { useGlobalSearchParams } from "expo-router";
import { PasskeyRpInfo, PasskeyUserInfo } from "expo-passkeys/build/ExpoPasskeys.types";
import { PasskeyChallengeInfo } from "@/data/api/responses/PasskeyChallengeResponse";
import { AsyncResult } from "@/data/api/responses/AsyncResponse";
import { User } from "@/data/User";
import { PhoneNumber } from "libphonenumber-js";
import { ContactImportResponse } from "@/data/api/responses/ContactImportResponse";
import { ShallowUserInfo, UserRelationship } from "./Exports";

export default class UserManager extends BaseManager {
    constructor() {
        super("UserManager", "v1.0.0")
    }

    async initializeAsync(logLevel: LogLevel, updateState: (state: AppState) => void): Promise<AppState> {
        this.logger._setLogLevel(logLevel);
        this.updateState = updateState;

        this.logger.info("Initialized");
        return AppState.Created;
    }

    async importUserContacts(contacts: { internalId: string, name: string, firstName?: string, lastName?: string, emails: string[], phoneNumbers: { number: string, countryCode?: string }[] }[]): Promise<AsyncResult<ContactImportResponse[]>> {
        const response = await fetch(AppInfo.servers.user + '/contacts/import', {
            method: "POST",
            body: JSON.stringify(contacts)
        });
        if (response.status != 200)
            return { error: await response.json() as ErrorResponse };
        else
            return { result: await response.json() as ContactImportResponse[] };
    }

    async getAlreadyRegisteredContacts(): Promise<AsyncResult<{ tag: string, username: string }[]>> {
        const response = await fetch(AppInfo.servers.user + '/contacts/existing')
        if (response.status != 200)
            return { error: await response.json() as ErrorResponse };

        return { result: await response.json() }
    }

    async queryUsersUnknown(query?: string, limit: number = 10, offset: number = 0, self: boolean = false): Promise<ShallowUserInfo[]> {
        const response = await fetch(AppInfo.servers.user + `/query?limit=${limit}&offset=${offset}&self=${self}`, {
            method: "POST",
            body: JSON.stringify({
                generalQuery: query
            })
        })
        if (response.status != 200)
            return []

        return (await response.json() as ShallowUserInfo[]);
    }

    async sendUserFriendRequestByUsername(username: string, tag: string) {
        const response = await fetch(AppInfo.servers.user + `/relationship/friend/add?username=${username}&tag=${tag}`, {
            method: "POST",
            body: ""
        })
        if (response.status != 200)
            return await response.json() as ErrorResponse
    }

    async getIncomingRelationships(limit: number = 10, offset: number = 0): Promise<AsyncResult<UserRelationship[]>> {
        const response = await fetch(AppInfo.servers.user + `/relationship/all/incoming?limit=${limit}&offset=${offset}`)
        if (response.status != 200)
            return { error: await response.json() as ErrorResponse }

        return { result: await response.json() as UserRelationship[] }
    }

    async getAllRelationships(limit: number = 10, offset: number = 0): Promise<AsyncResult<UserRelationship[]>> {
        const response = await fetch(AppInfo.servers.user + `/relationship/all?limit=${limit}&offset=${offset}`)
        if (response.status != 200)
            return { error: await response.json() as ErrorResponse }

        return { result: await response.json() as UserRelationship[] }
    }

    async acceptIncomingRelationshipByUsername(username: string, tag: string) {
        const response = await fetch(AppInfo.servers.user + `/relationship/friend/accept?username=${username}&tag=${tag}`, {
            method: "POST",
            body: ""
        })
        if (response.status != 200)
            return await response.json() as ErrorResponse
    }
    async rejectIncomingRelationshipByUsername(username: string, tag: string) {
        const response = await fetch(AppInfo.servers.user + `/relationship/friend/reject?username=${username}&tag=${tag}`, {
            method: "POST",
            body: ""
        })
        if (response.status != 200)
            return await response.json() as ErrorResponse
    }
    
    async removeFriendByUsername(username: string, tag: string) {
        const response = await fetch(AppInfo.servers.user + `/relationship/friend/remove?username=${username}&tag=${tag}`, {
            method: "POST",
            body: ""
        })
        if (response.status != 200)
            return await response.json() as ErrorResponse
    }

    async addCloseFriendByUsername(username: string, tag: string) {
        const response = await fetch(AppInfo.servers.user + `/relationship/close-friend/add?username=${username}&tag=${tag}`, {
            method: "POST",
            body: ""
        })
        if (response.status != 200)
            return await response.json() as ErrorResponse
    }
    async removeCloseFriendByUsername(username: string, tag: string) {
        const response = await fetch(AppInfo.servers.user + `/relationship/close-friend/remove?username=${username}&tag=${tag}`, {
            method: "POST",
            body: ""
        })
        if (response.status != 200)
            return await response.json() as ErrorResponse
    }
}
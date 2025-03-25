import UserManager from "./V1UserManager"

export type UserManagerType = ActualUserType;
export type ActualUserType = UserManager;

export const UserManagerId = "user"

export const UserVersions: { [version: string]: () => ActualUserType } = {
    "v1.0.0": () => new UserManager(),
}

export interface ShallowUserInfo {
    username: string
    tag: string
    iconUrl?: string,
    relationship?: RelationshipState
}

export enum RelationshipState {
    None = 0,
    Sent = 1,
    Viewed = 2,

    Follower = 4,
    Subscriber = 8,

    Friends = 16,
    CloseFriends = 32,

    Rejected = 64,
    Restricted = 128,
    Blocked = 256
}

export interface UserRelationship {
    username: string
    tag: string
    iconUrl?: string

    state: RelationshipState

    sent: Date
    lastUpdate: Date
}
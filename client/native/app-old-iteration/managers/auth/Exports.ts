import AuthManager from "./V1AuthManager"

export type AuthManagerType = ActualAuthType;
export type ActualAuthType = AuthManager;

export const AuthManagerId = "auth"

export const AuthVersions: { [version: string]: () => AuthManagerType } = {
    "v1.0.0": () => new AuthManager(),
}
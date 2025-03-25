export interface ContactImportResponse {
    internalId: string,
    tag: string,
    username: string,
    profileIconUrl?: string

    friendRequestSent?: boolean
}
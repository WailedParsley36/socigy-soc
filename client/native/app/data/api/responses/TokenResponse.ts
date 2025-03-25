export interface TokenResponse {
    accessToken?: string
    accessTokenExpiry: Date

    refreshToken?: string
    refreshTokenExpiry: Date,

    mfaOnly: boolean
}
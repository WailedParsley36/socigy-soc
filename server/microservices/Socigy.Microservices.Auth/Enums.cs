namespace Socigy.Microservices.Auth.Enums
{
    public enum MfaType : short
    {
        Email,
        PhoneNumber,
        Authenticator,
        Application
    }

    public enum SecurityEventType : short
    {
        MFA_ENABLED,
        DEVICE_BLOCKED,
        NEW_DEVICE_SIGN_IN,
        NEW_PASSKEY_LINKED_TO_ACCOUNT,
        DEVICE_TRUSTED,
        MFA_REMOVED
    }

    public enum UserTokenType : short
    {
        Access,
        Refresh,
        Challenge,
        PasskeyChallenge,

        EmailMFA,
        TotpMFA,
        TotpMFABackup
    }
}

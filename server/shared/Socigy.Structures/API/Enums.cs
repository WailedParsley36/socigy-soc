using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Socigy.Structures.API.Enums
{
    public enum ErrorCode
    {
        UNKNOWN_ERROR = 0,
        UNEXPECTED_ERROR = 1,

        NOT_IMPLEMENTED_ERROR = 2,
        NOT_SUPPORTED_ERROR = 3,

        BAD_REQUEST_ERROR = 4,

        INVALID_MFA_CODE_ERROR = 20,
        PASSKEY_CORRUPTED_ERROR = 21,
        REGISTRATION_NOT_COMPLETED_ERROR = 22,
        EXISTING_DEVICE_REQUIRED_ERROR = 23,


        TOO_MANY_ATTEMPTS_ERROR = 24,
        TOTP_REVOKED = 25,
        TOTP_NOT_ENABLED = 26,
        CONTACT_SUPPORT = 27,
        REVOKED_ERROR = 28,
    }
}

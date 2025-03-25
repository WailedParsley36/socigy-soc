using Microsoft.AspNetCore.Http;
using Socigy.Structures.API.Communication;
using Socigy.Structures.API.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace Socigy.Structures.API
{
    public static class ErrorHelper
    {
        private static readonly Dictionary<ErrorCode, string> _ErrorMappings = new()
        {
            { ErrorCode.UNEXPECTED_ERROR, "Unexpected error happened"},
            { ErrorCode.BAD_REQUEST_ERROR, "Request is invalid. Please try again with valid payload"},
            { ErrorCode.UNKNOWN_ERROR, "Unknown error happened"},
            { ErrorCode.NOT_IMPLEMENTED_ERROR, "{0} is not implemented"},
            { ErrorCode.NOT_SUPPORTED_ERROR, "{0} is not supported"},
            { ErrorCode.INVALID_MFA_CODE_ERROR, "Provided MFA code was invalid"},
            { ErrorCode.PASSKEY_CORRUPTED_ERROR, "Used passkey is corrupted"},
            { ErrorCode.REGISTRATION_NOT_COMPLETED_ERROR, "Please complete your registration first"},
            { ErrorCode.EXISTING_DEVICE_REQUIRED_ERROR, "This device was not used before. Please try again"},
            { ErrorCode.TOO_MANY_ATTEMPTS_ERROR, "Too many attempts. Try again later"},
            { ErrorCode.TOTP_REVOKED, "TOTP has been disabled"},
            { ErrorCode.TOTP_NOT_ENABLED, "TOTP has not been setup"},
            { ErrorCode.CONTACT_SUPPORT, "Something critical happened, please contact the support at support@socigy.com with this code: '{0}'"},
            { ErrorCode.REVOKED_ERROR, "This {0} was revoked" }
        };

        public static ErrorResponse FromCode(ErrorCode code, params object[] additionalArgs)
        {
            return new ErrorResponse(
                code.ToString(),
                String.Format(_ErrorMappings[code], additionalArgs),
                (int)code
            );
        }
    }
}

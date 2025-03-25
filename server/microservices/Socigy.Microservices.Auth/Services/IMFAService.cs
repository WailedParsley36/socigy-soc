using Socigy.Microservices.Auth.Enums;
using Socigy.Microservices.Auth.Structures;
using Socigy.Services.Communication;
using Socigy.Structures.API.Communication;

namespace Socigy.Microservices.Auth.Services
{
    public interface IMFAService
    {
        Task<MFASettings?> GetDefaultMfa(Guid targetUser);
        Task<MfaType?> ExecuteDefaultMfa(Guid targetUser, short deviceId, bool recovery = false);

        #region Emails
        Task SendEmailMFA(Guid targetUser, short deviceId, string email, string firstName, bool recovery = false);
        Task<AsyncResult<bool>> VerifyEmailMFA(Guid targetUser, short deviceId, string emailCode);
        #endregion

        #region TOTP
        Task<(string Url, string[] BackupCodes)?> EnableTotpAsync(Guid targetUser, short deviceId);
        Task<bool> DisableTotpAsync(Guid targetUser, short deviceId, bool sendEmails = true);

        Task<AsyncResult<bool>> VerifyTotpCode(Guid targetUser, string code, short deviceId, DateTime? time = null, int windowSize = 1);
        Task<AsyncResult<(string Url, string[] BackupCodes)>> RecoverTotp(Guid targetUser, string backupCode, short deviceId);

        #endregion
    }
}

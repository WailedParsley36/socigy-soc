using Microsoft.AspNetCore.DataProtection;
using NpgsqlTypes;
using Socigy.Connectors.User.Info;
using Socigy.Microservices.Auth.Enums;
using Socigy.Microservices.Auth.Middlewares;
using Socigy.Microservices.Auth.Requests;
using Socigy.Microservices.Auth.Responses;
using Socigy.Microservices.Auth.Services;
using Socigy.Microservices.Auth.Structures;
using Socigy.Middlewares.Attributes;
using Socigy.Middlewares.Helpers;
using Socigy.Services.Communication;
using Socigy.Services.Database;
using Socigy.Services.Emailing;
using System.Text.Json.Serialization.Metadata;
using UAParser;

namespace Socigy.Microservices.Auth.Controllers.Security
{
    [Auth]
    public class SecurityApiController : BaseApiController
    {
        private readonly IDatabaseService _Db;
        private readonly IEmailService _Emails;
        private readonly IMFAService _Mfa;
        private readonly UserInfoGrpcService.UserInfoGrpcServiceClient _User;
        public SecurityApiController(IJsonTypeInfoResolver jsonTypeInfoResolver, IDatabaseService db, IMFAService mfa, IEmailService emails, UserInfoGrpcService.UserInfoGrpcServiceClient user) : base(jsonTypeInfoResolver)
        {
            _Emails = emails;
            _User = user;
            _Db = db;
        }

        #region Login Attempts
        public async Task<IResult> ListLoginAttempts(HttpContext context, int limit = 10, int offset = 0)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var result = _Db.GetMultipleWhen<UserLoginAttempt, (int, Guid)>($"user_uuid = @user_id LIMIT @limit OFFSET @offset", null,
                ("limit", limit),
                ("offset", offset),
                ("user_id", uuid));

            return Response(result.ToBlockingEnumerable().Select(x => new UserLoginsResponse()
            {
                AttemptAt = x.AttemptAt,
                Success = x.Success,
                DeviceId = x.DeviceId,
                IpAddress = x.IpAddress.ToString(),
                UserAgent = x.UserAgent
            }));
        }
        public async Task<IResult> ListDeviceLoginAttempts(HttpContext context, short deviceId, int limit = 10, int offset = 0, CancellationToken token = default)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var result = _Db.GetMultipleWhen<UserLoginAttempt, (int, Guid)>($"user_uuid = @user_id AND device_id = @device_id LIMIT @limit OFFSET @offset", null,
                ("limit", limit),
                ("device_id", deviceId),
                ("offset", offset),
                ("user_id", uuid));

            return Response(result.ToBlockingEnumerable().Select(x => new UserLoginsResponse()
            {
                AttemptAt = x.AttemptAt,
                Success = x.Success,
                DeviceId = x.DeviceId,
                IpAddress = x.IpAddress.ToString(),
                UserAgent = x.UserAgent
            }));
        }
        #endregion

        #region Security Logs
        public async Task<IResult> ListSecurityEvents(HttpContext context, int limit = 10, int offset = 0)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var result = _Db.GetMultipleWhen<SecurityLog, (int, Guid)>($"user_uuid = @user_id LIMIT @limit OFFSET @offset", null,
                ("limit", limit),
                ("offset", offset),
                ("user_id", uuid));

            return Response(result.ToBlockingEnumerable().Select(x => new SecurityLogResponse()
            {
                ID = x.ID.Item1,
                IpAddress = x.IpAddress.ToString(),
                Arguments = x.Arguments,
                Details = x.Details,
                EventAt = x.EventAt,
                EventType = x.EventType
            }));
        }
        #endregion

        #region MFA
        public async Task<IResult> ListMFASettings(HttpContext context, int limit = 10, int offset = 0)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var result = _Db.GetMultipleWhen<MFASettings, (MfaType, Guid)>($"user_uuid = @user_id LIMIT @limit OFFSET @offset", null,
                ("limit", limit),
                ("offset", offset),
                ("user_id", uuid));

            return Response(result.ToBlockingEnumerable().Select(x =>
            {
                return new MFASettingsResponse()
                {
                    CreatedAt = x.CreatedAt,
                    IsDefault = x.IsDefault,
                    Type = x.ID.Item1,
                    IsEnabled = x.IsEnabled,
                    UpdatedAt = x.UpdatedAt,
                };
            }));
        }

        public async Task<IResult> EnableMFASettings(HttpContext context)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var request = await GetFromBodyAsync<EditMFARequest>(context);
            if (request == null)
                return BadRequest();

            var existingMfa = (await _Db.GetByIdAsync<MFASettings, (MfaType, Guid)>((request.Type, uuid))).Value;
            if (existingMfa != null)
                return BadRequest();

            var userDetails = await _User.GetUserInfoByIdInternalAsync(new UserInfoRequest() { TargetUserId = currentUser.UserId });
            switch (request.Type)
            {
                case MfaType.Email:
                    await _Mfa.SendEmailMFA(uuid, (short)currentUser.DeviceId, userDetails.Email, userDetails.FirstName);
                    break;

                case MfaType.Authenticator:
                    {
                        var result = await _Mfa.EnableTotpAsync(uuid, (short)currentUser.DeviceId);
                        if (!result.HasValue)
                            return Unexpected();

                        return Response(new EnableTotpResponse()
                        {
                            BackupCodes = result.Value.BackupCodes,
                            Url = result.Value.Url
                        });
                    }

                case MfaType.PhoneNumber:
                    // LOW - Phone number impl
                    break;

                case MfaType.Application:
                    // LOW - App impl
                    break;
            }

            return Results.Ok();
        }
        public async Task<IResult> EditMFASettings(HttpContext context)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var request = await GetFromBodyAsync<EditMFARequest>(context);
            if (request == null)
                return BadRequest();

            var existingMfa = (await _Db.GetByIdAsync<MFASettings, (MfaType, Guid)>((request.Type, uuid))).Value;
            if (existingMfa == null || !existingMfa.IsEnabled || request.IsDefault == false)
                return BadRequest();

            existingMfa.IsDefault = true;
            await existingMfa.UpdateAsync<MFASettings, (MfaType, Guid)>(_Db, null, nameof(MFASettings.IsDefault));

            await _Db.ExecuteNonQueryAsync($"UPDATE {_Db.GetTableName<MFASettings>()} SET is_default = false WHERE user_uuid = @user_id", null,
                ("user_id", uuid));

            return Results.Ok();
        }
        public async Task<IResult> RemoveMFASettings(HttpContext context, short mfaType)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var type = (MfaType)mfaType;
            var existingMfa = (await _Db.GetByIdAsync<MFASettings, (MfaType, Guid)>((type, uuid))).Value;
            if (existingMfa == null || existingMfa.IsDefault)
                return BadRequest();

            switch (existingMfa.ID.Item1)
            {
                case MfaType.Authenticator:
                    await _Mfa.DisableTotpAsync(uuid, (short)currentUser.DeviceId);
                    break;

                default:
                    await existingMfa.DeleteAsync<MFASettings, (MfaType, Guid)>(_Db);
                    break;
            }

            await new SecurityLog()
            {
                ID = (await SecurityLog.NextId(_Db, uuid), uuid),
                Details = $"MFA of type {type} was removed",
                EventType = Enums.SecurityEventType.MFA_REMOVED,
                IpAddress = UserAgentHelper.GetUserDeviceInfo(context).IP ?? context.Connection.RemoteIpAddress ?? System.Net.IPAddress.None,
            }.TryInsertAsyncOverride<SecurityLog, (int, Guid)>(_Db, false, overrides: ("arguments", NpgsqlDbType.Jsonb));

            // MEDIUM - Send better email
            var userDetails = await _User.GetUserInfoByIdInternalAsync(new UserInfoRequest() { TargetUserId = currentUser.UserId });
            await _Emails.BuildEmail()
                .WithReceiver(userDetails.FirstName, userDetails.Email)
                .WithSubject("Security Alert - MFA method removed")
                .WithBody("Security alert. MFA method was removed from your account...")
                .SendAsync();

            return Results.Ok();
        }
        #endregion

        public override void MapRoutes(IEndpointRouteBuilder routeBuilder)
        {
            var group = routeBuilder.MapGroup("/security");
            group.MapGet("/logins", (Delegate)ListLoginAttempts);
            group.MapGet("/logins/{deviceId}", (Delegate)ListDeviceLoginAttempts);

            group.MapGet("/events", (Delegate)ListSecurityEvents);

            group.MapGet("/mfa", (Delegate)ListMFASettings);
            group.MapPost("/mfa", (Delegate)EnableMFASettings);
            group.MapPatch("/mfa", (Delegate)EditMFASettings);
            group.MapDelete("/mfa", (Delegate)RemoveMFASettings);
        }
    }
}

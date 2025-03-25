using NpgsqlTypes;
using Socigy.Connectors.User.Info;
using Socigy.Microservices.Auth.Middlewares;
using Socigy.Microservices.Auth.Requests;
using Socigy.Microservices.Auth.Responses;
using Socigy.Microservices.Auth.Structures;
using Socigy.Middlewares.Attributes;
using Socigy.Middlewares.Helpers;
using Socigy.Services.Communication;
using Socigy.Services.Database;
using Socigy.Services.Emailing;
using Socigy.Structures.API.Enums;
using System.Text.Json.Serialization.Metadata;

namespace Socigy.Microservices.Auth.Controllers.Devices
{
    [Auth]
    public class DeviceApiController : BaseApiController
    {
        private readonly IDatabaseService _Db;
        private readonly IEmailService _Emails;
        private readonly UserInfoGrpcService.UserInfoGrpcServiceClient _User;
        public DeviceApiController(IJsonTypeInfoResolver jsonTypeInfoResolver, IDatabaseService db, IEmailService emails, UserInfoGrpcService.UserInfoGrpcServiceClient user) : base(jsonTypeInfoResolver)
        {
            _Emails = emails;
            _User = user;
            _Db = db;
        }

        public async Task<IResult> ListMyDevices(HttpContext context, int limit = 10, int offset = 0)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var result = _Db.GetMultiple<UserDeviceResponse, short>($"SELECT *, CASE WHEN id = @device_id THEN TRUE ELSE FALSE END AS is_current FROM {_Db.GetTableName<UserDevice>()} WHERE user_uuid = @user_id LIMIT @limit OFFSET @offset", null,
                ("limit", limit),
                ("offset", offset),
                ("user_id", uuid),
                ("device_id", currentUser.DeviceId));

            return Response(result.ToBlockingEnumerable());
        }
        public async Task<IResult> EditDevice(HttpContext context, short deviceId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            var request = await GetFromBodyAsync<EditUserDeviceRequest>(context);
            if (request == null)
                return BadRequest();

            var device = (await _Db.GetByIdAsync<UserDevice, (short, Guid)>((deviceId, uuid))).Value;
            if (device == null)
                return Results.NotFound();

            var changes = new List<string>();
            if (!string.IsNullOrEmpty(request.Name))
            {
                device.DeviceName = request.Name;
                changes.Add(nameof(UserDevice.DeviceName));
            }

            var userDetails = await _User.GetUserInfoByIdInternalAsync(new UserInfoRequest() { TargetUserId = currentUser.UserId });
            if (request.IsBlocked != null && device.IsBlocked != request.IsBlocked)
            {
                if (request.IsBlocked == true)
                {
                    // Revoking all tokens associated with the blocked device
                    await _Db.ExecuteNonQueryAsync($"UPDATE {_Db.GetTableName<UserToken>()} SET revoked_at = @revoked_at WHERE device_id = @device_id AND user_uuid = @user_id", null,
                        ("revoked_at", DateTime.UtcNow),
                        ("device_id", device.ID.Item1),
                        ("user_id", uuid));

                    // MEDIUM - Send better device blocked emails
                    await _Emails.BuildEmail()
                        .WithReceiver(userDetails.FirstName, userDetails.Email)
                        .WithSubject("Security Alert - New Device was blocked!")
                        .WithBody("Security alert. New device was blocked on your account...")
                        .SendAsync();
                }
                else
                {
                    if (device.IsBlocked)
                    {
                        await _Db.ExecuteNonQueryAsync($"DELETE FROM {_Db.GetTableName<UserToken>()} WHERE device_id = @device_id AND user_uuid = @user_id", null,
                            ("device_id", device.ID.Item1),
                            ("user_id", uuid));
                    }
                    else
                    {
                        // MEDIUM - Send better device unblocked emails
                        await _Emails.BuildEmail()
                            .WithReceiver(userDetails.FirstName, userDetails.Email)
                            .WithSubject("Security Alert - New Device was unblocked!")
                            .WithBody("Security alert. New device was unblocked on your account...")
                            .SendAsync();
                    }
                }

                await new SecurityLog()
                {
                    ID = (await SecurityLog.NextId(_Db, uuid), uuid),
                    Details = request.IsBlocked == true ? $"Device with id {currentUser.DeviceId} was blocked" : $"Device with id {currentUser.DeviceId} was unblocked",
                    EventType = Enums.SecurityEventType.DEVICE_BLOCKED,
                    Arguments = $"{{\"value\":{device.IsBlocked}}}",
                    IpAddress = UserAgentHelper.GetUserDeviceInfo(context).IP ?? context.Connection.RemoteIpAddress ?? System.Net.IPAddress.None
                }.TryInsertAsyncOverride<SecurityLog, (int, Guid)>(_Db, false, overrides: ("arguments", NpgsqlDbType.Jsonb));

                device.IsBlocked = request.IsBlocked.Value;
                changes.Add(nameof(UserDevice.IsBlocked));
            }
            if (request.IsTrusted != null && device.IsTrusted != request.IsTrusted)
            {
                device.IsTrusted = request.IsTrusted.Value;
                changes.Add(nameof(UserDevice.IsTrusted));

                if (request.IsTrusted == true)
                {
                    // MEDIUM - Send better device trust emails
                    await _Emails.BuildEmail()
                        .WithReceiver(userDetails.FirstName, userDetails.Email)
                        .WithSubject("Security Alert - New Device is being trusted!")
                        .WithBody($"Security alert. Device with id {deviceId} was configured to be trusted on your account...")
                        .SendAsync();
                }
                else
                {
                    // MEDIUM - Send better device trust emails
                    await _Emails.BuildEmail()
                        .WithReceiver(userDetails.FirstName, userDetails.Email)
                        .WithSubject("Security Alert - Device was untrusted!")
                        .WithBody($"Security alert. Device with id {deviceId} was untrusted on your account...")
                        .SendAsync();
                }

                await new SecurityLog()
                {
                    ID = (await SecurityLog.NextId(_Db, uuid), uuid),
                    Details = device.IsTrusted ? $"Device with id {deviceId} is trusted" : $"Device with id {deviceId} is not trusted anymore",
                    EventType = Enums.SecurityEventType.DEVICE_TRUSTED,
                    Arguments = $"{{\"value\":{device.IsTrusted}}}",
                    IpAddress = UserAgentHelper.GetUserDeviceInfo(context).IP ?? context.Connection.RemoteIpAddress ?? System.Net.IPAddress.None
                }.TryInsertAsyncOverride<SecurityLog, (int, Guid)>(_Db, false, overrides: ("arguments", NpgsqlDbType.Jsonb));
            }

            if (changes.Count > 0)
                await device.UpdateAsync<UserDevice, (short, Guid)>(_Db, null, [.. changes]);

            return Results.Ok();
        }
        public async Task<IResult> RemoveDevice(HttpContext context, short deviceId)
        {
            var currentUser = AuthMiddleware.GetCurrentUser(context);
            var uuid = Guid.Parse(currentUser!.UserId);

            if (currentUser.DeviceId == deviceId)
                return BadRequest();

            // TODO: Fix this
            await _Db.DeleteByIdAsync<UserDevice, (short, Guid)>(new UserDevice { ID = (deviceId, uuid) });

            // MEDIUM - Notify plugin microservice to delete device_installations

            // MEDIUM - Send better device removal emails
            var userDetails = await _User.GetUserInfoByIdInternalAsync(new UserInfoRequest() { TargetUserId = currentUser.UserId });
            await _Emails.BuildEmail()
                .WithReceiver(userDetails.FirstName, userDetails.Email)
                .WithSubject("Security Alert - Device was removed!")
                .WithBody("Security alert. Device was removed from your account...")
                .SendAsync();

            return Results.Ok();
        }

        public override void MapRoutes(IEndpointRouteBuilder routeBuilder)
        {
            var group = routeBuilder.MapGroup("/devices");
            group.MapGet("/", (Delegate)ListMyDevices);
            group.MapPost("/{deviceId}", (Delegate)EditDevice);
            group.MapDelete("/{deviceId}", (Delegate)RemoveDevice);
        }
    }
}

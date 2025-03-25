using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Socigy.Microservices.Plugins.Enums;
using Socigy.Microservices.Plugins.Structures;
using Socigy.Middlewares;
using Socigy.Middlewares.Attributes;
using Socigy.Services.Communication;
using Socigy.Services.Database;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization.Metadata;
using System.Threading.Tasks;

namespace Socigy.Microservices.Plugins.Controllers.Store
{
    [Auth]
    public class PluginInstallationController : BaseApiController
    {
        private readonly IDatabaseService _Db;

        public PluginInstallationController(IJsonTypeInfoResolver jsonTypeInfoResolver, IDatabaseService db) : base(jsonTypeInfoResolver)
        {
            _Db = db;
        }

        [Auth]
        public async Task<IResult> GetInstallations(HttpContext context)
        {
            var userId = Guid.Parse(AuthMiddleware.GetCurrentUser(context)!.UserId);
            var installations = _Db.GetMultipleWhen<PluginInstallation, Guid>("user_id = @userId", null, ("userId", userId)).ToBlockingEnumerable();

            if (installations == null || !installations.Any())
                return Response(Enumerable.Empty<PluginInstallation>());

            return Response(installations);
        }

        [Auth]
        public async Task<IResult> GetInstallation(HttpContext context, string id)
        {
            var userId = Guid.Parse(AuthMiddleware.GetCurrentUser(context)!.UserId);
            var installationId = DecodeIdParameter(id);

            if (!installationId.HasValue)
            {
                return Results.BadRequest("Invalid installation ID");
            }

            var installation = await _Db.GetWhen<PluginInstallation, Guid>(
                "installation_id = @id AND user_id = @userId",
                null,
                ("id", installationId.Value),
                ("userId", userId));

            return installation == null ? Results.NotFound() : Response(installation);
        }

        [Auth]
        public async Task<IResult> InstallPlugin(HttpContext context)
        {
            var userId = Guid.Parse(AuthMiddleware.GetCurrentUser(context)!.UserId);
            var request = await GetFromBodyAsync<InstallPluginRequest>(context);

            if (request == null)
            {
                return Results.BadRequest("Invalid request data");
            }

            // Check if plugin exists and is published
            var plugin = await _Db.GetWhen<Plugin, Guid>(
                "plugin_id = @pluginId AND publish_status = @publishStatus",
                null,
                ("pluginId", request.PluginId),
                ("publishStatus", (short)PublishStatus.Published));

            if (plugin == null)
            {
                return Results.NotFound("Plugin not found or not published");
            }

            // Check if version exists and is published
            var version = await _Db.GetWhen<PluginVersion, Guid>(
                "version_id = @versionId AND plugin_id = @pluginId AND publish_status = @publishStatus",
                null,
                ("versionId", request.VersionId),
                ("pluginId", request.PluginId),
                ("publishStatus", (short)PublishStatus.Published));

            if (version == null)
            {
                return Results.NotFound("Version not found or not published");
            }

            // Check if already installed
            var existingInstallation = await _Db.GetWhen<PluginInstallation, Guid>(
                "user_id = @userId AND plugin_id = @pluginId",
                null,
                ("userId", userId),
                ("pluginId", request.PluginId));

            if (existingInstallation != null)
            {
                // Update existing installation to new version
                existingInstallation.VersionId = request.VersionId;
                existingInstallation.UpdatedAt = DateTime.UtcNow;

                await existingInstallation.UpdateAsync<PluginInstallation, Guid>(_Db, null, nameof(PluginInstallation.UpdatedAt), nameof(PluginInstallation.SelectedLocalizationId), nameof(PluginInstallation.VersionId));          // Handle device installation if device ID is provided
                if (request.DeviceId.HasValue)
                {
                    await HandleDeviceInstallation(existingInstallation.ID, request.DeviceId.Value);
                }

                return Response(existingInstallation);
            }

            // Create new installation
            var installation = new PluginInstallation
            {
                ID = Guid.NewGuid(),
                UserId = userId,
                PluginId = request.PluginId,
                VersionId = request.VersionId,
                SelectedLocalizationId = request.LocalizationId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await installation.TryInsertAsync<PluginInstallation, Guid>(_Db, false);

            // Handle device installation if device ID is provided
            if (request.DeviceId.HasValue)
            {
                await HandleDeviceInstallation(installation.ID, request.DeviceId.Value);
            }

            return Response(installation);
        }

        [Auth]
        public async Task<IResult> UpdateInstallation(HttpContext context, string id)
        {
            var userId = Guid.Parse(AuthMiddleware.GetCurrentUser(context)!.UserId);
            var installationId = DecodeIdParameter(id);

            if (!installationId.HasValue)
            {
                return Results.BadRequest("Invalid installation ID");
            }

            var request = await GetFromBodyAsync<UpdateInstallationRequest>(context);

            if (request == null)
            {
                return Results.BadRequest("Invalid request data");
            }

            var installation = await _Db.GetWhen<PluginInstallation, Guid>(
                "installation_id = @id AND user_id = @userId",
                null,
                ("id", installationId.Value),
                ("userId", userId));

            if (installation == null)
            {
                return Results.NotFound();
            }

            // If updating version
            if (request.VersionId.HasValue)
            {
                // Check if version exists and is published
                var version = await _Db.GetWhen<PluginVersion, Guid>(
                    "version_id = @versionId AND plugin_id = @pluginId AND publish_status = @publishStatus",
                    null,
                    ("versionId", request.VersionId.Value),
                    ("pluginId", installation.PluginId),
                    ("publishStatus", (short)PublishStatus.Published));

                if (version == null)
                {
                    return Results.NotFound("Version not found or not published");
                }

                installation.VersionId = request.VersionId.Value;
            }

            // If updating localization
            if (request.LocalizationId.HasValue)
            {
                installation.SelectedLocalizationId = request.LocalizationId;
            }

            installation.UpdatedAt = DateTime.UtcNow;
            await installation.UpdateAsync<PluginInstallation, Guid>(_Db, null, nameof(PluginInstallation.UpdatedAt), nameof(PluginInstallation.SelectedLocalizationId), nameof(PluginInstallation.VersionId));

            // Handle device installation if device ID is provided
            if (request.DeviceId.HasValue)
            {
                await HandleDeviceInstallation(installation.ID, request.DeviceId.Value);
            }

            return Results.NoContent();
        }

        [Auth(Ignore = true)]
        public async Task<IResult> UninstallPlugin(HttpContext context, string id)
        {
            var userId = Guid.Parse(AuthMiddleware.GetCurrentUser(context)!.UserId);
            var installationId = DecodeIdParameter(id);

            if (!installationId.HasValue)
            {
                return BadRequest("Invalid installation ID");
            }

            var installation = await _Db.GetWhen<PluginInstallation, Guid>(
                "installation_id = @id AND user_id = @userId",
                null,
                ("id", installationId.Value),
                ("userId", userId));

            if (installation == null)
            {
                return Results.NotFound();
            }

            await _Db.ExecuteNonQueryAsync($"DELETE FROM {_Db.GetTableName<DeviceInstallation>()} WHERE installation_id = @installation_id", null,
                ("installation_id", installationId.Value));

            await installation.DeleteAsync<PluginInstallation, Guid>(_Db);

            return Results.NoContent();
        }

        [Auth]
        public async Task<IResult> GetDeviceInstallations(HttpContext context, string deviceId)
        {
            var userId = Guid.Parse(AuthMiddleware.GetCurrentUser(context)!.UserId);
            var decodedDeviceId = DecodeIdParameter(deviceId);

            if (!decodedDeviceId.HasValue)
            {
                return Results.BadRequest("Invalid device ID");
            }

            // Get all user installations
            var userInstallations = _Db.GetMultipleWhen<PluginInstallation, Guid>(
                "user_id = @userId",
                null,
                ("userId", userId)).ToBlockingEnumerable();

            if (userInstallations == null || !userInstallations.Any())
            {
                return Response(Enumerable.Empty<DeviceInstallation>());
            }

            var installationIds = userInstallations.Select(i => i.ID).ToList();

            // Get device installations for this device
            var deviceInstallations = _Db.GetMultipleWhen<DeviceInstallation, Guid>(
                "device_id = @deviceId AND installation_id = ANY(@installationIds)",
                null,
                ("deviceId", decodedDeviceId.Value),
                ("installationIds", installationIds));

            return Response(deviceInstallations.ToBlockingEnumerable());
        }

        [Auth]
        public async Task<IResult> UpdateDeviceInstallationStatus(HttpContext context, string deviceId, string installationId)
        {
            var userId = Guid.Parse(AuthMiddleware.GetCurrentUser(context)!.UserId);
            var decodedDeviceId = DecodeIdParameter(deviceId);
            var decodedInstallationId = DecodeIdParameter(installationId);

            if (!decodedDeviceId.HasValue || !decodedInstallationId.HasValue)
            {
                return Results.BadRequest("Invalid device ID or installation ID");
            }

            var request = await GetFromBodyAsync<UpdateDeviceInstallationStatusRequest>(context);

            if (request == null)
            {
                return Results.BadRequest("Invalid request data");
            }

            // Verify the installation belongs to the user
            var installation = await _Db.GetWhen<PluginInstallation, Guid>(
                "installation_id = @id AND user_id = @userId",
                null,
                ("id", decodedInstallationId.Value),
                ("userId", userId));

            if (installation == null)
            {
                return Results.NotFound("Installation not found");
            }

            // Get the device installation
            var deviceInstallation = await _Db.GetWhen<DeviceInstallation, Guid>(
                "installation_id = @installationId AND device_id = @deviceId",
                null,
                ("installationId", decodedInstallationId.Value),
                ("deviceId", decodedDeviceId.Value));

            if (deviceInstallation == null)
            {
                return Results.NotFound("Device installation not found");
            }

            // Update status
            deviceInstallation.Status = request.Status;
            deviceInstallation.UpdatedAt = DateTime.UtcNow;

            // If status is Installed, update installed date
            if (request.Status == InstallationStatus.Installed && !deviceInstallation.InstalledAt.HasValue)
            {
                deviceInstallation.InstalledAt = DateTime.UtcNow;
            }

            // If status is Used, update last used date
            if (request.Status == InstallationStatus.Used)
            {
                deviceInstallation.LastUsedAt = DateTime.UtcNow;

                // Also update the main installation's last used date
                installation.LastUsedAt = DateTime.UtcNow;
                await installation.UpdateAsync<PluginInstallation, Guid>(_Db, null, nameof(PluginInstallation.LastUsedAt));
            }

            await deviceInstallation.UpdateAsync<DeviceInstallation, Guid>(_Db, null, nameof(DeviceInstallation.InstalledAt), nameof(DeviceInstallation.LastUsedAt), nameof(DeviceInstallation.Status), nameof(DeviceInstallation.UpdatedAt));

            return Results.NoContent();
        }

        public async Task HandleDeviceInstallation(Guid installationId, Guid deviceId)
        {
            var deviceInstallation = await _Db.GetWhen<DeviceInstallation, Guid>(
                "installation_id = @installationId AND device_id = @deviceId",
                null,
                ("installationId", installationId),
                ("deviceId", deviceId));

            if (deviceInstallation != null)
            {
                deviceInstallation.Status = InstallationStatus.Pending;
                deviceInstallation.UpdatedAt = DateTime.UtcNow;
                await deviceInstallation.UpdateAsync<DeviceInstallation, Guid>(_Db, null, nameof(DeviceInstallation.Status), nameof(DeviceInstallation.UpdatedAt));
            }
            else
            {
                var newDeviceInstallation = new DeviceInstallation
                {
                    ID = Guid.NewGuid(),
                    InstallationId = installationId,
                    DeviceId = deviceId,
                    Status = InstallationStatus.Pending,
                    UpdatedAt = DateTime.UtcNow
                };
                await _Db.InsertAsync<DeviceInstallation, Guid>(newDeviceInstallation, false);
            }
        }

        private Guid? DecodeIdParameter(string paramValue)
        {
            try
            {
                var decoded = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(paramValue));
                if (Guid.TryParse(decoded, out Guid result))
                {
                    return result;
                }
            }
            catch
            {
                if (Guid.TryParse(paramValue, out Guid result))
                {
                    return result;
                }
            }
            return null;
        }

        public override void MapRoutes(IEndpointRouteBuilder routeBuilder)
        {
            var group = routeBuilder.MapGroup("/installations");

            group.MapGet("/", (Delegate)GetInstallations);
            group.MapGet("/{id}", (Delegate)GetInstallation);
            group.MapPost("/", (Delegate)InstallPlugin);
            group.MapPut("/{id}", (Delegate)UpdateInstallation);
            group.MapDelete("/{id}", (Delegate)UninstallPlugin);

            group.MapGet("/device/{deviceId}", (Delegate)GetDeviceInstallations);
            group.MapPut("/device/{deviceId}/{installationId}/status", (Delegate)UpdateDeviceInstallationStatus);
        }
    }

    public class InstallPluginRequest
    {
        public Guid PluginId { get; set; }
        public Guid VersionId { get; set; }
        public Guid? LocalizationId { get; set; }
        public Guid? DeviceId { get; set; }
    }

    public class UpdateInstallationRequest
    {
        public Guid? VersionId { get; set; }
        public Guid? LocalizationId { get; set; }
        public Guid? DeviceId { get; set; }
    }

    public class UpdateDeviceInstallationStatusRequest
    {
        public InstallationStatus Status { get; set; }
    }
}

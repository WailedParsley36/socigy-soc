using Microsoft.AspNetCore.Mvc.Formatters;
using Socigy.Microservices.Plugins.Enums;
using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Plugins.Requests
{
    public class CreateNewPluginVersionRequest
    {
        public IFormFile? Config { get; set; }
        public IFormFile? Module { get; set; }

        public string? VersionString { get; set; }
        public string? SystemApiVersion { get; set; }
        public string? ReleaseNotes { get; set; }

        public bool? IsActive { get; set; } = true;
        public bool? IsBeta { get; set; } = false;

        public static async Task<CreateNewPluginVersionRequest?> FromContext(HttpContext context)
        {
            if (!context.Request.HasFormContentType)
                return null;

            var form = await context.Request.ReadFormAsync();
            var request = new CreateNewPluginRequest();
            if (form.TryGetValue("Title", out var temp))
                request.Title = temp!;

            if (form.TryGetValue("Description", out temp))
                request.Description = temp;

            if (form.TryGetValue("PaymentType", out temp))
                request.PaymentType = Enum.Parse<PaymentType>(temp!, true);

            if (form.TryGetValue("Price", out temp))
                request.Price = decimal.Parse(temp!);

            if (form.TryGetValue("PlatformType", out temp))
                request.Platforms = Enum.Parse<PlatformType>(temp!, true);

            if (form.Files.Any())
                request.Icon = form.Files[0];

            // HIGH mapp from FORM not json body
            if (await request.IsValid(null!))
                return new CreateNewPluginVersionRequest();

            return null;
        }

        public static async Task<CreateNewPluginVersionRequest?> FromContextAsync(HttpContext context)
        {
            var form = await context.Request.ReadFormAsync();

            if (form == null)
                return null;

            var config = form.Files.FirstOrDefault(f => f.Name == "config" || f.FileName.EndsWith("config.json"));
            var module = form.Files.FirstOrDefault(f => f.Name == "module" || f.FileName.EndsWith("module.wasm"));

            var request = new CreateNewPluginVersionRequest()
            {
                Config = config,
                Module = module,
                VersionString = form["versionString"],
                SystemApiVersion = form["systemApiVersion"],
                ReleaseNotes = form["releaseNotes"],
            };

            if (bool.TryParse(form["isActive"], out bool isActive))
                request.IsActive = isActive;

            if (bool.TryParse(form["isBeta"], out bool isBeta))
                request.IsBeta = isBeta;

            return request;
        }
    }
}

using Org.BouncyCastle.Asn1.Ocsp;
using Socigy.Microservices.Plugins.Enums;
using Socigy.Services.Communication;
using Socigy.Services.Database;

namespace Socigy.Microservices.Plugins.Requests
{
    public class CreateNewPluginRequest : IRequest
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public PaymentType? PaymentType { get; set; }
        public decimal? Price { get; set; }

        public PlatformType? Platforms { get; set; }

        public IFormFile? Icon { get; set; }

        public static async Task<CreateNewPluginRequest?> FromContext(HttpContext context)
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

            if (await request.IsValid(null!))
                return request;

            return null;
        }

        public async Task<bool> IsValid(IDatabaseService database, object? additional = null)
        {
            if (Icon.Length > PluginConstants.Plugins.MaxIconSize || string.IsNullOrEmpty(Title))
                return false;
            else if (PaymentType != null && PaymentType == Enums.PaymentType.OneTime && (!Price.HasValue || Price <= 0))
                return false;

            return true;
        }
    }
}

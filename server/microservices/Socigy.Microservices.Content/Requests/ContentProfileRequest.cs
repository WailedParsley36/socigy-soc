using Socigy.Services.Communication;
using Socigy.Services.Database;
using Socigy.Structures.Enums;

namespace Socigy.Microservices.Content.Requests
{
    public class ContentProfileRequest
    {
        public Guid? Id { get; set; }

        public string? Name { get; set; }
        public string? Description { get; set; }

        public ContentProfileVisibility? Visibility { get; set; }
    }
}

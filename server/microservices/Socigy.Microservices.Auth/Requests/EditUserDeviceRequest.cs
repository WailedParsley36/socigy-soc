namespace Socigy.Microservices.Auth.Requests
{
    public class EditUserDeviceRequest
    {
        public string? Name { get; set; }
        public bool? IsTrusted { get; set; }
        public bool? IsBlocked { get; set; }
    }
}

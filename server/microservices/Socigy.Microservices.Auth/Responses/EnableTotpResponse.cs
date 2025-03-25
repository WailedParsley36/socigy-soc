namespace Socigy.Microservices.Auth.Responses
{
    public class EnableTotpResponse
    {
        public string Url { get; set; }
        public string[] BackupCodes { get; set; }
    }
}

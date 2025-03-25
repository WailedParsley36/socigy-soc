using Socigy.Connectors.User.Info;
using Socigy.Services.Communication;
using Socigy.Services.Database;
using Socigy.Structures;
using Socigy.Structures.API.Communication;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace Socigy.Microservices.Auth.Requests
{
    public class RegistrationRequest : IRequest
    {
        public string Username { get; set; }
        public short Tag { get; set; }

        public string Email { get; set; }
        public string FullName { get; set; }

        [JsonIgnore]
        public string FirstName { get; set; }
        [JsonIgnore]
        public string LastName { get; set; }

        public async Task<bool> IsValid(IDatabaseService database, object? additional = null)
        {
            Regex rgx = Regexes.EmailRegex();

            bool result = Username != null &&
                    Tag <= 9999 && Tag >= 0 &&
                    FullName != null &&
                    Email != null && rgx.Matches(Email).Count == 1;

            if (!result || additional == null)
                return false;

            var userService = (UserInfoGrpcService.UserInfoGrpcServiceClient)additional;
            return !(await userService.CheckUserInfoExistsInternalAsync(new()
            {
                Email = Email,

                Username = Username,
                Tag = Tag,
            })).Result;
        }
    }
}

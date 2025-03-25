using Socigy.Structures.Database;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography.Xml;
using System.Security.Principal;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using System.Xml;
using Socigy.Structures.Enums;

namespace Socigy.Structures
{
    public class UserInfo : IDBObject<Guid>
    {
        [JsonRequired]
        public Guid ID { get; set; }

        public string Username { get; set; }
        public short Tag { get; set; }

        public string? IconUrl { get; set; }

        public string Email { get; set; }
        public bool EmailVerified { get; set; }
        public bool RegistrationComplete { get; set; }

        public string? PhoneNumber { get; set; }

        public Sex Sex { get; set; }

        public string FirstName { get; set; }
        public string LastName { get; set; }

        public DateTime? BirthDate { get; set; }

        public bool IsChild { get; set; }
        public Guid? ParentId { get; set; }

        public UserVisibility Visibility { get; set; }
    }
}

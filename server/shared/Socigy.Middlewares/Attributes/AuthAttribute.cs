using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Socigy.Middlewares.Attributes
{
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class AuthAttribute : Attribute
    {
        public bool AllowUnverifiedEmail { get; }
        public bool AllowNonRegistered { get; }

        public bool AdminOnly { get; set; }
        public bool Ignore { get; set; } = false;

        public AuthAttribute(bool allowUnverifiedEmail = false, bool allowNonRegistered = false)
        {
            AllowUnverifiedEmail = allowUnverifiedEmail;
            AllowNonRegistered = allowNonRegistered;
        }
    }
}

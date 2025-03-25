using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Socigy.Structures
{
    public partial class Regexes
    {
        [GeneratedRegex("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$")]
        public static partial Regex EmailRegex();

        [GeneratedRegex("^[a-zA-Z0-9_\\-\\.]+$")]
        public static partial Regex FileRegex();

        [GeneratedRegex("^[a-z]{2}(-[A-Z]{2})?$")]
        public static partial Regex RegionCodeRegex();
    }
}

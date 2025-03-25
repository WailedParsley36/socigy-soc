using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Socigy.Structures.Helpers
{
    public class UserHelper
    {
        public static string FormatUsername(string username, short tag)
        {
            return $"{username} #{tag}";
        }
    }
}

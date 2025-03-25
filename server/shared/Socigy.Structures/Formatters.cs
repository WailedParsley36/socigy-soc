﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Socigy.Structures
{
    public static class FormattExtensions
    {
        public static string AsUserTag(this short val)
        {
            return val.ToString("D4");
        }
    }
}

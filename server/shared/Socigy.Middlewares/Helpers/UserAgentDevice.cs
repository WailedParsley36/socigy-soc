using Socigy.Structures.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace Socigy.Middlewares.Helpers
{
    public class UserAgentDevice
    {
        public IPAddress? IP { get; set; }

        public string Name { get; set; }
        public DeviceType Type { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Socigy.Structures.Enums
{
    [Flags]
    public enum DeviceType : short
    {
        Unknown = 1,
        App = 2,
        Browser = 4,
        Android = 8,
        Windows = 16,
        TvOS = 32,
        IOS = 64,
        MacOSx = 128,
        Mobile = 256,
        Chrome = 512,
        Brave = 1024,
        Linux = 2048,
        iPad = 4096,
        Edge = 8192,
        Safari = 16384
    }

    public enum UserVisibility : short
    {
        Public,
        CirclesOnly,
        CustomCircles
    }

    public enum ContentProfileVisibility : short
    {
        Private,
        Public,
        CirclesOnly,
        CustomCircles
    }

    public enum Sex : short
    {
        PreferNotToSay,
        Male,
        Female,
        Other
    }
}

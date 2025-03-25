using Socigy.Services.Communication;
using Socigy.Structures.API.Communication;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Socigy.Structures.Json
{
    [JsonSerializable(typeof(ErrorResponse))]
    public partial class BaseJsonContext : JsonSerializerContext
    {
    }
}

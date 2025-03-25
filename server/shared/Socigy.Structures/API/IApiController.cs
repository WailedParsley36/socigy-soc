using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Socigy.Structures.API
{
    public interface IApiController
    {
        void MapRoutes(IEndpointRouteBuilder routeBuilder);
    }
}

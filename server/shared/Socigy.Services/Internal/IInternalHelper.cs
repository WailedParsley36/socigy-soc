using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace Socigy.Services.Internal
{
    public interface IInternalHelper
    {
        void AddInternalHeaders(HttpHeaders headers);
        HttpClient GetInternalClient();
    }
}
using Socigy.Services.Database;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Socigy.Services.Communication
{
    public interface IRequest
    {
        Task<bool> IsValid(IDatabaseService database, object? additional = null);
    }
}

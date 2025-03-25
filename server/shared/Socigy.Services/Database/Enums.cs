using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Socigy.Services.Database.Enums
{
    public enum DbConflictHandling
    {
        ThrowException,
        DoNothing,
        UpdateExisting
    }

}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Socigy.Structures.Database
{
    public interface IDBObject<T> : IDBBaseObject
    {
        T ID { get; set; }
    }
}

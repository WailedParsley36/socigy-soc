using Socigy.Structures.API.Communication;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Socigy.Services.Communication
{
    public class AsyncResult<T>
    {
        public T? Result { get; set; }
        public ErrorResponse? Error { get; set; }

        public AsyncResult(ErrorResponse error)
        {
            Error = error;
        }

        public AsyncResult(T result)
        {
            Result = result;
        }

        public AsyncResult(T? result, ErrorResponse nullError)
        {
            if (result == null)
                Error = nullError;
            else
                Result = result;
        }

        public AsyncResult(ErrorResponse? error, T result)
        {
            Result = result;
            Error = error;
        }
    }
}

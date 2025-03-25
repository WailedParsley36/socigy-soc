using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Socigy.Services
{
    public abstract class BaseService : IService
    {
        private readonly ILogger _Logger;
        protected BaseService(ILogger logger)
        {
            _Logger = logger;
        }

        #region Logging
        protected void Log(LogLevel level, string message, params object?[] parameters) =>
            _Logger.Log(level, message, parameters);

        protected void Trace(string message, params object?[] parameters) =>
            Log(LogLevel.Trace, message, parameters);
        protected void Debug(string message, params object?[] parameters) =>
            Log(LogLevel.Debug, message, parameters);
        protected void Info(string message, params object?[] parameters) =>
            Log(LogLevel.Information, message, parameters);
        protected void Warning(string message, params object?[] parameters) =>
           Log(LogLevel.Warning, message, parameters);
        protected void Error(string message, params object?[] parameters) =>
            Log(LogLevel.Error, message, parameters);
        protected void Critical(string message, params object?[] parameters) =>
            Log(LogLevel.Critical, message, parameters);
        #endregion
    }
}

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Socigy.Structures.API.Enums;
using Socigy.Structures.API;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.Json.Serialization.Metadata;
using System.Text.Json;
using System.Threading.Tasks;
using Socigy.Services.Database;
using Socigy.Structures.API.Communication;
using Microsoft.Extensions.Logging;

namespace Socigy.Services.Communication
{
    public abstract class BaseApiController : IApiController
    {
        protected readonly IJsonTypeInfoResolver JsonResolver;
        protected readonly JsonSerializerOptions _SerializerOptions;
        public BaseApiController(IJsonTypeInfoResolver jsonTypeInfoResolver)
        {
            JsonResolver = jsonTypeInfoResolver;
            _SerializerOptions = new JsonSerializerOptions(JsonSerializerDefaults.Web) { TypeInfoResolver = jsonTypeInfoResolver, DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull };
        }

        public abstract void MapRoutes(IEndpointRouteBuilder routeBuilder);

        #region Utility
        protected IPAddress? GetRequestIpAddress(HttpContext context) =>
            IPAddress.Parse(context.Request.Headers.FirstOrDefault(x => x.Key == "X-Real-IP").Value!) ?? context.Connection.RemoteIpAddress;
        #endregion

        #region Communication Handling
        protected IResult Error(ErrorCode code, HttpStatusCode status = HttpStatusCode.InternalServerError, params object[] args)
        {
            return Results.Json(ErrorHelper.FromCode(code), _SerializerOptions, statusCode: (int)status);
        }

        protected IResult Error(ErrorResponse error, HttpStatusCode status = HttpStatusCode.InternalServerError)
        {
            return Results.Json(error, _SerializerOptions, statusCode: (int)status);
        }

        protected IResult BadRequest(params object[] args)
        {
            return Error(ErrorCode.BAD_REQUEST_ERROR, HttpStatusCode.BadRequest, args);
        }
        protected IResult Unexpected(params object[] args)
        {
            return Error(ErrorCode.UNEXPECTED_ERROR, HttpStatusCode.InternalServerError, args);
        }

        public async Task<T?> GetFromBodyAsync<T>(HttpContext context)
        {
            if (!context.Request.HasJsonContentType())
                return default;

            return await context.Request.ReadFromJsonAsync<T>(_SerializerOptions);
        }
        protected async Task<(T? Result, IResult? Error)> RequestAsync<T>(HttpContext context, IDatabaseService? db = null, object? additional = null) where T : IRequest
        {
            var request = await GetFromBodyAsync<T>(context);
            if (request == null || !await request.IsValid(db!, additional))
                return (default, BadRequest());

            return (request, null);
        }
        protected IResult Response<T>(T response)
        {
            var typeInfo = JsonResolver.GetTypeInfo(typeof(T), _SerializerOptions) ??
                throw new Exception($"The requested type is not registered in any json context! {typeof(T).FullName}");

            return Results.Content(
                JsonSerializer.Serialize(response, typeInfo),
                "application/json",
                Encoding.UTF8,
                200);
        }
        #endregion
    }
}

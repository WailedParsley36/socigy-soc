using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Socigy.Services.Database;
using Socigy.Structures.API;
using Socigy.Structures.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization.Metadata;
using System.Threading.Tasks;

namespace Socigy.Services
{
    public static class WebBuilderExtensions
    {
        public static WebApplicationBuilder AddBaseServices(this WebApplicationBuilder builder, params JsonTypeInfo[] controllers)
        {
            builder.Services.AddSingleton<IDatabaseService, PostgreSQLDatabaseService>();

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("default", policy =>
                    policy
                    .AllowAnyHeader()
                    .AllowCredentials()
                    .AllowAnyMethod()
                    .WithOrigins("https://socigy.com", "https://api.socigy.com", "https://dev.socigy.com", "https://business.socigy.com", "https://localhost")
                );
            });

            builder.Services.AddAntiforgery(options =>
            {
                options.Cookie.Name = "XSRF-TOKEN";
                options.HeaderName = "X-XSRF-TOKEN";
            });

            return builder;
        }
    }
}

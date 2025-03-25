using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using Org.BouncyCastle.Tls;
using Serilog;
using Serilog.Formatting.Json;
using Serilog.Sinks.Grafana.Loki;
using Socigy.Connectors.Auth.Internal;
using Socigy.Connectors.Auth.Tokens;
using Socigy.Connectors.User.Info;
using Socigy.Services.Internal;
using Socigy.Structures.API;
using Socigy.Structures.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization.Metadata;
using System.Threading.Tasks;

namespace Socigy.Middlewares
{
    public static class WebBuilderExtensions
    {
        public static WebApplication UseInternalAccessMiddleware(this WebApplication app)
        {
            app.Services.GetRequiredService<InternalHelper>();
            app.UseMiddleware<InternalOnlyMiddleware>();
            return app;
        }

        public static WebApplicationBuilder AddInternalAccessMiddleware(this WebApplicationBuilder builder, string internalUrl)
        {
            builder.Services.AddSingleton<InternalHelper>();
            builder.Services.AddGrpcClient<InternalCredVerifier.InternalCredVerifierClient>(options =>
            {
                options.Address = new Uri(internalUrl);
                options.CallOptionsActions.Add(InternalHelper.AddGrpcInternalHeaders);
            });
            builder.Services.AddSingleton<InternalOnlyMiddleware>();
            return builder;
        }

        public static WebApplication UseAuthMiddleware(this WebApplication app)
        {
            app.UseMiddleware<AuthMiddleware>();
            return app;
        }

        public static WebApplicationBuilder AddUserInfoGrpcClient(this WebApplicationBuilder builder, string userUrl)
        {
            builder.Services.AddGrpcClient<UserInfoGrpcService.UserInfoGrpcServiceClient>(options =>
            {
                options.Address = new Uri(userUrl);
                options.CallOptionsActions.Add(InternalHelper.AddGrpcInternalHeaders);
            });

            return builder;
        }

        public static WebApplicationBuilder AddAuthMiddleware(this WebApplicationBuilder builder, string authUrl)
        {
            builder.Services.AddGrpcClient<TokenGrpcService.TokenGrpcServiceClient>(options =>
            {
                options.Address = new Uri(authUrl);
                options.CallOptionsActions.Add(InternalHelper.AddGrpcInternalHeaders);
            });
            builder.Services.AddSingleton<AuthMiddleware>();
            return builder;
        }

        public static WebApplicationBuilder AddEnvironmentVariables(this WebApplicationBuilder builder)
        {
            builder.Configuration.AddEnvironmentVariables();
            return builder;
        }

        public static WebApplicationBuilder AddJsonContexts(this WebApplicationBuilder builder, params IJsonTypeInfoResolver[] resolvers)
        {
            var resolver = JsonTypeInfoResolver.Combine([.. resolvers, BaseJsonContext.Default]);
            builder.Services.AddSingleton<IJsonTypeInfoResolver>(resolver);

            builder.Services.Configure<JsonHubProtocolOptions>(o =>
            {
                o.PayloadSerializerOptions.TypeInfoResolverChain.Insert(0, resolver);
                o.PayloadSerializerOptions.TypeInfoResolver = resolver;
            });
            return builder;
        }

        public static WebApplicationBuilder AddTelemetryAndLogs(this WebApplicationBuilder builder, string microserviceName, string service, string ns, string version)
        {
            var resourceBuilder = ResourceBuilder.CreateDefault().AddService(microserviceName);

            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Debug()
                .Enrich.FromLogContext()
                .Enrich.WithEnvironmentName()
                .Enrich.WithProcessId()
                .Enrich.WithMachineName()
                .WriteTo.Console(new JsonFormatter())
                .WriteTo.GrafanaLoki("http://loki.monitoring.svc.cluster.local:3100", [
                    new() { Key = "app", Value = service },
                    new() { Key = "job", Value = $"{ns}/{service}" },
                    new() { Key = "version", Value = version },
                    new() { Key = "host", Value = Environment.MachineName }
                ])
                .CreateLogger();

            builder.Host.UseSerilog();
            builder.Services.AddOpenTelemetry()
                .WithMetrics(metrics => metrics
                    .SetResourceBuilder(resourceBuilder)
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()

                    .AddMeter("Microsoft.AspNetCore.Hosting")
                    .AddMeter("Microsoft.AspNetCore.Server.Kestrel")

                    .AddPrometheusExporter()
                );

            return builder;
        }
        public static WebApplication UseTelemetryAndLogs(this WebApplication app)
        {
            app.UseOpenTelemetryPrometheusScrapingEndpoint();
            app.UseSerilogRequestLogging();
            return app;
        }


        private static JsonTypeInfo[]? _Controllers = null;
        public static WebApplicationBuilder AddApiControllers(this WebApplicationBuilder builder, params JsonTypeInfo[] controllers)
        {
            _Controllers = controllers;
            foreach (var controller in controllers)
                builder.Services.AddSingleton(controller.Type);

            return builder;
        }
        public static WebApplication UseApiControllers(this WebApplication app)
        {
            app.Logger.LogDebug("Mapping API controllers");

            foreach (var controller in _Controllers ?? [])
                (app.Services.GetRequiredService(controller.Type) as IApiController)?.MapRoutes(app);

            app.Logger.LogDebug("Mapped API controllers");

            return app;
        }
    }
}

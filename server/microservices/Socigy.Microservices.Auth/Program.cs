using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Server.Kestrel.Https;
using Microsoft.AspNetCore.SignalR;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using Serilog;
using Serilog.Sinks.Grafana.Loki;
using Socigy.Connectors.Auth;
using Socigy.Connectors.Auth.Internal;
using Socigy.Microservices.Auth.Controllers;
using Socigy.Microservices.Auth.Controllers.Internal;
using Socigy.Microservices.Auth.Controllers.Tokens;
using Socigy.Microservices.Auth.Middlewares;
using Socigy.Microservices.Auth.Requests;
using Socigy.Microservices.Auth.Services;
using Socigy.Middlewares;
using Socigy.Services;
using Socigy.Services.Internal;
using System.Text.Json.Serialization;
using InternalOnlyMiddleware = Socigy.Microservices.Auth.Middlewares.InternalOnlyMiddleware;
using AuthMiddleware = Socigy.Microservices.Auth.Middlewares.AuthMiddleware;
using Socigy.Connectors.User.Info;
using Socigy.Services.Emailing;
using Socigy.Services.Database;
using Socigy.Microservices.Auth.Responses;

var builder = WebApplication.CreateSlimBuilder(args);
builder.AddEnvironmentVariables();
builder.AddTelemetryAndLogs("Auth Microservice", "auth", "default", "1.0.0");

// Internal Middleware
builder.Services.AddSingleton<InternalHelper>();
builder.Services.AddSingleton<InternalOnlyMiddleware>();
builder.Services.AddSingleton<UserAgentRecognizer>();

builder.Services.AddDataProtection();

// Auth Middleware
builder.Services.AddSingleton<ITokenService, TokenService>();
builder.Services.AddSingleton<AuthMiddleware>();

builder.AddJsonContexts(StructuresJsonContext.Default, RequestJsonContext.Default, ResponseJsonContext.Default);

builder.Services.AddSingleton<IEmailService, ZohoSMTPMailService>();
builder.Services.AddSingleton<IMFAService, MFAService>();
builder.Services.AddSingleton<IFido2Service, Fido2Service>();
builder.AddBaseServices();

builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(5000, listenOptions =>
    {
        listenOptions.Protocols = Microsoft.AspNetCore.Server.Kestrel.Core.HttpProtocols.Http1;
    });

    options.ListenAnyIP(5001, listenOptions =>
    {
        listenOptions.Protocols = Microsoft.AspNetCore.Server.Kestrel.Core.HttpProtocols.Http2;
    });

    options.Limits.Http2.MaxStreamsPerConnection = 100;
    options.Limits.Http2.KeepAlivePingDelay = TimeSpan.FromSeconds(30);
    options.Limits.Http2.KeepAlivePingTimeout = TimeSpan.FromSeconds(10);
    options.Limits.Http2.InitialConnectionWindowSize = 65535;
    options.Limits.Http2.InitialStreamWindowSize = 98304;
});

builder.Services.AddGrpc();
builder.Services.AddGrpcClient<UserInfoGrpcService.UserInfoGrpcServiceClient>(options =>
{
    options.Address = new Uri("http://localhost:8001");
    options.CallOptionsActions.Add(InternalHelper.AddGrpcInternalHeaders);
});

builder.AddApiControllers(
    ControllerContext.Default.TokenApiController,
    ControllerContext.Default.AuthApiController,
    ControllerContext.Default.DeviceApiController,
    ControllerContext.Default.SecurityApiController
);

builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
});

var app = builder.Build();
app.UseCors("default");
app.UseAntiforgery();
app.UseTelemetryAndLogs();

app.Services.GetRequiredService<InternalHelper>();
app.UseMiddleware<InternalOnlyMiddleware>();
app.UseMiddleware<UserAgentRecognizer>();
app.UseMiddleware<AuthMiddleware>();

app.MapGrpcService<InternalgRPCTokenVerifier>();
app.UseApiControllers();

app.Run();
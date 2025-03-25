using Microsoft.AspNetCore.Server.Kestrel.Core;
using Socigy.Connectors.Auth;
using Socigy.Connectors.Auth.Tokens;
using Socigy.Microservices.Content.Controllers;
using Socigy.Microservices.Content.Requests;
using Socigy.Microservices.Content.Responses;
using Socigy.Microservices.Content.Services;
using Socigy.Microservices.Content.Structures;
using Socigy.Microservices.Content.Structures.Posts;
using Socigy.Middlewares;
using Socigy.Services;
using Socigy.Services.Internal;

const string AuthUrl = "http://localhost:8000";
const string UserUrl = "http://localhost:8001";

var builder = WebApplication.CreateSlimBuilder(args);
builder.AddEnvironmentVariables();
builder.AddTelemetryAndLogs("Content Microservice", "content", "default", "1.0.0");
builder.AddBaseServices();

builder.AddInternalAccessMiddleware(AuthUrl);
builder.AddAuthMiddleware(AuthUrl);
builder.AddUserInfoGrpcClient(UserUrl);

builder.AddJsonContexts(RequestJsonContext.Default, ResponseJsonContext.Default, StructuresJsonContext.Default);

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

    // Enable HTTP/2 KeepAlive settings
    options.Limits.Http2.MaxStreamsPerConnection = 100;
    options.Limits.Http2.KeepAlivePingDelay = TimeSpan.FromSeconds(30);
    options.Limits.Http2.KeepAlivePingTimeout = TimeSpan.FromSeconds(10);
    options.Limits.Http2.InitialConnectionWindowSize = 65535;
    options.Limits.Http2.InitialStreamWindowSize = 98304;
});

builder.Services.AddSingleton<IStorageService, CloudflareStorageService>();

builder.Services.AddGrpc();
builder.AddApiControllers(
    ControllerContext.Default.ContentProfileController,
    ControllerContext.Default.ContentUploadController,
    ControllerContext.Default.ContentInteractionController,
    ControllerContext.Default.ContentRecommendationController
);

builder.Services.Configure<KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = null;
});

var app = builder.Build();
app.UseCors("default");

app.UseTelemetryAndLogs();
app.UseInternalAccessMiddleware();
app.UseAuthMiddleware();
app.UseApiControllers();

app.Run();
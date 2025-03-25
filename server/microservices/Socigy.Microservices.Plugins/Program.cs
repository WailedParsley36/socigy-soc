using Socigy.Microservices.Content.Services;
using Socigy.Microservices.Plugins.Structures;
using Socigy.Middlewares;
using Socigy.Services;
using Socigy.Services.Internal;

const string AuthUrl = "http://localhost:8000";
const string UserUrl = "http://localhost:8001";

var builder = WebApplication.CreateSlimBuilder(args);
builder.AddEnvironmentVariables();
builder.AddTelemetryAndLogs("Plugin Microservice", "plugins", "default", "1.0.0");
builder.AddBaseServices();

builder.AddInternalAccessMiddleware(AuthUrl);
builder.AddAuthMiddleware(AuthUrl);
builder.AddUserInfoGrpcClient(UserUrl);

builder.Services.AddSingleton<IStorageService, CloudflareStorageService>();

builder.AddJsonContexts(RequestsJsonContext.Default, ResponsesJsonContext.Default, StructuresJsonContext.Default);

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

builder.Services.AddGrpc();
builder.Services.AddSignalR();

builder.AddApiControllers(ControllersJsonContext.Default.PluginStoreController, ControllersJsonContext.Default.PluginInstallationController);

var app = builder.Build();
app.UseCors("default");

app.UseTelemetryAndLogs();
app.UseInternalAccessMiddleware();
app.UseAuthMiddleware();
app.UseApiControllers();

app.Run();

// LOW - Install plugins on other devices - remote install
// LOW - Sync plugins accross multiple devices
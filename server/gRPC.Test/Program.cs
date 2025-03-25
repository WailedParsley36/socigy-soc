using Grpc.Core;
using Grpc.Net.Client;
using GrpcGreeter;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Socigy.Middlewares;
using Socigy.Structures.Json;
using System.Text.Json.Serialization;
using System.Text.Json.Serialization.Metadata;

var builder = WebApplication.CreateBuilder(args);
builder.AddJsonContexts(TestContext.Default);


builder.Services.AddGrpc(options =>
{
});
//builder.WebHost.UseKestrelHttpsConfiguration();
builder.Services.Configure<JsonHubProtocolOptions>(o =>
{
    o.PayloadSerializerOptions.TypeInfoResolverChain.Insert(0, BaseJsonContext.Default);
    o.PayloadSerializerOptions.TypeInfoResolverChain.Insert(1, TestContext.Default);

    o.PayloadSerializerOptions.TypeInfoResolver = TestContext.Default;
});
var app = builder.Build();

// "http://localhost:8080/v1/auth"
string baseUrl = "http://localhost:5000";

var channel = GrpcChannel.ForAddress("http://localhost:8080/v1/auth");
var a = new Socigy.Connectors.Auth.TestingService.TestingServiceClient(channel);

var client = new HubConnectionBuilder()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.TypeInfoResolver = TestContext.Default;
    })
    .WithUrl($"{baseUrl}/realtime/hub");
client.Services.AddSingleton<IJsonTypeInfoResolver>(app.Services.GetRequiredService<IJsonTypeInfoResolver>());
var built = client.Build();

await built.StartAsync();

built.Closed += async (ex) =>
{
    Console.WriteLine("Hey, disconected...");
};

built.Reconnected += async (ex) =>
{
    Console.WriteLine("Hey, reconnected...");
};

built.Reconnecting += async (ex) =>
{
    Console.WriteLine("Hey, reconnecting...");
};

built.On("ReceiveMessage", [typeof(string), typeof(string)], async (a) =>
{
    Console.WriteLine($"Received Message: {a.Length}");
});

var client2 = new HubConnectionBuilder()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.TypeInfoResolver = TestContext.Default;
    })
    .WithUrl($"{baseUrl}/realtime/hub");
client.Services.AddSingleton<IJsonTypeInfoResolver>(app.Services.GetRequiredService<IJsonTypeInfoResolver>());
var built2 = client2.Build();

await built2.StartAsync();

built2.Closed += async (ex) =>
{
    Console.WriteLine("Hey, disconected...");
};

built2.Reconnected += async (ex) =>
{
    Console.WriteLine("Hey, reconnected...");
};

built2.Reconnecting += async (ex) =>
{
    Console.WriteLine("Hey, reconnecting...");
};

built2.On("ReceiveMessage", [typeof(string), typeof(string)], async (a) =>
{
    Console.WriteLine($"Received Message: {a[0]} - {a[1]}");
});

app.MapGet("/hub", async () =>
{
    await built.SendAsync("SendMessage", "Wailed", "Hi, I am Patrik");
});
app.MapGet("/hub2", async () =>
{
    await built2.SendAsync("SendMessage", "Noone", "Hi, I am Noone");
});

app.MapGet("/", async () =>
{
    await a.PingAsync(new Socigy.Connectors.Auth.Empty());
});

app.Run();


[JsonSourceGenerationOptions(WriteIndented = true)]
[JsonSerializable(typeof(string))]
[JsonSerializable(typeof(string[]))]
[JsonSerializable(typeof(object))]
[JsonSerializable(typeof(object[]))]
partial class TestContext : JsonSerializerContext
{
}


public class ChatHub : Hub
{
    public async Task ReceiveMessage(string user, string message)
    {

    }
    public async Task SendMessage(string user, string message)
    {
        await Clients.All.SendAsync("ReceiveMessage", user, message);
    }
}
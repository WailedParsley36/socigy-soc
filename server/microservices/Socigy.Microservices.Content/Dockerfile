# Stage 1: Build and publish .NET service
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
# Install clang/zlib1g-dev dependencies for publishing to native
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    clang zlib1g-dev
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["microservices/Socigy.Microservices.Content/Socigy.Microservices.Content.csproj", "microservices/Socigy.Microservices.Content/"]
COPY ["shared/Socigy.gRPC/Socigy.gRPC.csproj", "shared/Socigy.gRPC/"]
COPY ["shared/Socigy.Middlewares/Socigy.Middlewares.csproj", "shared/Socigy.Middlewares/"]
COPY ["shared/Socigy.Structures/Socigy.Structures.csproj", "shared/Socigy.Structures/"]
COPY ["shared/Socigy.Services/Socigy.Services.csproj", "shared/Socigy.Services/"]
RUN dotnet restore "./microservices/Socigy.Microservices.Content/Socigy.Microservices.Content.csproj"
COPY . .
WORKDIR "/src/microservices/Socigy.Microservices.Content"
RUN dotnet build "./Socigy.Microservices.Content.csproj" -c $BUILD_CONFIGURATION -o /app/build

# Stage 2: Publish the service
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Socigy.Microservices.Content.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=true

# Stage 3: Final stage with ASP.NET Core runtime + Nginx
FROM mcr.microsoft.com/dotnet/runtime-deps:8.0 AS final
WORKDIR /app
EXPOSE 8080

RUN apt-get update && apt-get install -y curl gnupg2 ca-certificates lsb-release debian-archive-keyring
RUN curl -fsSL https://nginx.org/keys/nginx_signing.key | gpg --dearmor -o /usr/share/keyrings/nginx-archive-keyring.gpg
RUN echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] http://nginx.org/packages/mainline/debian `lsb_release -cs` nginx" | tee /etc/apt/sources.list.d/nginx.list
RUN apt update && apt install -y nginx ffmpeg && rm -rf /var/lib/apt/lists/*

RUN groupadd --system appgroup && useradd --system --gid appgroup --create-home appuser
RUN chown -R appuser:appgroup /app

COPY --from=publish /app/publish . 

COPY "microservices/Socigy.Microservices.Content/nginx.conf" /etc/nginx/nginx.conf 

CMD ["sh", "-c", "nginx && su appuser -c ./Socigy.Microservices.Content"]
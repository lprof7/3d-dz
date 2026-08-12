# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore with the sln/project first for caching
COPY backend/src/ThreeDDz.Api/ThreeDDz.Api.csproj backend/src/ThreeDDz.Api/
COPY backend/src/ThreeDDz.Application/ThreeDDz.Application.csproj backend/src/ThreeDDz.Application/
COPY backend/src/ThreeDDz.Domain/ThreeDDz.Domain.csproj backend/src/ThreeDDz.Domain/
COPY backend/src/ThreeDDz.Infrastructure/ThreeDDz.Infrastructure.csproj backend/src/ThreeDDz.Infrastructure/
RUN dotnet restore backend/src/ThreeDDz.Api/ThreeDDz.Api.csproj

# Copy source and publish
COPY backend/src ./backend/src
RUN dotnet publish backend/src/ThreeDDz.Api/ThreeDDz.Api.csproj -c Release -o /out --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /out ./
ENV ASPNETCORE_URLS=http://+:5199
EXPOSE 5199
ENTRYPOINT ["dotnet", "ThreeDDz.Api.dll"]
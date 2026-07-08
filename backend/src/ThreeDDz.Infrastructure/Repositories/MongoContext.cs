using MongoDB.Driver;
using ThreeDDz.Application.Interfaces;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Infrastructure.Repositories;

public class MongoContext
{
    public IMongoDatabase Database { get; }

    public MongoContext(string connectionString, string databaseName)
    {
        var settings = MongoClientSettings.FromConnectionString(connectionString);
        var client = new MongoClient(settings);
        Database = client.GetDatabase(databaseName);
    }

    public IMongoCollection<T> GetCollection<T>()
    {
        var name = typeof(T).Name;
        var plural = name switch
        {
            "Category" => "Categories",
            "Collection" => "Collections",
            _ => name + "s"
        };
        return Database.GetCollection<T>(plural);
    }
}

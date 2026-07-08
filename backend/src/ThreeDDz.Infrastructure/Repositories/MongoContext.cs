using MongoDB.Driver;
using ThreeDDz.Application.Interfaces;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Infrastructure.Repositories;

public class MongoContext
{
    public IMongoClient Client { get; }
    public IMongoDatabase Database { get; }

    public MongoContext(string connectionString, string databaseName)
    {
        var settings = MongoClientSettings.FromConnectionString(connectionString);
        Client = new MongoClient(settings);
        Database = Client.GetDatabase(databaseName);
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

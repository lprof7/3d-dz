using System.Linq.Expressions;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Application.Interfaces;

public interface IRepository<T> where T : class
{
    Task<List<T>> GetAllAsync();
    Task<T?> GetByIdAsync(string id);
    Task<List<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate);
    Task InsertAsync(T entity);
    Task UpdateAsync(string id, T entity);
    Task DeleteAsync(string id);
    Task<long> CountAsync(Expression<Func<T, bool>>? predicate = null);
}

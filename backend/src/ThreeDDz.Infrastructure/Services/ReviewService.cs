using ThreeDDz.Application.Interfaces;
using ThreeDDz.Domain.Enums;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Infrastructure.Services;

public class ReviewService : IReviewService
{
    private readonly IReviewRepository _reviewRepo;
    private readonly IOrderRepository _orderRepo;
    private readonly IProductRepository _productRepo;

    public ReviewService(IReviewRepository reviewRepo, IOrderRepository orderRepo, IProductRepository productRepo)
    {
        _reviewRepo = reviewRepo;
        _orderRepo = orderRepo;
        _productRepo = productRepo;
    }

    public async Task<Review> SubmitOrUpdateAsync(string customerId, string customerName,
        string productId, string? orderId, int rating, string comment)
    {
        if (!string.IsNullOrWhiteSpace(orderId))
        {
            var order = await _orderRepo.GetByIdAsync(orderId);
            if (order == null || (order.Status != OrderStatus.Completed && order.Status != OrderStatus.Confirmed))
                throw new InvalidOperationException("Cannot review: order must be confirmed or completed");
            if (order.CustomerId != customerId)
                throw new InvalidOperationException("This order does not belong to you");
            if (!order.Items.Any(i => i.ProductId == productId))
                throw new InvalidOperationException("Product not in this order");
        }

        var existing = await _reviewRepo.GetByCustomerAndProductAsync(customerId, productId);
        var review = existing.FirstOrDefault();

        if (review != null)
        {
            review.Rating = rating;
            review.Comment = comment;
            review.Status = ReviewStatus.PendingApproval;
            review.UpdatedAt = DateTime.UtcNow;
            await _reviewRepo.UpdateAsync(review.Id, review);
            return review;
        }

        review = new Review
        {
            ProductId = productId,
            CustomerId = customerId,
            CustomerName = customerName,
            Rating = rating,
            Comment = comment,
            Status = ReviewStatus.PendingApproval,
            OrderId = orderId ?? ""
        };
        await _reviewRepo.InsertAsync(review);
        return review;
    }

    public async Task<List<Review>> GetForProductAsync(string productId) =>
        await _reviewRepo.GetByProductApprovedAsync(productId);

    public async Task<Review> ChangeStatusAsync(string id, int status)
    {
        var review = await _reviewRepo.GetByIdAsync(id)
            ?? throw new InvalidOperationException("Review not found");
        review.Status = (ReviewStatus)status;
        await _reviewRepo.UpdateAsync(id, review);
        await _productRepo.UpdateAvgRatingAsync(review.ProductId);
        return review;
    }

    public async Task<List<Review>> GetPendingAsync()
    {
        var all = await _reviewRepo.GetAllAsync();
        return all.Where(r => r.Status == ReviewStatus.PendingApproval)
            .OrderByDescending(r => r.CreatedAt).ToList();
    }

    public Task<List<Review>> GetAllAsync() => _reviewRepo.GetAllAsync();

    public async Task<bool> CanReviewAsync(string customerId, string productId)
    {
        var existing = await _reviewRepo.GetByCustomerAndProductAsync(customerId, productId);
        if (existing.Any()) return true; // allow edit
        var orders = await _orderRepo.GetByCustomerAsync(customerId);
        return orders.Any(o => (o.Status == OrderStatus.Completed || o.Status == OrderStatus.Confirmed) && o.Items.Any(i => i.ProductId == productId));
    }
}

using Microsoft.Extensions.Logging;
using ThreeDDz.Application.Interfaces;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(ILogger<NotificationService> logger) { _logger = logger; }

    public Task OrderReceivedAsync(Order order)
    {
        _logger.LogInformation("[EMAIL-PLACEHOLDER] Order confirmation sent to {Email}: Reference {Ref}",
            order.CustomerEmail, order.Reference);
        return Task.CompletedTask;
    }

    public Task OrderStatusChangedAsync(Order order)
    {
        _logger.LogInformation("[EMAIL-PLACEHOLDER] Status update sent to {Email}: Order {Ref} is now {Status}",
            order.CustomerEmail, order.Reference, order.Status);
        return Task.CompletedTask;
    }

    public Task PasswordResetAsync(string email, string resetUrl)
    {
        _logger.LogInformation("[EMAIL-PLACEHOLDER] Password reset link sent to {Email}: {Url}", email, resetUrl);
        return Task.CompletedTask;
    }

    public Task AdminNewOrderAsync(Order order)
    {
        _logger.LogInformation("[ADMIN-NOTIF] New order received: {Ref} from {Customer}",
            order.Reference, order.CustomerFullName);
        return Task.CompletedTask;
    }
}

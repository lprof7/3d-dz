namespace ThreeDDz.Domain.Enums;

public enum UserRole
{
    Customer = 0,
    Admin = 1
}

public enum OrderStatus
{
    Pending = 0,
    Confirmed = 1,
    Rejected = 2,
    Completed = 3
}

public enum ReviewStatus
{
    PendingApproval = 0,
    Approved = 1,
    Rejected = 2
}

using FluentValidation;
using ThreeDDz.Api.Controllers;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Api.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MinimumLength(2).MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6).MaximumLength(100);
        RuleFor(x => x.Phone).MaximumLength(20);
    }
}

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class ForgotRequestValidator : AbstractValidator<ForgotRequest>
{
    public ForgotRequestValidator() => RuleFor(x => x.Email).NotEmpty().EmailAddress();
}

public class ResetRequestValidator : AbstractValidator<ResetRequest>
{
    public ResetRequestValidator()
    {
        RuleFor(x => x.Token).NotEmpty();
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(6).MaximumLength(100);
    }
}

public class ProfileUpdateRequestValidator : AbstractValidator<ProfileUpdateRequest>
{
    public ProfileUpdateRequestValidator()
    {
        RuleFor(x => x.FullName).MinimumLength(2).MaximumLength(100).When(x => x.FullName != null);
        RuleFor(x => x.Phone).MaximumLength(20).When(x => x.Phone != null);
        RuleFor(x => x.WilayaCode).InclusiveBetween(1, 58).When(x => x.WilayaCode.HasValue);
    }
}

public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty();
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(6).MaximumLength(100);
    }
}

public class PlaceOrderReqValidator : AbstractValidator<PlaceOrderReq>
{
    public PlaceOrderReqValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MinimumLength(2).MaximumLength(100);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.WilayaCode).InclusiveBetween(1, 58);
        RuleFor(x => x.WilayaName).NotEmpty().MaximumLength(100);
    }
}

public class CartOpReqValidator : AbstractValidator<CartOpReq>
{
    public CartOpReqValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.Qty).InclusiveBetween(1, 100).When(x => x.Qty.HasValue);
    }
}

public class StatusReqValidator : AbstractValidator<StatusReq>
{
    public StatusReqValidator() => RuleFor(x => x.Status).InclusiveBetween(0, 3);
}

public class NoteReqValidator : AbstractValidator<NoteReq>
{
    public NoteReqValidator() => RuleFor(x => x.Text).NotEmpty().MaximumLength(1000);
}

public class SubmitReviewReqValidator : AbstractValidator<SubmitReviewReq>
{
    public SubmitReviewReqValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.Rating).InclusiveBetween(1, 5);
        RuleFor(x => x.Comment).NotEmpty().MaximumLength(2000);
    }
}

public class AdminProductReqValidator : AbstractValidator<Product>
{
    public AdminProductReqValidator()
    {
        RuleFor(x => x.Name).NotNull();
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0);
        RuleFor(x => x.FileFormats).NotNull();
        RuleFor(x => x.License).MaximumLength(200);
        RuleFor(x => x.Images).NotNull();
    }
}

public class CategoryReqValidator : AbstractValidator<Category>
{
    public CategoryReqValidator()
    {
        RuleFor(x => x.Name).NotNull();
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(200);
    }
}

public class CollectionReqValidator : AbstractValidator<Collection>
{
    public CollectionReqValidator()
    {
        RuleFor(x => x.Name).NotNull();
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(200);
    }
}

public class BannerReqValidator : AbstractValidator<Banner>
{
    public BannerReqValidator()
    {
        RuleFor(x => x.Title).NotNull();
        RuleFor(x => x.ImageUrl).NotEmpty().MaximumLength(2000);
    }
}

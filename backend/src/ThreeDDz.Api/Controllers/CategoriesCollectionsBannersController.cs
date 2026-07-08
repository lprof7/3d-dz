using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThreeDDz.Application.Interfaces;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Api.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _svc;
    public CategoriesController(ICategoryService svc) { _svc = svc; }

    [HttpGet] public async Task<IActionResult> GetAll() => Ok(new { items = await _svc.GetAllAsync() });
    [HttpGet("{slug}")] public async Task<IActionResult> GetBySlug(string slug)
    {
        var cat = await _svc.GetBySlugAsync(slug);
        return cat == null ? NotFound() : Ok(cat);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost] public async Task<IActionResult> Create(Category c) => Ok(await _svc.CreateAsync(c));
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")] public async Task<IActionResult> Update(string id, Category c) => Ok(await _svc.UpdateAsync(id, c));
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")] public async Task<IActionResult> Delete(string id)
    {
        var ok = await _svc.DeleteAsync(id);
        if (!ok) return BadRequest(new { error = "Category has products. Reassign or delete them first." });
        return Ok(new { message = "Deleted" });
    }
}

[ApiController]
[Route("api/collections")]
public class CollectionsController : ControllerBase
{
    private readonly ICollectionService _svc;
    public CollectionsController(ICollectionService svc) { _svc = svc; }

    [HttpGet] public async Task<IActionResult> GetAll() => Ok(new { items = await _svc.GetAllAsync() });
    [HttpGet("{slug}")] public async Task<IActionResult> GetBySlug(string slug)
    {
        var col = await _svc.GetBySlugAsync(slug);
        return col == null ? NotFound() : Ok(col);
    }
    [HttpGet("{id}/products")] public async Task<IActionResult> GetProducts(string id) =>
        Ok(new { items = await _svc.GetProductsAsync(id) });

    [Authorize(Roles = "Admin")]
    [HttpPost] public async Task<IActionResult> Create(Collection c) => Ok(await _svc.CreateAsync(c));
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")] public async Task<IActionResult> Update(string id, Collection c) => Ok(await _svc.UpdateAsync(id, c));
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")] public async Task<IActionResult> Delete(string id) { await _svc.DeleteAsync(id); return Ok(new { }); }
}

[ApiController]
[Route("api/wilayas")]
public class WilayasController : ControllerBase
{
    private readonly IWilayaService _svc;
    public WilayasController(IWilayaService svc) { _svc = svc; }
    [HttpGet] public async Task<IActionResult> GetAll()
    {
        var wilayas = await _svc.GetAllAsync();
        var result = wilayas.Select(w => new { w.Id, w.Code, Name = w.Name.Fr ?? w.Name.En ?? w.Name.Ar ?? "" });
        return Ok(new { items = result });
    }
}

[ApiController]
[Route("api/banners")]
public class BannersController : ControllerBase
{
    private readonly IBannerService _svc;
    public BannersController(IBannerService svc) { _svc = svc; }
    [HttpGet("active")] public async Task<IActionResult> GetActive() => Ok(new { items = await _svc.GetActiveAsync() });

    [Authorize(Roles = "Admin")]
    [HttpGet] public async Task<IActionResult> GetAll() => Ok(new { items = await _svc.GetAllAsync() });
    [Authorize(Roles = "Admin")]
    [HttpPost] public async Task<IActionResult> Upsert(Banner b) => Ok(await _svc.UpsertAsync(b));
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")] public async Task<IActionResult> Delete(string id) { await _svc.DeleteAsync(id); return Ok(new { }); }
}

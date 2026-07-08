using ThreeDDz.Application.Interfaces;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Infrastructure.Services;

public class BannerService : IBannerService
{
    private readonly IBannerRepository _bannerRepo;

    public BannerService(IBannerRepository bannerRepo) { _bannerRepo = bannerRepo; }

    public Task<List<Banner>> GetActiveAsync() => _bannerRepo.GetActiveAsync();
    public Task<List<Banner>> GetAllAsync() => _bannerRepo.GetAllAsync();

    public async Task<Banner> UpsertAsync(Banner banner)
    {
        if (string.IsNullOrEmpty(banner.Id))
            await _bannerRepo.InsertAsync(banner);
        else
            await _bannerRepo.UpdateAsync(banner.Id, banner);
        return banner;
    }

    public async Task DeleteAsync(string id) => await _bannerRepo.DeleteAsync(id);
}

public class WilayaService : IWilayaService
{
    private readonly IWilayaRepository _wilayaRepo;

    public WilayaService(IWilayaRepository wilayaRepo) { _wilayaRepo = wilayaRepo; }

    public Task<List<Wilaya>> GetAllAsync() => _wilayaRepo.GetAllAsync();

    public async Task SeedAsync(List<Wilaya> wilayas)
    {
        var existing = await _wilayaRepo.GetAllAsync();
        if (existing.Count > 0) return;
        foreach (var w in wilayas)
            await _wilayaRepo.InsertAsync(w);
    }
}

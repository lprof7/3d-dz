import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { productRepo } from '../../../data/repos/productRepo';
import { categoryRepo } from '../../../data/repos/categoryRepo';
import { bannerRepo } from '../../../data/repos/orderRepo';
import ProductCard from '../../shared/ProductCard';
import type { Product, Category, Banner } from '../../../data/types';

export default function Home() {
  const { t } = useTranslation();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newest, setNewest] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productRepo.getFeatured(),
      productRepo.getNewest(),
      categoryRepo.getAll(),
      bannerRepo.getActive()
    ]).then(([f, n, c, b]) => {
      setFeatured(f);
      setNewest(n);
      setCategories(c);
      setBanners(b);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span></div>;

  const heroBg = banners[0]?.imageUrl;

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden"
        style={heroBg ? { backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        <div className="absolute inset-0" style={{
          background: heroBg ? 'linear-gradient(180deg, rgba(17,19,24,0.3) 0%, rgba(17,19,24,0.9) 100%)' : 'radial-gradient(ellipse at 30% 50%, #862200 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, #00363e 0%, transparent 60%)'
        }} />
        <div className="relative text-center px-4 max-w-3xl mx-auto">
          <h1 className="text-display-lg-mobile md:text-display-lg mb-4">{t('home.heroTitle')}</h1>
          <p className="text-body-lg text-on-surface-variant mb-8">{t('home.heroSubtitle')}</p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/catalog" className="bg-primary text-on-primary px-6 py-3 rounded-lg text-body-md font-semibold hover:opacity-90 transition-opacity">
              {t('home.exploreCatalog')}
            </Link>
            <button className="border border-primary text-primary px-6 py-3 rounded-lg text-body-md font-semibold hover:bg-primary/10 transition-colors">
              {t('home.uploadModel')}
            </button>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto px-4 md:px-10 py-16" style={{ maxWidth: '1440px' }}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-headline-md">{t('home.featuredModels')}</h2>
          <Link to="/catalog?featured=true" className="text-primary text-body-md font-semibold">{t('home.viewAll')}</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto px-4 md:px-10 py-16" style={{ maxWidth: '1440px' }}>
        <h2 className="text-headline-md mb-8">{t('home.shopByCategory')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map(c => (
            <Link key={c.id} to={`/catalog?category=${c.slug}`}
              className="flex flex-col items-center gap-3 p-6 rounded-lg transition-colors"
              style={{ backgroundColor: '#1e1f25' }}
            >
              {c.imageUrl && <img src={c.imageUrl} alt={c.name} className="w-12 h-12 object-cover rounded" />}
              <span className="text-body-md font-semibold text-center">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Newest */}
      <section className="mx-auto px-4 md:px-10 py-16" style={{ maxWidth: '1440px' }}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-headline-md">{t('home.newestModels')}</h2>
          <Link to="/catalog?sort=newest" className="text-primary text-body-md font-semibold">{t('home.viewAll')}</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {newest.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}



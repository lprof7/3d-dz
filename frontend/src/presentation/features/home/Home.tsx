import { lazy, Suspense, useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { productRepo } from '../../../data/repos/productRepo';
import { categoryRepo } from '../../../data/repos/categoryRepo';
import { bannerRepo } from '../../../data/repos/orderRepo';
import ProductCard from '../../shared/ProductCard';
import { localized } from '../../../core/i18n/localized';
import type { Product, Category, Banner } from '../../../data/types';

const HeroScene = lazy(() => import('./HeroScene'));

export default function Home() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newest, setNewest] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [paused, setPaused] = useState(false);

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

  useEffect(() => {
    if (banners.length < 2 || paused) return;
    const id = setInterval(() => setHeroIndex(i => (i + 1) % banners.length), 5000);
    return () => clearInterval(id);
  }, [banners.length, paused]);

  const featuredRef = useRef<HTMLDivElement>(null);
  const newestRef = useRef<HTMLDivElement>(null);
  const SCROLL_INTERVAL = 4000;

  useEffect(() => {
    if (!featuredRef.current || featured.length < 2) return;
    const el = featuredRef.current;
    const id = setInterval(() => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 10) { el.scrollTo({ left: 0, behavior: 'smooth' }); return; }
      const card = el.children[0] as HTMLElement;
      const step = card?.offsetWidth + 24 || 320;
      el.scrollBy({ left: step, behavior: 'smooth' });
    }, SCROLL_INTERVAL);
    return () => clearInterval(id);
  }, [featured.length]);

  useEffect(() => {
    if (!newestRef.current || newest.length < 2) return;
    const el = newestRef.current;
    const id = setInterval(() => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 10) { el.scrollTo({ left: 0, behavior: 'smooth' }); return; }
      const card = el.children[0] as HTMLElement;
      const step = card?.offsetWidth + 24 || 320;
      el.scrollBy({ left: step, behavior: 'smooth' });
    }, SCROLL_INTERVAL);
    return () => clearInterval(id);
  }, [newest.length]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span></div>;

  const currentBanner = banners[heroIndex];
  const bannerLink = (url?: string) => {
    if (url === '/explore' || url === '/explore/') return '/catalog';
    return url || '/catalog';
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="absolute inset-0">
          <Suspense fallback={<div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 50%, #862200 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, #00363e 0%, transparent 60%)' }} />}>
            <HeroScene />
          </Suspense>
        </div>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, rgba(17,19,24,0.35) 0%, rgba(17,19,24,0.85) 100%)'
        }} />
        {banners.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((_, i) => (
              <button key={i} onClick={() => setHeroIndex(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === heroIndex ? 'bg-primary w-6' : 'bg-white/40 hover:bg-white/70'}`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
        <div className="relative text-center px-4 max-w-3xl mx-auto">
          <h1 className="text-display-lg-mobile md:text-display-lg mb-4">{currentBanner?.title ? localized(currentBanner.title, lang) : t('home.heroTitle')}</h1>
          <p className="text-body-lg text-on-surface-variant mb-8">{currentBanner?.subtitle ? localized(currentBanner.subtitle, lang) : t('home.heroSubtitle')}</p>
          <div className="flex items-center justify-center gap-4">
            <Link to={bannerLink(currentBanner?.linkUrl)} className="bg-primary text-on-primary px-6 py-3 rounded-lg text-body-md font-semibold hover:opacity-90 transition-opacity">
              {currentBanner?.ctaText ? localized(currentBanner.ctaText, lang) : t('home.exploreCatalog')}
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
        <div ref={featuredRef} className="flex gap-6 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {featured.map(p => <div key={p.id} className="snap-start shrink-0 w-[280px] md:w-[300px]"><ProductCard product={p} /></div>)}
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
              {c.imageUrl && <img src={c.imageUrl} alt={localized(c.name, lang)} className="w-12 h-12 object-cover rounded" />}
              <span className="text-body-md font-semibold text-center">{localized(c.name, lang)}</span>
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
        <div ref={newestRef} className="flex gap-6 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {newest.map(p => <div key={p.id} className="snap-start shrink-0 w-[280px] md:w-[300px]"><ProductCard product={p} /></div>)}
        </div>
      </section>
    </div>
  );
}



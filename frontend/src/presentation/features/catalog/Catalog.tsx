import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { productRepo } from '../../../data/repos/productRepo';
import { categoryRepo } from '../../../data/repos/categoryRepo';
import ProductCard from '../../shared/ProductCard';
import type { Product, Category } from '../../../data/types';

export default function Catalog() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const categorySlug = searchParams.get('category');
  const sort = searchParams.get('sort');
  const featured = searchParams.get('featured');
  const search = searchParams.get('search');

  useEffect(() => {
    setLoading(true);
    let promise;
    if (categorySlug) {
      promise = productRepo.getByCategory(categorySlug);
    } else if (featured) {
      promise = productRepo.getFeatured();
    } else {
      promise = productRepo.getAll({ search: search || undefined });
    }
    promise.then(setProducts).finally(() => setLoading(false));
    categoryRepo.getAll().then(setCategories);
  }, [categorySlug, sort, featured, search]);

  let sorted = [...products];
  if (sort === 'newest') sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);

  return (
    <div className="mx-auto px-4 md:px-10 pt-24 pb-16" style={{ maxWidth: '1440px' }}>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-56 shrink-0">
          <h3 className="text-body-md font-semibold mb-4">{t('nav.categories')}</h3>
          <div className="flex flex-col gap-2">
            <Link to="/catalog" className={`text-body-md ${!categorySlug ? 'text-primary' : 'text-on-surface-variant'} hover:text-primary`}>
              {t('home.viewAll')}
            </Link>
            {categories.map(c => (
              <Link key={c.id} to={`/catalog?category=${c.slug}`}
                className={`text-body-md ${categorySlug === c.slug ? 'text-primary' : 'text-on-surface-variant'} hover:text-primary`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-headline-md">{t('nav.explore')}</h1>
            <select
              className="bg-surface-container text-on-surface border border-outline-variant rounded px-3 py-1.5 text-body-sm"
              value={sort || ''}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                if (e.target.value) params.set('sort', e.target.value);
                else params.delete('sort');
                window.location.search = params.toString();
              }}
            >
              <option value="">{t('nav.newest')}</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
            </div>
          ) : sorted.length === 0 ? (
            <p className="text-center py-20 text-on-surface-variant">{t('common.notFound')}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sorted.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



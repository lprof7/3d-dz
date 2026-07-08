import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { productRepo } from '../../../data/repos/productRepo';
import { categoryRepo, collectionRepo } from '../../../data/repos/categoryRepo';
import ProductCard from '../../shared/ProductCard';
import type { Product, Category, Collection } from '../../../data/types';

export default function Catalog() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [priceBounds, setPriceBounds] = useState<{ min: number; max: number }>({ min: 0, max: 100000 });

  const isCollection = location.pathname.startsWith('/collection');
  const categorySlug = searchParams.get('category') || (slug && !isCollection ? slug : '');
  const collectionSlug = isCollection && slug ? slug : '';
  const sort = searchParams.get('sort') || 'newest';
  const search = searchParams.get('search');
  const minPrice = searchParams.get('minPrice') || undefined;
  const maxPrice = searchParams.get('maxPrice') || undefined;
  // US-A4: rating filter
  const minRating = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined;
  const page = parseInt(searchParams.get('page') || '1', 10);

  const categoryId = categorySlug
    ? categories.find(c => c.slug === categorySlug)?.id || ''
    : '';

  useEffect(() => {
    categoryRepo.getAll().then(setCategories);
    collectionRepo.getAll().then(setCollections);
  }, []);

  useEffect(() => {
    setLoading(true);

    if (collectionSlug && collections.length > 0) {
      const col = collections.find(c => c.slug === collectionSlug);
      if (col) {
        productRepo.getByCollection(col.id).then((items: Product[]) => {
          setProducts(items);
          setTotalPages(1);
        }).finally(() => setLoading(false));
        return;
      }
    }

    const params: Record<string, any> = {
      sort,
      page,
      pageSize: 12,
      search: search || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      minRating: minRating ?? undefined
    };
    if (categoryId) params.categoryId = categoryId;
    productRepo.getAll(params)
      .then(res => {
        setProducts(res.items || []);
        setTotalPages(res.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [categoryId, collectionSlug, sort, search, minPrice, maxPrice, minRating, page, collections.length]);

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.set('page', '1');
    navigate(`/catalog?${params.toString()}`);
  };

  // US-A4: Price range slider (combined low/high)
  const setPriceRange = (lo: number, hi: number) => {
    const params = new URLSearchParams(searchParams);
    if (lo > 0) params.set('minPrice', String(lo));
    else params.delete('minPrice');
    if (hi < priceBounds.max) params.set('maxPrice', String(hi));
    else params.delete('maxPrice');
    params.set('page', '1');
    navigate(`/catalog?${params.toString()}`);
  };

  return (
    <div className="mx-auto px-4 md:px-10 pt-24 pb-16" style={{ maxWidth: '1440px' }}>
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-56 shrink-0 space-y-6">
          <div>
            <h3 className="text-body-md font-semibold mb-4">{t('nav.categories')}</h3>
            <div className="flex flex-col gap-2">
              <Link to="/catalog" className={`text-body-md ${!categorySlug ? 'text-primary' : 'text-on-surface-variant'} hover:text-primary`}>
                {t('home.viewAll')}
              </Link>
              {categories.map(c => (
                <Link
                  key={c.id}
                  to={`/catalog?category=${c.slug}`}
                  className={`text-body-md ${categorySlug === c.slug ? 'text-primary' : 'text-on-surface-variant'} hover:text-primary`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-body-sm font-semibold text-outline mb-2">{t('product.price')}</h4>
            <PriceRangeSlider
              min={priceBounds.min}
              max={priceBounds.max}
              initialLo={Number(minPrice || priceBounds.min)}
              initialHi={Number(maxPrice || priceBounds.max)}
              onChange={(lo, hi) => setPriceRange(lo, hi)}
            />
            <div className="flex gap-2 mt-2 text-body-sm">
              <input
                type="number"
                placeholder={t('common.min')}
                value={minPrice || ''}
                onChange={e => setParam('minPrice', e.target.value || null)}
                className="w-full bg-surface-variant text-on-surface rounded px-3 py-2 text-body-sm outline-none"
              />
              <input
                type="number"
                placeholder={t('common.max')}
                value={maxPrice || ''}
                onChange={e => setParam('maxPrice', e.target.value || null)}
                className="w-full bg-surface-variant text-on-surface rounded px-3 py-2 text-body-sm outline-none"
              />
            </div>
          </div>

          {/* US-A4: Rating filter (4+ stars) */}
          <div>
            <h4 className="text-body-sm font-semibold text-outline mb-2">{t('product.rating')}</h4>
            <div className="flex flex-col gap-1">
              {[{ v: undefined, label: t('common.all') }, { v: 4, label: '4★+' }, { v: 3, label: '3★+' }].map(opt => (
                <button
                  key={String(opt.v)}
                  type="button"
                  onClick={() => setParam('minRating', opt.v ? String(opt.v) : null)}
                  className={`text-body-sm text-left px-2 py-1 rounded ${String(minRating ?? '') === String(opt.v ?? '') ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h1 className="text-headline-md">{t('nav.explore')}</h1>
            <select
              className="bg-surface-container text-on-surface border border-outline-variant rounded px-3 py-1.5 text-body-sm"
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
            >
              <option value="newest">{t('nav.newest')}</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="rating-desc">Rating: High → Low</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-on-surface-variant mb-3">{t('common.notFound')}</p>
              <button onClick={() => navigate('/catalog')} className="text-primary underline text-body-sm">
                {t('common.all')}
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    disabled={page <= 1}
                    onClick={() => setParam('page', String(page - 1))}
                    className="px-3 py-1.5 rounded text-body-sm bg-surface-container disabled:opacity-30"
                  >
                    {t('common.prev')}
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setParam('page', String(p))}
                      className={`px-3 py-1.5 rounded text-body-sm ${p === page ? 'bg-primary text-on-primary' : 'bg-surface-container'}`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setParam('page', String(page + 1))}
                    className="px-3 py-1.5 rounded text-body-sm bg-surface-container disabled:opacity-30"
                  >
                    {t('common.next')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface PriceRangeSliderProps {
  min: number;
  max: number;
  initialLo: number;
  initialHi: number;
  onChange: (lo: number, hi: number) => void;
}

function PriceRangeSlider({ min, max, initialLo, initialHi, onChange }: PriceRangeSliderProps) {
  const [lo, setLo] = useState(initialLo);
  const [hi, setHi] = useState(initialHi);

  return (
    <div>
      <div className="relative h-6">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 rounded bg-surface-variant" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1 rounded bg-primary"
          style={{ left: `${((lo - min) / (max - min)) * 100}%`, right: `${100 - ((hi - min) / (max - min)) * 100}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={lo}
          onChange={e => {
            const v = Math.min(Number(e.target.value), hi - 1);
            setLo(v);
            onChange(v, hi);
          }}
          className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-auto"
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={hi}
          onChange={e => {
            const v = Math.max(Number(e.target.value), lo + 1);
            setHi(v);
            onChange(lo, v);
          }}
          className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-auto"
          aria-label="Maximum price"
        />
      </div>
      <div className="flex justify-between text-xs text-outline mt-1">
        <span>{lo.toLocaleString()}</span>
        <span>{hi.toLocaleString()}</span>
      </div>
    </div>
  );
}
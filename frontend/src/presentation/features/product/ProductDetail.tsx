import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { productRepo } from '../../../data/repos/productRepo';
import { reviewRepo, favoriteRepo } from '../../../data/repos/orderRepo';
import { useAuthStore } from '../../../core/auth/store';
import { useCartStore } from '../../../core/store/cart';
import type { Product, Review } from '../../../data/types';

interface ProductDetailResponse {
  product: Product;
  reviews: Review[];
  avgRating: number;
  reviewCount: number;
  isFavorite: boolean;
  related: Product[];
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const [data, setData] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const addItem = useCartStore(s => s.addItem);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    productRepo.getBySlug(slug).then((res: any) => {
      const d: ProductDetailResponse = {
        product: res.product,
        reviews: res.reviews || [],
        avgRating: res.avgRating || 0,
        reviewCount: res.reviewCount || 0,
        isFavorite: res.isFavorite || false,
        related: res.related || []
      };
      setData(d);
      setIsFav(d.isFavorite);
      setSelectedImage(0);
    }).finally(() => setLoading(false));
  }, [slug]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setSubmitting(true); setReviewError(''); setReviewSuccess(false);
    try {
      await reviewRepo.create({ productId: product.id, rating: reviewRating, comment: reviewComment });
      setReviewSuccess(true); setReviewComment('');
      const fresh = await reviewRepo.getByProduct(product.id);
      setData(prev => prev ? { ...prev, reviews: fresh } : prev);
    } catch (err: any) {
      setReviewError(err.response?.data?.error || t('common.error'));
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span></div>;
  if (!data) return <div className="text-center py-20 text-on-surface-variant">{t('common.notFound')}</div>;

  const { product, reviews, related } = data;
  const price = product.effectivePrice || product.price;

  return (
    <div className="mx-auto px-4 md:px-10 pt-24 pb-16" style={{ maxWidth: '1440px' }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div>
          <div className="aspect-square rounded-lg overflow-hidden mb-4" style={{ backgroundColor: '#1e1f25' }}>
            {product.images[selectedImage] ? (
              <img src={product.images[selectedImage]} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl text-outline-variant">3d_rotation</span>
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded border-2 overflow-hidden ${selectedImage === i ? 'border-primary' : 'border-transparent'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-headline-md mb-2">{product.name}</h1>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-price-display text-primary text-2xl">{price.toLocaleString()} {product.currency || 'DA'}</span>
            {product.discountPercent != null && product.discountPercent > 0 && (
              <span className="text-body-lg text-outline line-through">{product.price.toLocaleString()} DA</span>
            )}
          </div>

          <p className="text-body-md text-on-surface-variant mb-6">{product.description}</p>

          <div className="flex gap-3 mb-8">
            <button onClick={() => addItem(product.id)}
              className="flex-1 bg-primary text-on-primary px-6 py-3 rounded-lg text-body-md font-semibold hover:opacity-90 transition-opacity"
            >
              {t('product.addToCart')}
            </button>
            <button onClick={async () => { const fav = await favoriteRepo.toggle(product.id); setIsFav(fav); }}
              className={`px-4 py-3 rounded-lg border transition-colors ${isFav ? 'border-primary text-primary' : 'border-outline-variant text-on-surface-variant'}`}
            >
              <span className="material-symbols-outlined">{isFav ? 'favorite' : 'favorite_border'}</span>
            </button>
          </div>

          <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: '#1e1f25' }}>
            <h3 className="text-body-md font-semibold mb-3">{t('product.specifications')}</h3>
            <div className="grid grid-cols-2 gap-3 text-body-sm">
              {product.fileFormats.length > 0 && (
                <><span className="text-outline">{t('product.fileFormats')}</span><span>{product.fileFormats.join(', ')}</span></>
              )}
              {product.fileSizeMb && (
                <><span className="text-outline">{t('product.fileSize')}</span><span>{product.fileSizeMb} MB</span></>
              )}
              <><span className="text-outline">{t('product.license')}</span><span>{product.license}</span></>
            </div>
          </div>
        </div>
      </div>

      <section className="mb-12">
        <h2 className="text-headline-md mb-6">{t('product.reviews')}</h2>
        {reviews.length === 0 ? (
          <div className="text-center py-8 rounded-lg" style={{ backgroundColor: '#1e1f25' }}>
            <p className="text-on-surface-variant mb-2">{t('product.noReviews')}</p>
            <p className="text-outline text-body-sm">{t('product.beFirstReview')}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reviews.map(r => (
              <div key={r.id} className="rounded-lg p-4" style={{ backgroundColor: '#1e1f25' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{r.customerName}</span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`material-symbols-outlined text-sm ${i < r.rating ? 'text-primary' : 'text-outline-variant'}`}>star</span>
                    ))}
                  </div>
                </div>
                <p className="text-body-sm text-on-surface-variant">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {user && (
        <section className="mb-12">
          <h2 className="text-headline-md mb-6">{t('product.writeReview')}</h2>
          {reviewSuccess && <p className="text-green-400 text-body-sm mb-4">{t('product.reviewSubmitted')}</p>}
          {reviewError && <p className="text-red-400 text-body-sm mb-4">{reviewError}</p>}
          <form onSubmit={handleReviewSubmit} className="rounded-lg p-6" style={{ backgroundColor: '#1e1f25' }}>
            <div className="flex items-center gap-1 mb-4">
              <span className="text-outline mr-2">{t('product.rating')}:</span>
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} type="button" onClick={() => setReviewRating(s)}
                  className={`material-symbols-outlined ${s <= reviewRating ? 'text-primary' : 'text-outline-variant'}`}>star</button>
              ))}
            </div>
            <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
              placeholder={t('product.reviewPlaceholder')}
              className="w-full bg-surface-variant text-on-surface rounded-md p-3 text-body-sm outline-none focus:ring-1 focus:ring-primary min-h-[80px] resize-none mb-4"
            />
            <button type="submit" disabled={submitting || !reviewComment.trim()}
              className="bg-primary text-on-primary px-6 py-2 rounded-lg text-body-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? t('common.loading') : t('product.submitReview')}
            </button>
          </form>
        </section>
      )}

      {related.length > 0 && (
        <section>
          <h2 className="text-headline-md mb-6">{t('product.relatedProducts')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.slice(0, 4).map(p => (
              <Link key={p.id} to={`/product/${p.slug}`} className="group rounded-lg overflow-hidden" style={{ backgroundColor: '#1e1f25' }}>
                <div className="aspect-square overflow-hidden" style={{ backgroundColor: '#282a2f' }}>
                  {p.images[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-outline-variant">3d_rotation</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-body-md font-semibold truncate">{p.name}</h3>
                  <span className="text-price-display text-primary">{p.price.toLocaleString()} DA</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

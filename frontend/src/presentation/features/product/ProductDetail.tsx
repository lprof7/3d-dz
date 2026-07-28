import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { productRepo } from '../../../data/repos/productRepo';
import { reviewRepo, favoriteRepo } from '../../../data/repos/orderRepo';
import { useAuthStore } from '../../../core/auth/store';
import { useCartStore } from '../../../core/store/cart';
import { localized } from '../../../core/i18n/localized';
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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore(s => s.user);
  const addItem = useCartStore(s => s.addItem);
  const [data, setData] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [favBusy, setFavBusy] = useState(false);
  const [favError, setFavError] = useState('');
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [checkingReview, setCheckingReview] = useState(true);

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
      setQuantity(1);
      if (user) {
        reviewRepo.canReview(d.product.id).then(setCanReview).catch(() => {}).finally(() => setCheckingReview(false));
      } else { setCheckingReview(false); }
    }).catch(() => {}).finally(() => { setLoading(false); setCheckingReview(false); });
  }, [slug]);

  // US-A3 alt flow: unauthenticated user clicking favorite => prompt to login
  const handleFavorite = async () => {
    if (!user) {
      setLoginPrompt(true);
      return;
    }
    if (!data || favBusy) return;
    const prev = isFav;
    setIsFav(!prev); // optimistic UI
    setFavBusy(true);
    setFavError('');
    try {
      const fav = await favoriteRepo.toggle(data.product.id);
      setIsFav(fav);
    } catch (err: any) {
      setIsFav(prev); // rollback on failure
      setFavError(err.response?.data?.error || t('common.error'));
    } finally {
      setFavBusy(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate(`/auth?mode=login&next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    if (!data) return;
    setAdding(true);
    try {
      await addItem(data.product.id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch {
      setFavError(t('common.error'));
    } finally {
      setAdding(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !reviewComment.trim()) return;
    setSubmitting(true); setReviewError(''); setReviewSuccess(false);
    try {
      await reviewRepo.create({ productId: data.product.id, rating: reviewRating, comment: reviewComment });
      setReviewSuccess(true); setReviewComment('');
      const fresh = await reviewRepo.getByProduct(data.product.id);
      setData(prev => prev ? { ...prev, reviews: fresh } : prev);
    } catch (err: any) {
      setReviewError(err.response?.data?.error || t('common.error'));
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
      </div>
    );
  }
  if (!data) return <div className="text-center py-20 text-on-surface-variant">{t('common.notFound')}</div>;

  const { product, reviews, related } = data;
  const price = product.effectivePrice || product.price;

  return (
    <div className="mx-auto px-4 md:px-10 pt-24 pb-16" style={{ maxWidth: '1440px' }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div>
          <button
            type="button"
            onClick={() => product.images[selectedImage] && setZoomImage(product.images[selectedImage])}
            className="aspect-square rounded-lg overflow-hidden mb-4 w-full block cursor-zoom-in"
            style={{ backgroundColor: '#1e1f25' }}
            aria-label="Zoom image"
          >
            {product.images[selectedImage] ? (
              <img src={product.images[selectedImage]} alt={localized(product.name, i18n.language)} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl text-outline-variant">3d_rotation</span>
              </div>
            )}
          </button>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded border-2 overflow-hidden ${selectedImage === i ? 'border-primary' : 'border-transparent'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-headline-md mb-2">{localized(product.name, i18n.language)}</h1>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-price-display text-primary text-2xl">{price.toLocaleString()} {product.currency || 'DA'}</span>
            {product.discountPercent != null && product.discountPercent > 0 && (
              <span className="text-body-lg text-outline line-through">{product.price.toLocaleString()} DA</span>
            )}
          </div>

          <p className="text-body-md text-on-surface-variant mb-6">{localized(product.description, i18n.language)}</p>

          {loginPrompt && (
            <div className="rounded-lg p-3 mb-4 flex items-center justify-between gap-3" style={{ backgroundColor: '#3a2a1577' }}>
              <p className="text-body-sm">{t('auth.loginToFavorites')}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/auth?mode=login&next=${encodeURIComponent(location.pathname)}`)}
                  className="bg-primary text-on-primary px-3 py-1.5 rounded text-body-sm font-semibold"
                >
                  {t('auth.loginTitle')}
                </button>
                <button type="button" onClick={() => setLoginPrompt(false)} className="text-outline hover:text-on-surface px-2">
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            </div>
          )}

          {/* US-A3: Quantity selector before adding to cart */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-body-sm text-outline">{t('cart.quantity')}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-8 h-8 rounded flex items-center justify-center border border-outline-variant text-on-surface-variant hover:text-primary"
                aria-label="Decrease quantity"
              >−</button>
              <span className="w-8 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(q => Math.min(99, q + 1))}
                className="w-8 h-8 rounded flex items-center justify-center border border-outline-variant text-on-surface-variant hover:text-primary"
                aria-label="Increase quantity"
              >+</button>
            </div>
          </div>

          <div className="flex gap-3 mb-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding}
              className="flex-1 bg-primary text-on-primary px-6 py-3 rounded-lg text-body-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {adding ? t('common.loading') : added ? '✓' : t('product.addToCart')}
            </button>
            <button
              type="button"
              onClick={handleFavorite}
              disabled={favBusy}
              className={`px-4 py-3 rounded-lg border transition-colors ${isFav ? 'border-primary text-primary' : 'border-outline-variant text-on-surface-variant'} ${favBusy ? 'opacity-60' : ''}`}
              aria-label={isFav ? t('product.removeFromFavorites') : t('product.addToFavorites')}
            >
              <span className="material-symbols-outlined">{isFav ? 'favorite' : 'favorite_border'}</span>
            </button>
          </div>
          {favError && <p className="text-red-400 text-body-sm mb-4">{favError}</p>}

          <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: '#1e1f25' }}>
            <h3 className="text-body-md font-semibold mb-3">{t('product.specifications')}</h3>
            <div className="grid grid-cols-2 gap-3 text-body-sm">
              {product.fileFormats.length > 0 && (
                <>
                  <span className="text-outline">{t('product.fileFormats')}</span>
                  <span>{product.fileFormats.join(', ')}</span>
                </>
              )}
              {product.fileSizeMb && (
                <>
                  <span className="text-outline">{t('product.fileSize')}</span>
                  <span>{product.fileSizeMb} MB</span>
                </>
              )}
              <span className="text-outline">{t('product.license')}</span>
              <span>{product.license}</span>
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
                      <span
                        key={i}
                        className={`material-symbols-outlined text-sm ${i < r.rating ? 'text-primary' : 'text-outline-variant'}`}
                        style={i < r.rating ? { fontVariationSettings: "'FILL' 1" } : undefined}
                      >
                        star
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-body-sm text-on-surface-variant">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {user && canReview && !checkingReview && (
        <section className="mb-12">
          <h2 className="text-headline-md mb-6">{t('product.writeReview')}</h2>
          {reviewSuccess && <p className="text-green-400 text-body-sm mb-4">{t('product.reviewSubmitted')}</p>}
          {reviewError && <p className="text-red-400 text-body-sm mb-4">{reviewError}</p>}
          <form onSubmit={handleReviewSubmit} className="rounded-lg p-6" style={{ backgroundColor: '#1e1f25' }}>
            <div className="flex items-center gap-1 mb-4">
              <span className="text-outline mr-2">{t('product.rating')}:</span>
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setReviewRating(s)}
                  className={`material-symbols-outlined ${s <= reviewRating ? 'text-primary' : 'text-outline-variant'}`}
                  aria-label={`Rate ${s}`}
                >
                  {s <= reviewRating ? 'star' : 'star_border'}
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              placeholder={t('product.reviewPlaceholder')}
              className="w-full bg-surface-variant text-on-surface rounded-md p-3 text-body-sm outline-none focus:ring-1 focus:ring-primary min-h-[80px] resize-none mb-4"
            />
            <button
              type="submit"
              disabled={submitting || !reviewComment.trim()}
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
              <Link
                key={p.id}
                to={`/product/${p.slug}`}
                className="group rounded-lg overflow-hidden"
                style={{ backgroundColor: '#1e1f25' }}
              >
                <div className="aspect-square overflow-hidden" style={{ backgroundColor: '#282a2f' }}>
                  {p.images[0] ? (
                    <img src={p.images[0]} alt={localized(p.name, i18n.language)} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-outline-variant">3d_rotation</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-body-md font-semibold truncate">{localized(p.name, i18n.language)}</h3>
                  <span className="text-price-display text-primary">{p.price.toLocaleString()} DA</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Image zoom lightbox */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 cursor-zoom-out"
          onClick={() => setZoomImage(null)}
        >
          <button
            type="button"
            onClick={() => setZoomImage(null)}
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/80"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <img src={zoomImage} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { localized } from '../../core/i18n/localized';
import { useCartStore } from '../../core/store/cart';
import { useAuthStore } from '../../core/auth/store';
import { favoriteRepo } from '../../data/repos/orderRepo';
import type { Product } from '../../data/types';

export default function ProductCard({ product }: { product: Product }) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const name = localized(product.name, i18n.language);
  const addItem = useCartStore(s => s.addItem);
  const user = useAuthStore(s => s.user);
  const [imgFailed, setImgFailed] = useState(false);
  const [imgSrc, setImgSrc] = useState(product.images?.[0] || '');
  const [isFav, setIsFav] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  return (
    <div className="group rounded-lg overflow-hidden transition-all hover:-translate-y-1 relative"
      style={{ backgroundColor: '#1e1f25' }}
    >
      <Link to={`/product/${product.slug}`} className="block">
        <div className="aspect-square overflow-hidden" style={{ backgroundColor: '#282a2f' }}>
          {product.images?.[0] && !imgFailed ? (
            <img src={imgSrc} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              onError={() => setImgFailed(true)}
            />
          ) : imgFailed ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-4xl text-outline-variant">broken_image</span>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgFailed(false); setImgSrc(product.images?.[0] || ''); }}
                className="text-body-sm text-primary underline"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-outline-variant">3d_rotation</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-body-md font-semibold mb-1 truncate">{name}</h3>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-price-display text-primary">{(product.effectivePrice || product.price).toLocaleString()} DA</span>
            {product.discountPercent != null && product.discountPercent > 0 && (
              <span className="text-body-sm text-outline line-through">{product.price.toLocaleString()} DA</span>
            )}
          </div>
          {(product.avgRating != null && product.avgRating > 0) && (
            <div className="flex items-center gap-1">
              <span className="text-body-sm text-primary">{product.avgRating.toFixed(1)}</span>
              <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={`material-symbols-outlined text-sm ${i < Math.round(product.avgRating || 0) ? 'text-primary' : 'text-outline-variant'}`}
                    style={i < Math.round(product.avgRating || 0) ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    star
                  </span>
                ))}
              </div>
              <span className="text-body-sm text-outline">({product.reviewCount || 0})</span>
            </div>
          )}
        </div>
      </Link>
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!user) { navigate(`/auth?mode=login&next=${encodeURIComponent(location.pathname)}`); return; } addItem(product.id); }}
        className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-primary/90"
        title="Add to cart">
        <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
      </button>
      <button onClick={async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!user) { navigate(`/auth?mode=login&next=${encodeURIComponent(location.pathname)}`); return; }
        if (favBusy) return;
        setFavBusy(true);
        const prev = isFav;
        setIsFav(!prev);
        try { setIsFav(await favoriteRepo.toggle(product.id)); }
        catch { setIsFav(prev); }
        finally { setFavBusy(false); }
      }}
        className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-lg ${isFav ? 'text-error bg-white/90' : 'text-on-surface-variant bg-black/30 opacity-0 group-hover:opacity-100'} ${favBusy ? 'opacity-60' : ''}`}
        title="Favorite">
        <span className="material-symbols-outlined text-lg">{isFav ? 'favorite' : 'favorite_border'}</span>
      </button>
    </div>
  );
}
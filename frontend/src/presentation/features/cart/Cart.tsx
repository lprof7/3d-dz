import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../../../core/store/cart';

export default function Cart() {
  const { t } = useTranslation();
  const { items, total, loading, fetchCart, removeItem, updateQuantity, itemCount, clearCart } = useCartStore();

  useEffect(() => { fetchCart(); }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span></div>;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <span className="material-symbols-outlined text-6xl text-outline-variant">shopping_cart</span>
        <h1 className="text-headline-md">{t('cart.empty')}</h1>
        <Link to="/catalog" className="bg-primary text-on-primary px-6 py-3 rounded-lg">{t('cart.browseProducts')}</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 md:px-10 pt-24 pb-16" style={{ maxWidth: '1440px' }}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-headline-md">{t('cart.title')} ({itemCount()})</h1>
        <button onClick={clearCart} className="flex items-center gap-1 text-outline hover:text-error text-body-sm">
          <span className="material-symbols-outlined text-lg">delete_sweep</span>
          {t('cart.clear')}
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.productId} className="flex items-center gap-4 p-4 rounded-lg" style={{ backgroundColor: '#1e1f25' }}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.productName} className="w-20 h-20 object-cover rounded" />
              ) : (
                <div className="w-20 h-20 rounded flex items-center justify-center" style={{ backgroundColor: '#282a2f' }}>
                  <span className="material-symbols-outlined text-outline-variant">3d_rotation</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{item.productName || item.productId}</p>
                <span className="text-price-display text-primary">{item.price.toLocaleString()} DA</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="w-8 h-8 rounded flex items-center justify-center border border-outline-variant text-on-surface-variant hover:text-primary">−</button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="w-8 h-8 rounded flex items-center justify-center border border-outline-variant text-on-surface-variant hover:text-primary">+</button>
              </div>
              <button onClick={() => removeItem(item.productId)} className="text-outline hover:text-error">
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
        </div>
        <div className="rounded-lg p-6 h-fit" style={{ backgroundColor: '#1e1f25' }}>
          <h3 className="text-body-md font-semibold mb-4">{t('cart.total')}</h3>
          <div className="flex justify-between mb-2">
            <span className="text-outline">{t('cart.subtotal')}</span>
            <span className="font-semibold">{total.toLocaleString()} DA</span>
          </div>
          <hr className="border-outline-variant my-3" />
          <div className="flex justify-between mb-6">
            <span className="font-semibold">{t('cart.total')}</span>
            <span className="text-price-display text-primary">{total.toLocaleString()} DA</span>
          </div>
          <Link to="/checkout" className="block w-full bg-primary text-on-primary text-center py-3 rounded-lg font-semibold hover:opacity-90">
            {t('cart.checkout')}
          </Link>
        </div>
      </div>
    </div>
  );
}

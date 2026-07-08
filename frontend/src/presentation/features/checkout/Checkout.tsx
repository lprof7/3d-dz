import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { orderRepo, wilayaRepo } from '../../../data/repos/orderRepo';
import { useCartStore } from '../../../core/store/cart';
import { useAuthStore } from '../../../core/auth/store';
import type { Wilaya } from '../../../data/types';

export default function Checkout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, total, fetchCart, clearCart } = useCartStore();
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ reference: string } | null>(null);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', wilayaId: '', wilayaName: '' });

  useEffect(() => {
    fetchCart();
    wilayaRepo.getAll().then(setWilayas);
    if (user) {
      setForm(f => ({ ...f, fullName: user.fullName, email: user.email, phone: user.phone || '' }));
    }
  }, [user]);

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
        <span className="material-symbols-outlined text-6xl text-primary">check_circle</span>
        <h1 className="text-headline-md">{t('checkout.orderPlaced')}</h1>
        <p className="text-on-surface-variant">{t('checkout.orderReference')}: <strong>{done.reference}</strong></p>
        <p className="text-outline">{t('checkout.weWillContact')}</p>
        <button onClick={() => navigate('/')} className="bg-primary text-on-primary px-6 py-3 rounded-lg mt-4">{t('checkout.backToHome')}</button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      const wilaya = wilayas.find(w => w.id === form.wilayaId);
      const order = await orderRepo.create({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        wilayaCode: wilaya?.code || 0,
        wilayaName: wilaya?.name || form.wilayaName
      });
      clearCart();
      setDone({ reference: order.reference });
    } catch {
      alert(t('common.error'));
    } finally { setSubmitting(false); }
  };

  return (
    <div className="mx-auto px-4 md:px-10 pt-24 pb-16" style={{ maxWidth: '1440px' }}>
      <h1 className="text-headline-md mb-8">{t('checkout.title')}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-body-sm text-outline mb-1">{t('checkout.fullName')}</label>
            <input required value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              className="w-full bg-surface-container text-on-surface border border-outline-variant rounded px-4 py-3" />
          </div>
          <div>
            <label className="block text-body-sm text-outline mb-1">{t('checkout.email')}</label>
            <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-surface-container text-on-surface border border-outline-variant rounded px-4 py-3" />
          </div>
          <div>
            <label className="block text-body-sm text-outline mb-1">{t('checkout.phone')}</label>
            <input required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full bg-surface-container text-on-surface border border-outline-variant rounded px-4 py-3" />
          </div>
          <div>
            <label className="block text-body-sm text-outline mb-1">{t('checkout.wilaya')}</label>
            <select required value={form.wilayaId} onChange={e => {
              const w = wilayas.find(w => w.id === e.target.value);
              setForm(f => ({ ...f, wilayaId: e.target.value, wilayaName: w?.name || '' }));
            }}
              className="w-full bg-surface-container text-on-surface border border-outline-variant rounded px-4 py-3"
            >
              <option value="">{t('checkout.selectWilaya')}</option>
              {wilayas.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={submitting || items.length === 0}
            className="w-full bg-primary text-on-primary py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? t('common.loading') : t('checkout.placeOrder')}
          </button>
        </form>

        <div className="rounded-lg p-6 h-fit" style={{ backgroundColor: '#1e1f25' }}>
          <h3 className="text-body-md font-semibold mb-4">{t('checkout.orderSummary')}</h3>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.productId} className="flex justify-between text-body-sm">
                <span>{item.productName || item.productId} × {item.quantity}</span>
                <span>{(item.price * item.quantity).toLocaleString()} DA</span>
              </div>
            ))}
          </div>
          <hr className="border-outline-variant my-3" />
          <div className="flex justify-between">
            <span className="font-semibold">{t('cart.total')}</span>
            <span className="text-price-display text-primary">{total.toLocaleString()} DA</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../core/auth/store';
import { orderRepo, favoriteRepo } from '../../../data/repos/orderRepo';
import api from '../../../core/api/client';
import type { Order, Product } from '../../../data/types';

const statusColors = ['bg-yellow-600/20 text-yellow-300', 'bg-green-600/20 text-green-300', 'bg-red-600/20 text-red-300', 'bg-blue-600/20 text-blue-300'];

export default function Account() {
  const { t, i18n } = useTranslation();
  const { user, loadUser } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [tab, setTab] = useState<'orders' | 'favorites' | 'profile'>('orders');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    orderRepo.getMyOrders().then(setOrders).catch(() => {});
    favoriteRepo.getAll().then(setFavorites).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) setForm({ fullName: user.fullName, phone: user.phone || '' });
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', form);
      setSaved(true);
      setEditing(false);
      loadUser();
      setTimeout(() => setSaved(false), 2000);
    } catch { alert(t('common.error')); }
    finally { setSaving(false); }
  };

  return (
    <div className="mx-auto px-4 md:px-10 pt-24 pb-16" style={{ maxWidth: '1440px' }}>
      <h1 className="text-headline-md mb-8">{t('nav.myAccount')}</h1>

      <div className="flex gap-4 mb-8 border-b border-outline-variant/30">
        {(['orders', 'favorites', 'profile'] as const).map(tabKey => (
          <button key={tabKey} onClick={() => setTab(tabKey)}
            className={`pb-2 text-body-md font-semibold border-b-2 transition-colors ${tab === tabKey ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'}`}
          >
            {t(`account.my${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}`)}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        orders.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant">{t('account.noOrders')}</div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="rounded-lg p-4" style={{ backgroundColor: '#1e1f25' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body-sm text-outline">{t('order.reference')}: {order.reference}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusColors[order.status]}`}>
                    {t(`order.status_${order.status}`)}
                  </span>
                </div>
                <div className="text-body-sm text-on-surface-variant mb-2">
                  {order.items?.map(item => `${item.productName} × ${item.quantity}`).join(', ')}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-outline">{new Date(order.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language)}</span>
                  <span className="text-price-display text-primary">{order.total?.toLocaleString()} DA</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'favorites' && (
        favorites.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant">
            <p className="mb-4">{t('account.noFavorites')}</p>
            <Link to="/catalog" className="text-primary underline">{t('nav.explore')}</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {favorites.map(p => (
              <Link key={p.id} to={`/product/${p.slug}`} className="group rounded-lg overflow-hidden" style={{ backgroundColor: '#1e1f25' }}>
                <div className="aspect-square overflow-hidden" style={{ backgroundColor: '#282a2f' }}>
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-outline-variant">3d_rotation</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-body-md font-semibold truncate">{p.name}</h3>
                  <span className="text-price-display text-primary">{(p.effectivePrice || p.price).toLocaleString()} DA</span>
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      {tab === 'profile' && user && (
        <div className="max-w-md rounded-lg p-6" style={{ backgroundColor: '#1e1f25' }}>
          {!editing ? (
            <div className="space-y-3">
              <div><span className="text-outline text-body-sm">{t('auth.fullName')}:</span><p className="font-semibold">{user.fullName}</p></div>
              <div><span className="text-outline text-body-sm">{t('auth.email')}:</span><p className="font-semibold">{user.email}</p></div>
              {user.phone && <div><span className="text-outline text-body-sm">{t('auth.phone')}:</span><p className="font-semibold">{user.phone}</p></div>}
              <button onClick={() => setEditing(true)} className="bg-primary text-on-primary px-6 py-2 rounded-lg text-body-sm font-semibold mt-4">
                {t('account.editProfile')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-outline text-body-sm mb-1">{t('auth.fullName')}</label>
                <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-outline text-body-sm mb-1">{t('auth.phone')}</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              </div>
              {saved && <p className="text-green-400 text-body-sm">{t('account.saved')}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={saveProfile} disabled={saving} className="bg-primary text-on-primary px-6 py-2 rounded-lg text-body-sm font-semibold disabled:opacity-50">
                  {saving ? t('common.loading') : t('account.save')}
                </button>
                <button onClick={() => setEditing(false)} className="px-6 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-body-sm">
                  {t('admin.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

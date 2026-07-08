import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { localized } from '../../../core/i18n/localized';
import { useAuthStore } from '../../../core/auth/store';
import { orderRepo, favoriteRepo, wilayaRepo } from '../../../data/repos/orderRepo';
import api from '../../../core/api/client';
import type { Order, Product, Wilaya } from '../../../data/types';

const statusColors = ['bg-yellow-600/20 text-yellow-300', 'bg-green-600/20 text-green-300', 'bg-red-600/20 text-red-300', 'bg-blue-600/20 text-blue-300'];

export default function Account() {
  const { t, i18n } = useTranslation();
  const { user, loadUser } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [tab, setTab] = useState<'orders' | 'favorites' | 'profile'>('orders');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', wilayaCode: 0 });
  const [wilayas, setWilayas] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderPage, setOrderPage] = useState(1);
  const pageSize = 5;

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  useEffect(() => {
    orderRepo.getMyOrders().then(setOrders).catch(() => {});
    favoriteRepo.getAll().then(setFavorites).catch(() => {});
    wilayaRepo.getAll().then(setWilayas).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) setForm({ fullName: user.fullName, phone: user.phone || '', wilayaCode: (user as any).wilayaCode || 0 });
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
          <>
            <div className="space-y-4">
              {orders.slice(0, orderPage * pageSize).map(order => (
                <div key={order.id} className="rounded-lg p-4 cursor-pointer" style={{ backgroundColor: '#1e1f25' }}
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
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
                  {expandedOrder === order.id && (
                    <div className="mt-4 pt-4 border-t border-outline-variant/30 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-body-sm">
                        <span className="text-outline">{t('checkout.phone')}:</span><span>{order.customerPhone}</span>
                        <span className="text-outline">{t('checkout.email')}:</span><span>{order.customerEmail}</span>
                        <span className="text-outline">{t('checkout.wilaya')}:</span><span>{order.wilayaName}</span>
                      </div>
                      <div className="rounded-lg p-3" style={{ backgroundColor: '#282a2f' }}>
                        <h4 className="text-body-sm font-semibold mb-2">{t('order.items')}</h4>
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex justify-between text-body-sm py-1">
                            <span>{item.productName} × {item.quantity}</span>
                            <span className="text-primary">{(item.unitPrice * item.quantity).toLocaleString()} DA</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-body-sm font-semibold pt-2 mt-2 border-t border-outline-variant/30">
                          <span>{t('cart.total')}</span>
                          <span className="text-price-display text-primary">{order.total?.toLocaleString()} DA</span>
                        </div>
                      </div>
                      {order.statusHistory && order.statusHistory.length > 0 && (
                        <div>
                          <h4 className="text-body-sm font-semibold mb-1">{t('order.history')}</h4>
                          {order.statusHistory.map((entry, i) => (
                            <p key={i} className="text-body-sm text-outline">{t(`order.status_${entry.status}`)} — {new Date(entry.createdAt).toLocaleDateString()}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {orderPage * pageSize < orders.length && (
              <button onClick={() => setOrderPage(p => p + 1)}
                className="w-full text-center text-primary text-body-sm font-semibold py-3 hover:opacity-80">
                {t('common.showMore')} ({orders.length - orderPage * pageSize}) {t('common.more')}
              </button>
            )}
          </>
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
                    <img src={p.images[0]} alt={localized(p.name, i18n.language)} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-outline-variant">3d_rotation</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                    <h3 className="text-body-md font-semibold truncate">{localized(p.name, i18n.language)}</h3>
                  <span className="text-price-display text-primary">{(p.effectivePrice || p.price).toLocaleString()} DA</span>
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      {tab === 'profile' && user && (
        <div className="max-w-md space-y-6">
          <div className="rounded-lg p-6" style={{ backgroundColor: '#1e1f25' }}>
            {!editing ? (
              <div className="space-y-3">
                <div><span className="text-outline text-body-sm">{t('auth.fullName')}:</span><p className="font-semibold">{user.fullName}</p></div>
                <div><span className="text-outline text-body-sm">{t('auth.email')}:</span><p className="font-semibold">{user.email}</p></div>
                {user.phone && <div><span className="text-outline text-body-sm">{t('auth.phone')}:</span><p className="font-semibold">{user.phone}</p></div>}
                {(user as any).wilayaCode ? <div><span className="text-outline text-body-sm">{t('checkout.wilaya')}:</span><p className="font-semibold">{(user as any).wilayaCode}</p></div> : null}
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
                <div>
                  <label className="block text-outline text-body-sm mb-1">{t('checkout.wilaya')}</label>
                  <select value={form.wilayaCode} onChange={e => setForm(f => ({ ...f, wilayaCode: Number(e.target.value) }))}
                    className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none">
                    <option value={0}>--</option>
                    {wilayas.map((w: Wilaya) => <option key={w.code} value={w.code}>{w.name}</option>)}
                  </select>
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

          <div className="rounded-lg p-6" style={{ backgroundColor: '#1e1f25' }}>
            <h3 className="text-body-md font-semibold mb-4">{t('auth.changePassword')}</h3>
            {pwSaved && <p className="text-green-400 text-body-sm mb-3">{t('account.saved')}</p>}
            {pwError && <p className="text-red-400 text-body-sm mb-3">{pwError}</p>}
            <div className="space-y-3">
              <input type="password" placeholder={t('auth.currentPassword')} value={pwForm.currentPassword}
                onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              <input type="password" placeholder={t('auth.newPassword')} value={pwForm.newPassword}
                onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              <input type="password" placeholder={t('auth.confirmPassword')} value={pwForm.confirmPassword}
                onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              <button onClick={async () => {
                if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError(t('auth.passwordMismatch')); return; }
                setPwSaving(true); setPwError(''); setPwSaved(false);
                try {
                  await api.put('/auth/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
                  setPwSaved(true); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setTimeout(() => setPwSaved(false), 2000);
                } catch (err: any) { setPwError(err.response?.data?.error || t('common.error')); }
                finally { setPwSaving(false); }
              }} disabled={pwSaving}
                className="bg-primary text-on-primary px-6 py-2 rounded-lg text-body-sm font-semibold disabled:opacity-50">
                {pwSaving ? t('common.loading') : t('account.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

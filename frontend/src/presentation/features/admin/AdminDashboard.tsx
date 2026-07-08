import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { adminRepo, reviewAdmin } from '../../../data/repos/adminRepo';
import { productRepo } from '../../../data/repos/productRepo';
import { categoryRepo, collectionRepo } from '../../../data/repos/categoryRepo';
import type { Product, Order, Review, Customer, Category, Collection, Banner } from '../../../data/types';

const statusColors = ['bg-yellow-600/20 text-yellow-300', 'bg-green-600/20 text-green-300', 'bg-red-600/20 text-red-300', 'bg-blue-600/20 text-blue-300'];
const statusLabels = ['order.status_0', 'order.status_1', 'order.status_2', 'order.status_3'];

type Tab = 'analytics' | 'products' | 'orders' | 'customers' | 'categories' | 'collections' | 'banners' | 'reviews';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('analytics');
  const [loading, setLoading] = useState(true);

  return (
    <div className="mx-auto px-4 md:px-10 pt-24 pb-16" style={{ maxWidth: '1440px' }}>
      <div className="flex items-center gap-3 mb-8">
        <span className="material-symbols-outlined text-primary text-2xl">admin_panel_settings</span>
        <h1 className="text-headline-md">{t('admin.dashboard')}</h1>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { key: 'analytics', icon: 'insights', label: t('admin.analytics') },
          { key: 'products', icon: 'inventory_2', label: t('admin.products') },
          { key: 'orders', icon: 'receipt_long', label: t('admin.orders') },
          { key: 'customers', icon: 'people', label: t('admin.customers') },
          { key: 'categories', icon: 'category', label: t('admin.categories') },
          { key: 'collections', icon: 'collections_bookmark', label: t('admin.collections') },
          { key: 'banners', icon: 'view_carousel', label: t('admin.banners') },
          { key: 'reviews', icon: 'star', label: t('admin.reviews') },
        ] as { key: Tab; icon: string; label: string }[]).map(tabItem => (
          <button key={tabItem.key} onClick={() => setTab(tabItem.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-body-sm font-semibold transition-colors ${tab === tabItem.key ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-lg">{tabItem.icon}</span>
            {tabItem.label}
          </button>
        ))}
      </div>

      {tab === 'analytics' && <AnalyticsTab />}
      {tab === 'products' && <ProductsTab />}
      {tab === 'orders' && <OrdersTab />}
      {tab === 'customers' && <CustomersTab />}
      {tab === 'categories' && <CategoriesTab />}
      {tab === 'collections' && <CollectionsTab />}
      {tab === 'banners' && <BannersTab />}
      {tab === 'reviews' && <ReviewsTab />}
    </div>
  );
}

function AnalyticsTab() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminRepo.getAnalytics().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return <p className="text-center py-16 text-on-surface-variant">{t('admin.noData')}</p>;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label={t('admin.totalOrders')} value={stats.totalOrders} />
        <StatCard label={t('admin.pendingOrders')} value={stats.pendingOrders} />
        <StatCard label={t('admin.completedOrders')} value={stats.completedOrders} />
        <StatCard label={t('admin.products')} value={stats.totalProducts || 0} />
        <StatCard label={t('admin.newCustomers')} value={stats.newCustomersLast30Days} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg p-6" style={{ backgroundColor: '#1e1f25' }}>
          <h3 className="text-body-md font-semibold mb-4">{t('admin.topProducts')}</h3>
          {stats.topProducts && stats.topProducts.length > 0 ? (
            <div className="space-y-3">
              {stats.topProducts.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-body-sm">
                  <span className="truncate flex-1">{p.name || `Product ${p.productId}`}</span>
                  <span className="text-primary ml-4">{p.orderCount} {t('order.orders')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-on-surface-variant text-body-sm">{t('admin.noData')}</p>
          )}
        </div>

        <div className="rounded-lg p-6" style={{ backgroundColor: '#1e1f25' }}>
          <h3 className="text-body-md font-semibold mb-4">{t('admin.ordersByWilaya')}</h3>
          {(() => {
            const entries = stats.ordersByWilaya ? Object.entries(stats.ordersByWilaya) : [];
            if (entries.length === 0) return <p className="text-on-surface-variant text-body-sm">{t('admin.noData')}</p>;
            const maxCount = Math.max(...entries.map(([, count]) => count as number));
            return (
              <div className="space-y-2">
                {entries.slice(0, 10).map(([wilaya, count]: [string, any], i: number) => (
                  <div key={i} className="flex items-center gap-3 text-body-sm">
                    <span className="w-6 text-right text-outline">{i + 1}</span>
                    <div className="flex-1 h-5 rounded" style={{ backgroundColor: '#282a2f' }}>
                      <div className="h-5 rounded bg-primary/60" style={{ width: `${(count / maxCount) * 100}%` }} />
                    </div>
                    <span className="w-24 truncate text-right">{wilaya}</span>
                    <span className="text-primary w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function ProductsTab() {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([adminRepo.getProducts(), categoryRepo.getAll()])
      .then(([p, c]) => { setProducts(p); setCategories(c); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: 0, categoryId: '', images: [], fileFormats: [], license: 'Personal Use', isPublished: true, isFeatured: false, currency: 'DA' });
    setShowForm(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ ...p });
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) await productRepo.update(editing.id, form as any);
      else await productRepo.create(form as any);
      setShowForm(false);
      load();
    } catch (e) { alert(t('common.error')); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-body-sm text-outline">{products.length} {t('admin.products')}</p>
        <button onClick={openNew} className="flex items-center gap-1 bg-primary text-on-primary px-4 py-2 rounded-lg text-body-sm font-semibold">
          <span className="material-symbols-outlined text-lg">add</span> {t('admin.addProduct')}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1e1f25' }}>
            <h2 className="text-headline-md mb-4">{editing ? t('admin.editProduct') : t('admin.addProduct')}</h2>
            <div className="space-y-3">
              <input placeholder={t('auth.fullName')} value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              <textarea placeholder={t('product.description')} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary min-h-[80px]" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder={t('product.price')} value={form.price || 0} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                  className="bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
                <input type="number" placeholder="Discount %" value={form.discountPercent || 0} onChange={e => setForm(f => ({ ...f, discountPercent: Number(e.target.value) }))}
                  className="bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <select value={form.categoryId || ''} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none">
                <option value="">{t('nav.categories')}</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-body-sm">
                  <input type="checkbox" checked={form.isFeatured || false} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} />
                  {t('admin.featured')}
                </label>
                <label className="flex items-center gap-2 text-body-sm">
                  <input type="checkbox" checked={form.isPublished ?? true} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} />
                  Published
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={saving || !form.name}
                  className="flex-1 bg-primary text-on-primary py-3 rounded-lg font-semibold disabled:opacity-50">
                  {saving ? t('common.loading') : t('admin.save')}
                </button>
                <button onClick={() => setShowForm(false)} className="px-6 py-3 rounded-lg border border-outline-variant text-on-surface-variant">
                  {t('admin.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {products.map(p => (
          <div key={p.id} className="rounded-lg p-4 flex items-center gap-4" style={{ backgroundColor: '#1e1f25' }}>
            {p.images?.[0] ? (
              <img src={p.images[0]} alt="" className="w-12 h-12 object-cover rounded" />
            ) : (
              <div className="w-12 h-12 rounded flex items-center justify-center" style={{ backgroundColor: '#282a2f' }}>
                <span className="material-symbols-outlined text-outline-variant">3d_rotation</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{p.name}</p>
              <p className="text-body-sm text-outline">{p.price?.toLocaleString()} DA</p>
            </div>
            {p.isFeatured && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{t('admin.featured')}</span>}
            <div className="flex gap-2">
              <button onClick={() => openEdit(p)} className="text-outline hover:text-primary">
                <span className="material-symbols-outlined text-lg">edit</span>
              </button>
              <button onClick={async () => { await productRepo.toggleFeatured(p.id); load(); }} className="text-outline hover:text-primary">
                <span className="material-symbols-outlined text-lg">star</span>
              </button>
              <button onClick={async () => { if (confirm(t('admin.deleteConfirm'))) { await productRepo.delete(p.id); load(); } }} className="text-outline hover:text-error">
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersTab() {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [noteText, setNoteText] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    adminRepo.getOrders({ search: search || undefined, status: filter || undefined })
      .then(r => setOrders(r.items))
      .finally(() => setLoading(false));
  }, [search, filter]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id: string) => {
    const order = await adminRepo.getOrder(id);
    setSelected(order);
  };

  if (loading) return <LoadingSpinner />;

  const pendingCount = orders.filter(o => o.status === 0).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('admin.search')}
          className="bg-surface-container text-on-surface border border-outline-variant rounded px-3 py-2 text-body-sm flex-1 min-w-[200px]" />
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="bg-surface-container text-on-surface border border-outline-variant rounded px-3 py-2 text-body-sm">
          <option value="">{t('common.all')}</option>
          {[0, 1, 2, 3].map(s => <option key={s} value={s}>{t(statusLabels[s])}</option>)}
        </select>
        {pendingCount > 0 && <span className="text-xs bg-error/20 text-error px-2 py-1 rounded-full">{pendingCount} {t('common.pending')}</span>}
      </div>

      <div className="space-y-2">
        {orders.length === 0 ? (
          <p className="text-center py-16 text-on-surface-variant">{t('account.noOrders')}</p>
        ) : orders.map(order => (
          <div key={order.id} className="rounded-lg p-4 cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: '#1e1f25' }}
            onClick={() => openDetail(order.id)}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-body-sm text-outline">{t('order.reference')}: {order.reference}</span>
                <p className="text-body-sm font-semibold">{order.customerFullName}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusColors[order.status]}`}>
                  {t(statusLabels[order.status])}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-body-sm text-outline">{new Date(order.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language)}</span>
              <span className="text-price-display text-primary">{order.total?.toLocaleString()} DA</span>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1e1f25' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-headline-md">{t('order.reference')}: {selected.reference}</h2>
              <button onClick={() => setSelected(null)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3 text-body-sm">
                <span className="text-outline">{t('checkout.fullName')}:</span><span>{selected.customerFullName}</span>
                <span className="text-outline">{t('checkout.phone')}:</span><span>{selected.customerPhone}</span>
                <span className="text-outline">{t('checkout.email')}:</span><span>{selected.customerEmail}</span>
                <span className="text-outline">{t('checkout.wilaya')}:</span><span>{selected.wilayaName}</span>
                <span className="text-outline">{t('order.date')}:</span><span>{new Date(selected.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <a href={`tel:${selected.customerPhone}`} className="flex items-center gap-1 bg-green-600/20 text-green-300 px-3 py-1.5 rounded text-body-sm">
                  <span className="material-symbols-outlined text-sm">phone</span> {t('admin.contact')}
                </a>
                <a href={`mailto:${selected.customerEmail}`} className="flex items-center gap-1 bg-blue-600/20 text-blue-300 px-3 py-1.5 rounded text-body-sm">
                  <span className="material-symbols-outlined text-sm">mail</span> {t('admin.email')}
                </a>
              </div>
            </div>

            <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: '#282a2f' }}>
              <h3 className="text-body-sm font-semibold mb-2">{t('order.items')}</h3>
              {selected.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-body-sm py-1">
                  <span>{item.productName} × {item.quantity}</span>
                  <span className="text-primary">{(item.unitPrice * item.quantity).toLocaleString()} DA</span>
                </div>
              ))}
              <div className="flex justify-between text-body-sm font-semibold pt-2 mt-2 border-t border-outline-variant/30">
                <span>{t('cart.total')}</span>
                <span className="text-price-display text-primary">{selected.total?.toLocaleString()} DA</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <select value={selected.status} onChange={async e => {
                const s = Number(e.target.value);
                await adminRepo.updateOrderStatus(selected.id, s);
                setSelected({ ...selected, status: s });
                load();
              }}
                className={`px-3 py-1.5 rounded text-body-sm font-semibold border-0 ${statusColors[selected.status]}`}
                style={{ backgroundColor: selected.status === 0 ? '#4a3a1577' : selected.status === 2 ? '#4a151577' : selected.status === 3 ? '#154a3a77' : '#3a154a77' }}>
                {[0, 1, 2, 3].map(s => <option key={s} value={s}>{t(statusLabels[s])}</option>)}
              </select>
              <span className="text-body-sm text-outline">{t('admin.changeStatus')}</span>
            </div>

            <div>
              <h3 className="text-body-sm font-semibold mb-2">{t('admin.internalNotes')}</h3>
              <div className="space-y-2 mb-3">
                {(selected.internalNotes as any[])?.map((note, i) => (
                  <div key={i} className="text-body-sm p-2 rounded" style={{ backgroundColor: '#282a2f' }}>
                    <p>{note.text}</p>
                    <span className="text-outline text-xs">{new Date(note.createdAt).toLocaleString()}</span>
                  </div>
                ))}
                {(!selected.internalNotes || (selected.internalNotes as any[]).length === 0) && (
                  <p className="text-outline text-body-sm">{t('common.noNotes')}</p>
                )}
              </div>
              <div className="flex gap-2">
                <input value={noteText} onChange={e => setNoteText(e.target.value)}
                  placeholder={t('admin.addNote')}
                  className="flex-1 bg-surface-variant text-on-surface rounded px-3 py-2 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
                <button onClick={async () => {
                  if (!noteText.trim()) return;
                  await adminRepo.addOrderNote(selected.id, noteText);
                  setNoteText('');
                  const updated = await adminRepo.getOrder(selected.id);
                  setSelected(updated);
                  load();
                }} className="bg-primary text-on-primary px-4 py-2 rounded-lg text-body-sm font-semibold">
                  {t('admin.addNote')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomersTab() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminRepo.getCustomers().then(setCustomers).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-2">
      {customers.length === 0 ? (
        <p className="text-center py-16 text-on-surface-variant">{t('admin.noData')}</p>
      ) : customers.map(c => (
        <div key={c.id} className="rounded-lg p-4 flex items-center gap-4" style={{ backgroundColor: '#1e1f25' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#282a2f' }}>
            {c.fullName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{c.fullName}</p>
            <p className="text-body-sm text-outline">{c.email} {c.phone && `• ${c.phone}`}</p>
          </div>
          <div className="flex items-center gap-2">
            {c.isBanned && <span className="text-xs bg-error/20 text-error px-2 py-0.5 rounded-full">Banned</span>}
            <button onClick={async () => { await adminRepo.toggleBan(c.id); load(); }}
              className={`text-body-sm px-3 py-1.5 rounded ${c.isBanned ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'}`}>
              {c.isBanned ? t('admin.unban') : t('admin.ban')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoriesTab() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    categoryRepo.getAll().then(setCategories).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm({ name: '', slug: '' }); setShowForm(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm({ name: c.name, slug: c.slug }); setShowForm(true); };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { name: form.name, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-') };
      if (editing) await categoryRepo.update(editing.id, payload as any);
      else await categoryRepo.create(payload as any);
      setShowForm(false);
      load();
    } catch { alert(t('common.error')); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-body-sm text-outline">{categories.length} {t('admin.categories')}</p>
        <button onClick={openNew} className="flex items-center gap-1 bg-primary text-on-primary px-4 py-2 rounded-lg text-body-sm font-semibold">
          <span className="material-symbols-outlined text-lg">add</span> {t('admin.addProduct')}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="rounded-lg p-6 w-full max-w-md" style={{ backgroundColor: '#1e1f25' }}>
            <h2 className="text-headline-md mb-4">{editing ? t('admin.editProduct') : t('admin.categories')}</h2>
            <div className="space-y-3">
              <input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              <input placeholder="Slug" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={saving || !form.name}
                  className="flex-1 bg-primary text-on-primary py-3 rounded-lg font-semibold disabled:opacity-50">
                  {saving ? t('common.loading') : t('admin.save')}
                </button>
                <button onClick={() => setShowForm(false)} className="px-6 py-3 rounded-lg border border-outline-variant text-on-surface-variant">
                  {t('admin.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {categories.map(c => (
          <div key={c.id} className="rounded-lg p-4 flex items-center gap-4" style={{ backgroundColor: '#1e1f25' }}>
            <div className="w-10 h-10 rounded flex items-center justify-center" style={{ backgroundColor: '#282a2f' }}>
              <span className="material-symbols-outlined text-outline-variant">category</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{c.name}</p>
              <p className="text-body-sm text-outline">{c.slug}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(c)} className="text-outline hover:text-primary">
                <span className="material-symbols-outlined text-lg">edit</span>
              </button>
              <button onClick={async () => {
                try {
                  await categoryRepo.delete(c.id);
                  load();
                } catch (err: any) {
                  alert(err.response?.data?.error || t('common.error'));
                }
              }} className="text-outline hover:text-error">
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CollectionsTab() {
  const { t } = useTranslation();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    collectionRepo.getAll().then(setCollections).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm({ name: '', slug: '' }); setShowForm(true); };
  const openEdit = (c: Collection) => { setEditing(c); setForm({ name: c.name, slug: c.slug }); setShowForm(true); };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { name: form.name, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-') };
      if (editing) await collectionRepo.update(editing.id, payload as any);
      else await collectionRepo.create(payload as any);
      setShowForm(false);
      load();
    } catch { alert(t('common.error')); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-body-sm text-outline">{collections.length} {t('admin.collections')}</p>
        <button onClick={openNew} className="flex items-center gap-1 bg-primary text-on-primary px-4 py-2 rounded-lg text-body-sm font-semibold">
          <span className="material-symbols-outlined text-lg">add</span> {t('admin.addProduct')}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="rounded-lg p-6 w-full max-w-md" style={{ backgroundColor: '#1e1f25' }}>
            <h2 className="text-headline-md mb-4">{editing ? t('admin.editProduct') : t('admin.collections')}</h2>
            <div className="space-y-3">
              <input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              <input placeholder="Slug" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={saving || !form.name}
                  className="flex-1 bg-primary text-on-primary py-3 rounded-lg font-semibold disabled:opacity-50">
                  {saving ? t('common.loading') : t('admin.save')}
                </button>
                <button onClick={() => setShowForm(false)} className="px-6 py-3 rounded-lg border border-outline-variant text-on-surface-variant">
                  {t('admin.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {collections.map(c => (
          <div key={c.id} className="rounded-lg p-4 flex items-center gap-4" style={{ backgroundColor: '#1e1f25' }}>
            <div className="w-10 h-10 rounded flex items-center justify-center" style={{ backgroundColor: '#282a2f' }}>
              <span className="material-symbols-outlined text-outline-variant">collections_bookmark</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{c.name}</p>
              <p className="text-body-sm text-outline">{c.slug}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(c)} className="text-outline hover:text-primary">
                <span className="material-symbols-outlined text-lg">edit</span>
              </button>
              <button onClick={async () => { await collectionRepo.delete(c.id); load(); }} className="text-outline hover:text-error">
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BannersTab() {
  const { t } = useTranslation();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', subtitle: '', imageUrl: '', linkUrl: '', sortOrder: 0, isActive: true });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminRepo.getAllBanners().then(setBanners).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm({ title: '', subtitle: '', imageUrl: '', linkUrl: '', sortOrder: 0, isActive: true }); setShowForm(true); };
  const openEdit = (b: Banner) => { setEditing(b); setForm({ title: b.title, subtitle: b.subtitle || '', imageUrl: b.imageUrl, linkUrl: b.linkUrl || '', sortOrder: b.sortOrder || 0, isActive: b.isActive }); setShowForm(true); };

  const save = async () => {
    setSaving(true);
    try {
      await adminRepo.upsertBanner(form as any);
      setShowForm(false);
      load();
    } catch { alert(t('common.error')); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-body-sm text-outline">{banners.length} {t('admin.banners')}</p>
        <button onClick={openNew} className="flex items-center gap-1 bg-primary text-on-primary px-4 py-2 rounded-lg text-body-sm font-semibold">
          <span className="material-symbols-outlined text-lg">add</span> {t('admin.addProduct')}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="rounded-lg p-6 w-full max-w-md" style={{ backgroundColor: '#1e1f25' }}>
            <h2 className="text-headline-md mb-4">{editing ? t('admin.editProduct') : t('admin.banners')}</h2>
            <div className="space-y-3">
              <input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              <input placeholder="Subtitle" value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              <input placeholder="Image URL" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              <input placeholder="Link URL" value={form.linkUrl} onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              <div className="flex items-center gap-4">
                <input type="number" placeholder="Order" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                  className="w-24 bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
                <label className="flex items-center gap-2 text-body-sm">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                  Active
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={saving || !form.title}
                  className="flex-1 bg-primary text-on-primary py-3 rounded-lg font-semibold disabled:opacity-50">
                  {saving ? t('common.loading') : t('admin.save')}
                </button>
                <button onClick={() => setShowForm(false)} className="px-6 py-3 rounded-lg border border-outline-variant text-on-surface-variant">
                  {t('admin.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {banners.map(b => (
          <div key={b.id} className="rounded-lg p-4 flex items-center gap-4" style={{ backgroundColor: '#1e1f25' }}>
            {b.imageUrl ? (
              <img src={b.imageUrl} alt={b.title} className="w-20 h-12 object-cover rounded" />
            ) : (
              <div className="w-20 h-12 rounded flex items-center justify-center" style={{ backgroundColor: '#282a2f' }}>
                <span className="material-symbols-outlined text-outline-variant">image</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{b.title}</p>
              <p className="text-body-sm text-outline">{b.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              {b.isActive ? (
                <span className="text-xs bg-green-600/20 text-green-300 px-2 py-0.5 rounded-full">Active</span>
              ) : (
                <span className="text-xs bg-red-600/20 text-red-300 px-2 py-0.5 rounded-full">Inactive</span>
              )}
              <button onClick={() => openEdit(b)} className="text-outline hover:text-primary">
                <span className="material-symbols-outlined text-lg">edit</span>
              </button>
              <button onClick={async () => { await adminRepo.deleteBanner(b.id); load(); }} className="text-outline hover:text-error">
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsTab() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    reviewAdmin.getPending().then(setReviews).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-3">
      {reviews.length === 0 ? (
        <p className="text-center py-16 text-on-surface-variant">{t('product.noReviews')}</p>
      ) : reviews.map(r => (
        <div key={r.id} className="rounded-lg p-4" style={{ backgroundColor: '#1e1f25' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">{r.customerName}</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`material-symbols-outlined text-sm ${i < r.rating ? 'text-primary' : 'text-outline-variant'}`}>star</span>
              ))}
            </div>
          </div>
          <p className="text-body-sm text-on-surface-variant mb-3">{r.comment}</p>
          <div className="flex gap-2">
            <button onClick={() => { reviewAdmin.approve(r.id).then(load); }}
              className="bg-green-600/20 text-green-300 px-4 py-1.5 rounded text-body-sm font-semibold hover:bg-green-600/30">
              {t('admin.approve')}
            </button>
            <button onClick={() => { reviewAdmin.reject(r.id).then(load); }}
              className="bg-red-600/20 text-red-300 px-4 py-1.5 rounded text-body-sm font-semibold hover:bg-red-600/30">
              {t('admin.reject')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: '#1e1f25' }}>
      <p className="text-body-sm text-outline mb-1">{label}</p>
      <p className="text-headline-md text-primary">{value ?? 0}</p>
    </div>
  );
}

function LoadingSpinner() {
  return <div className="flex items-center justify-center py-20"><span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span></div>;
}

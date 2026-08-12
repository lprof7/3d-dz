import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { adminRepo, reviewAdmin } from '../../../data/repos/adminRepo';
import { productRepo } from '../../../data/repos/productRepo';
import { categoryRepo, collectionRepo } from '../../../data/repos/categoryRepo';
import api from '../../../core/api/client';
import { localized } from '../../../core/i18n/localized';
import { compressImage } from '../../../core/utils/image';
import type { Product, Order, Review, Customer, Category, Collection, Banner } from '../../../data/types';

const statusColors = ['bg-yellow-600/20 text-yellow-300', 'bg-green-600/20 text-green-300', 'bg-red-600/20 text-red-300', 'bg-blue-600/20 text-blue-300'];
const statusLabels = ['order.status_0', 'order.status_1', 'order.status_2', 'order.status_3'];

type Tab = 'analytics' | 'products' | 'orders' | 'customers' | 'categories' | 'collections' | 'banners' | 'reviews';

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [tab, setTab] = useState<Tab>('analytics');
  const [loading, setLoading] = useState(true);
  const [pendingNotif, setPendingNotif] = useState(0);

  useEffect(() => {
    adminRepo.getNotifications({ since: new Date(Date.now() - 86400000).toISOString() })
      .then(r => setPendingNotif(r.pendingCount))
      .catch(() => {});
    const interval = setInterval(() => {
      adminRepo.getNotifications({ since: new Date(Date.now() - 86400000).toISOString() })
        .then(r => setPendingNotif(r.pendingCount))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto px-4 md:px-10 pt-24 pb-16" style={{ maxWidth: '1440px' }}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl">admin_panel_settings</span>
          <h1 className="text-headline-md">{t('admin.dashboard')}</h1>
        </div>
        <button onClick={() => setTab('orders')} className="relative" title={t('admin.pendingOrders')}>
          <span className="material-symbols-outlined text-outline">notifications</span>
          {pendingNotif > 0 && (
            <span className="absolute -top-1 -right-1 bg-error text-on-error text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {pendingNotif > 9 ? '9+' : pendingNotif}
            </span>
          )}
        </button>
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
  const [analyticsFrom, setAnalyticsFrom] = useState('');
  const [analyticsTo, setAnalyticsTo] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    adminRepo.getAnalytics({
      from: analyticsFrom || undefined,
      to: analyticsTo || undefined
    }).then(setStats).finally(() => setLoading(false));
  }, [analyticsFrom, analyticsTo]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;
  if (!stats) return <p className="text-center py-16 text-on-surface-variant">{t('admin.noData')}</p>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input type="date" value={analyticsFrom} onChange={e => setAnalyticsFrom(e.target.value)}
          className="bg-surface-container text-on-surface border border-outline-variant rounded px-3 py-2 text-body-sm" aria-label="From date" />
        <input type="date" value={analyticsTo} onChange={e => setAnalyticsTo(e.target.value)}
          className="bg-surface-container text-on-surface border border-outline-variant rounded px-3 py-2 text-body-sm" aria-label="To date" />
      </div>
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
  const lang = i18n.language;
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [nameLang, setNameLang] = useState('ar');
  const [descLang, setDescLang] = useState('ar');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [imageItems, setImageItems] = useState<{ id: string; url: string; file?: File }[]>([]);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const AVAILABLE_FORMATS = ['STL', 'OBJ', 'GLB', 'GLTF', 'STEP', 'IGES', '3MF', 'AMF', 'PLY', 'DAE', 'FBX', 'BLEND'];

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([adminRepo.getProducts(), categoryRepo.getAll()])
      .then(([p, c]) => { setProducts(p); setCategories(c); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const getLocalized = (obj: any, lang: string) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] || '';
  };
  const setLocalized = (field: string, lang: string, value: string) => {
    setForm((f: any) => {
      const current = typeof f[field] === 'string' ? {} : { ...(f[field] || {}) };
      current[lang] = value;
      return { ...f, [field]: current };
    });
  };

  const openNew = () => {
    setEditing(null);
    setErrors({});
    setForm({ name: { ar: '', en: '', fr: '' }, description: { ar: '', en: '', fr: '' }, price: 0, categoryId: '', images: [], fileFormats: [], license: 'Personal Use', isPublished: true, isFeatured: false, currency: 'DZD', discountPercent: 0, discountStart: null, discountEnd: null, fileSizeMb: 0 });
    setImageItems([]); setModelFile(null);
    setShowForm(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setErrors({});
    setForm({ ...p });
    setImageItems((p.images || []).map(u => ({ id: crypto.randomUUID(), url: u })));
    setModelFile(null);
    setShowForm(true);
  };

  const moveImage = (index: number, dir: -1 | 1) => {
    setImageItems(items => {
      const target = index + dir;
      if (target < 0 || target >= items.length) return items;
      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const compressed = await Promise.all([...files].map(f => compressImage(f)));
    const items = compressed.map(f => ({ id: crypto.randomUUID(), url: URL.createObjectURL(f), file: f }));
    setImageItems(prev => [...prev, ...items]);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!getLocalized(form.name, 'ar') && !getLocalized(form.name, 'en') && !getLocalized(form.name, 'fr'))
      errs.name = t('admin.nameRequired');
    if (!form.categoryId) errs.categoryId = t('admin.categoryRequired');
    if (!form.price || form.price <= 0) errs.price = t('admin.priceInvalid');
    if (!form.fileFormats || form.fileFormats.length === 0) errs.fileFormats = t('admin.fileFormatsRequired');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      const existingUrls = imageItems.filter(i => !i.file).map(i => i.url);
      fd.append('product', JSON.stringify({ ...form, images: existingUrls, discountStart: form.discountStart || null, discountEnd: form.discountEnd || null }));
      imageItems.filter(i => i.file).forEach(i => fd.append('images', i.file!));
      if (modelFile) fd.append('modelFile', modelFile);
      const hasFiles = imageItems.some(i => i.file) || !!modelFile;
      if (editing) {
        if (hasFiles) await api.put(`/products/${editing.id}/with-files`, fd);
        else await productRepo.update(editing.id, form as any);
      } else {
        if (hasFiles) await api.post('/products/with-files', fd);
        else await productRepo.create(form as any);
      }
      setShowForm(false);
      load();
    } catch (e) { alert(t('common.error')); }
    finally { setSaving(false); }
  };

  const langTabs = (lang: string, setLang: (l: string) => void) => (
    <div className="flex gap-1 mb-1">
      {['ar', 'fr', 'en'].map(l => (
        <button key={l} type="button" onClick={() => setLang(l)}
          className={`px-2 py-0.5 rounded text-xs ${lang === l ? 'bg-primary text-on-primary' : 'bg-surface-container text-outline'}`}>
          {l === 'ar' ? 'العربية' : l === 'fr' ? 'Français' : 'English'}
        </button>
      ))}
    </div>
  );

  if (loading) return <LoadingSpinner />;

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await productRepo.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProducts = products.filter(p => {
    if (p.isDeleted) return false;
    const name = typeof p.name === 'string' ? p.name : (p.name as any)?.ar || '';
    if (productSearch && !name.toLowerCase().includes(productSearch.toLowerCase())) return false;
    if (productCategoryFilter && p.categoryId !== productCategoryFilter) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-body-sm text-outline">{filteredProducts.length} {t('admin.products')}</p>
        <button onClick={openNew} className="flex items-center gap-1 bg-primary text-on-primary px-4 py-2 rounded-lg text-body-sm font-semibold">
          <span className="material-symbols-outlined text-lg">add</span> {t('admin.addProduct')}
        </button>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder={t('admin.search')}
          className="bg-surface-container text-on-surface border border-outline-variant rounded px-3 py-2 text-body-sm flex-1 min-w-[200px]" />
        <select value={productCategoryFilter} onChange={e => setProductCategoryFilter(e.target.value)}
          className="bg-surface-container text-on-surface border border-outline-variant rounded px-3 py-2 text-body-sm">
          <option value="">{t('common.all')}</option>
          {categories.map(c => <option key={c.id} value={c.id}>{localized(c.name, lang)}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1e1f25' }}>
            <h2 className="text-headline-md mb-4">{editing ? t('admin.editProduct') : t('admin.addProduct')}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-outline text-body-sm mb-1">{t('admin.productName')}</label>
                {langTabs(nameLang, setNameLang)}
                <input value={getLocalized(form.name, nameLang)}
                  onChange={e => setLocalized('name', nameLang, e.target.value)}
                  className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
                {errors.name && <p className="text-error text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-outline text-body-sm mb-1">{t('product.description')}</label>
                {langTabs(descLang, setDescLang)}
                <textarea value={getLocalized(form.description, descLang)}
                  onChange={e => setLocalized('description', descLang, e.target.value)}
                  className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary min-h-[80px]" />
              </div>
              <div>
                <label className="block text-outline text-body-sm mb-1">{t('product.price')}</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" value={form.price || ''} onChange={e => setForm((f: any) => ({ ...f, price: Number(e.target.value) }))}
                    className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
                  <input type="number" placeholder={t('admin.discountPercent')} value={form.discountPercent || ''}
                    onChange={e => setForm((f: any) => ({ ...f, discountPercent: Number(e.target.value) }))}
                    className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
                </div>
                {errors.price && <p className="text-error text-xs mt-1">{errors.price}</p>}
              </div>
              <div>
                <label className="block text-outline text-body-sm mb-1">{t('admin.discountStart')} / {t('admin.discountEnd')}</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={form.discountStart || ''} onChange={e => setForm((f: any) => ({ ...f, discountStart: e.target.value || null }))}
                    className="bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
                  <input type="date" value={form.discountEnd || ''} onChange={e => setForm((f: any) => ({ ...f, discountEnd: e.target.value || null }))}
                    className="bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="block text-outline text-body-sm mb-1">{t('nav.categories')}</label>
                <select value={form.categoryId || ''} onChange={e => setForm((f: any) => ({ ...f, categoryId: e.target.value }))}
                  className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none">
                  <option value="">{t('admin.selectCategory')}</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{localized(c.name, lang)}</option>)}
                </select>
                {errors.categoryId && <p className="text-error text-xs mt-1">{errors.categoryId}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-outline text-body-sm mb-1">{t('product.license')}</label>
                  <input value={form.license || ''} onChange={e => setForm((f: any) => ({ ...f, license: e.target.value }))}
                    className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-outline text-body-sm mb-1">{t('admin.currency')}</label>
                  <select value={form.currency || 'DZD'} onChange={e => setForm((f: any) => ({ ...f, currency: e.target.value }))}
                    className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none">
                    <option value="DZD">د.ج - DZD</option>
                    <option value="EUR">€ - EUR</option>
                    <option value="USD">$ - USD</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-outline text-body-sm mb-1">{t('product.fileFormats')}</label>
                  <div className="flex gap-2 mb-1">
                    <select value="" onChange={e => {
                      const val = e.target.value;
                      if (val && !form.fileFormats?.includes(val))
                        setForm((f: any) => ({ ...f, fileFormats: [...(f.fileFormats || []), val] }));
                    }}
                      className="flex-1 bg-surface-variant text-on-surface rounded px-3 py-2 text-body-sm outline-none focus:ring-1 focus:ring-primary">
                      <option value="">{t('admin.fileFormatPlaceholder')}</option>
                      {AVAILABLE_FORMATS.filter(f => !form.fileFormats?.includes(f)).map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {(form.fileFormats || []).map((fmt: string, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-surface-container text-on-surface rounded px-2 py-0.5 text-xs">
                        {fmt}
                        <button type="button" onClick={() => setForm((f: any) => ({ ...f, fileFormats: f.fileFormats.filter((_: string, j: number) => j !== i) }))}
                          className="text-error hover:text-error/80">
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                  {errors.fileFormats && <p className="text-error text-xs mt-1">{errors.fileFormats}</p>}
                </div>
                <div>
                  <label className="block text-outline text-body-sm mb-1">{t('product.fileSize')} (MB)</label>
                  <input type="number" value={form.fileSizeMb || ''} readOnly
                    className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none opacity-60 cursor-not-allowed" />
                </div>
              </div>
              <div>
                <label className="block text-outline text-body-sm mb-1">{t('admin.images')} <span className="text-outline-variant">({t('admin.coverIsFirst')})</span></label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {imageItems.map((item, i) => (
                    <div key={item.id} className="relative w-20 h-20 rounded overflow-hidden group" style={{ backgroundColor: '#282a2f' }}>
                      <img src={item.url} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 bg-primary/90 text-on-primary text-[9px] text-center font-semibold py-0.5">{t('admin.cover')}</span>
                      )}
                      <button type="button" onClick={() => setImageItems(items => items.filter(x => x.id !== item.id))}
                        className="absolute top-0 right-0 bg-error/80 text-white text-xs w-4 h-4 flex items-center justify-center rounded-bl">
                        ×
                      </button>
                      <div className="absolute bottom-0 right-0 hidden group-hover:flex gap-0.5">
                        <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0}
                          className="bg-black/60 text-white text-[10px] w-5 h-5 flex items-center justify-center disabled:opacity-30">←</button>
                        <button type="button" onClick={() => moveImage(i, 1)} disabled={i === imageItems.length - 1}
                          className="bg-black/60 text-white text-[10px] w-5 h-5 flex items-center justify-center disabled:opacity-30">→</button>
                      </div>
                    </div>
                  ))}
                </div>
                <label className="inline-flex items-center gap-2 bg-surface-container text-on-surface px-4 py-2 rounded text-body-sm cursor-pointer hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-lg">add_photo_alternate</span>
                  {t('admin.upload')}
                  <input type="file" accept="image/*" multiple hidden onChange={e => { addImages(e.target.files); e.target.value = ''; }} />
                </label>
              </div>
              <div>
                <label className="block text-outline text-body-sm mb-1">{t('admin.model3d')}</label>
                <div className="flex items-center gap-3">
                  {modelFile ? (
                    <div className="flex items-center gap-2 bg-surface-container rounded px-3 py-2 text-body-sm">
                      <span className="material-symbols-outlined text-outline text-lg">view_in_ar</span>
                      <span className="text-on-surface truncate max-w-[200px]">{modelFile.name}</span>
                      <button type="button" onClick={() => setModelFile(null)}
                        className="text-error hover:text-error/80 ml-1">
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  ) : form.modelUrl ? (
                    <div className="flex items-center gap-2 bg-surface-container rounded px-3 py-2 text-body-sm">
                      <span className="material-symbols-outlined text-outline text-lg">check_circle</span>
                      <span className="text-outline">{t('admin.modelUploaded')}</span>
                      <button type="button" onClick={() => setForm((f: any) => ({ ...f, modelUrl: '', modelFormat: '' }))}
                        className="text-error hover:text-error/80 ml-1">
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  ) : null}
                  <label className="inline-flex items-center gap-2 bg-surface-container text-on-surface px-4 py-2 rounded text-body-sm cursor-pointer hover:bg-surface-container-high transition-colors">
                    <span className="material-symbols-outlined text-lg">upload_file</span>
                    {modelFile ? t('admin.replace') : t('admin.upload')}
                    <input type="file" accept=".glb,.gltf,.stl,.obj" hidden onChange={e => {
                      const file = e.target.files?.[0]; if (!file) return;
                      setModelFile(file);
                      const sizeMb = Math.round(file.size / (1024 * 1024) * 100) / 100;
                      const ext = file.name.split('.').pop()?.toUpperCase();
                      setForm((f: any) => ({
                        ...f,
                        fileSizeMb: sizeMb,
                        fileFormats: ext && !(f.fileFormats || []).includes(ext)
                          ? [...(f.fileFormats || []), ext]
                          : (f.fileFormats || [])
                      }));
                    }} />
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-body-sm">
                  <input type="checkbox" checked={form.isFeatured || false} onChange={e => setForm((f: any) => ({ ...f, isFeatured: e.target.checked }))} />
                  {t('admin.featured')}
                </label>
                <label className="flex items-center gap-2 text-body-sm">
                  <input type="checkbox" checked={form.isPublished ?? true} onChange={e => setForm((f: any) => ({ ...f, isPublished: e.target.checked }))} />
                  {t('admin.published')}
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={saving}
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
        {filteredProducts.map(p => {
          const name = typeof p.name === 'string' ? p.name : p.name?.ar || p.name?.en || p.name?.fr || '';
          return (
            <div key={p.id} className="rounded-lg p-4 flex items-center gap-4" style={{ backgroundColor: '#1e1f25' }}>
              {p.images?.[0] ? (
                <img src={p.images[0]} alt="" className="w-12 h-12 object-cover rounded" />
              ) : (
                <div className="w-12 h-12 rounded flex items-center justify-center" style={{ backgroundColor: '#282a2f' }}>
                  <span className="material-symbols-outlined text-outline-variant">3d_rotation</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{name}</p>
                <p className="text-body-sm text-outline">{p.price?.toLocaleString()} DA</p>
              </div>
              {p.modelUrl && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{p.modelFormat?.toUpperCase()}</span>}
              {p.isFeatured && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{t('admin.featured')}</span>}
              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="text-outline hover:text-primary">
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
                <button onClick={async () => { await productRepo.toggleFeatured(p.id); load(); }} className="text-outline hover:text-primary">
                  <span className="material-symbols-outlined text-lg">star</span>
                </button>
                <button onClick={() => { if (confirm(t('admin.deleteConfirm'))) handleDelete(p.id); }} disabled={deletingId === p.id} className="text-outline hover:text-error disabled:opacity-30">
                  <span className="material-symbols-outlined text-lg">{deletingId === p.id ? 'sync' : 'delete'}</span>
                </button>
              </div>
            </div>
          );
        })}
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
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    adminRepo.getOrders({
      search: search || undefined,
      status: filter || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined
    }).then(r => setOrders(r.items))
      .finally(() => setLoading(false));
  }, [search, filter, fromDate, toDate]);

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
        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
          className="bg-surface-container text-on-surface border border-outline-variant rounded px-3 py-2 text-body-sm" aria-label="From date" />
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
          className="bg-surface-container text-on-surface border border-outline-variant rounded px-3 py-2 text-body-sm" aria-label="To date" />
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
                  <span>{localized(item.productName, i18n.language)} × {item.quantity}</span>
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
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    adminRepo.getCustomers().then(setCustomers).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (c: Customer) => {
    setSelected(c);
    setOrdersLoading(true);
    try {
      const res = await adminRepo.getOrders({ customerId: c.id });
      setCustomerOrders(res.items || []);
    } catch { setCustomerOrders([]); }
    finally { setOrdersLoading(false); }
  };

  if (loading) return <LoadingSpinner />;

  const filteredCustomers = customers.filter(c =>
    !customerSearch || c.fullName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div>
      <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder={t('admin.search')}
        className="bg-surface-container text-on-surface border border-outline-variant rounded px-3 py-2 text-body-sm w-full mb-4" />
      <div className="space-y-2">
        {filteredCustomers.length === 0 ? (
          <p className="text-center py-16 text-on-surface-variant">{t('admin.noData')}</p>
        ) : filteredCustomers.map(c => (
          <div key={c.id} className="rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ backgroundColor: '#1e1f25' }} onClick={() => openDetail(c)}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#282a2f' }}>
              {c.fullName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{c.fullName}</p>
              <p className="text-body-sm text-outline">{c.email} {c.phone && `• ${c.phone}`}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-body-sm text-outline">{(c as any).orderCount || 0} orders</span>
              {c.isBanned && <span className="text-xs bg-error/20 text-error px-2 py-0.5 rounded-full">Banned</span>}
              <button onClick={async (e) => { e.stopPropagation(); await adminRepo.toggleBan(c.id); load(); }}
                className={`text-body-sm px-3 py-1.5 rounded ${c.isBanned ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'}`}>
                {c.isBanned ? t('admin.unban') : t('admin.ban')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) { setSelected(null); setCustomerOrders([]); } }}>
          <div className="rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1e1f25' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-headline-md">{selected.fullName}</h2>
              <button onClick={() => { setSelected(null); setCustomerOrders([]); }} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-2 mb-6 text-body-sm">
              <p><span className="text-outline">{t('checkout.email')}:</span> {selected.email}</p>
              <p><span className="text-outline">{t('checkout.phone')}:</span> {selected.phone || '-'}</p>
              <p><span className="text-outline">{t('order.date')}:</span> {new Date(selected.createdAt).toLocaleDateString()}</p>
            </div>
            <h3 className="text-body-md font-semibold mb-3">{t('account.orders')} ({customerOrders.length})</h3>
            {ordersLoading ? (
              <LoadingSpinner />
            ) : customerOrders.length === 0 ? (
              <p className="text-on-surface-variant text-body-sm">{t('account.noOrders')}</p>
            ) : (
              <div className="space-y-2">
                {customerOrders.map(o => (
                  <div key={o.id} className="rounded-lg p-3" style={{ backgroundColor: '#282a2f' }}>
                    <div className="flex justify-between text-body-sm">
                      <span>{o.reference}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusColors[o.status]}`}>{t(statusLabels[o.status])}</span>
                    </div>
                    <div className="flex justify-between text-body-sm text-outline mt-1">
                      <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                      <span className="text-primary">{o.total?.toLocaleString()} DA</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoriesTab() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: { ar: '', en: '', fr: '' }, slug: '', description: { ar: '', en: '', fr: '' } });
  const [saving, setSaving] = useState(false);
  const [nameLang, setNameLang] = useState('ar');
  const [descLang, setDescLang] = useState('ar');

  const load = useCallback(() => {
    setLoading(true);
    categoryRepo.getAll().then(setCategories).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const getLocalized = (obj: any, lang: string) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] || '';
  };
  const setLocalized = (field: string, lang: string, value: string) => {
    setForm((f: any) => {
      const current = typeof f[field] === 'string' ? {} : { ...(f[field] || {}) };
      current[lang] = value;
      return { ...f, [field]: current };
    });
  };

  const langTabs = (lang: string, setLang: (l: string) => void) => (
    <div className="flex gap-1 mb-1">
      {['ar', 'fr', 'en'].map(l => (
        <button key={l} type="button" onClick={() => setLang(l)}
          className={`px-2 py-0.5 rounded text-xs ${lang === l ? 'bg-primary text-on-primary' : 'bg-surface-container text-outline'}`}>
          {l === 'ar' ? 'العربية' : l === 'fr' ? 'Français' : 'English'}
        </button>
      ))}
    </div>
  );

  const openNew = () => { setEditing(null); setForm({ name: { ar: '', en: '', fr: '' }, slug: '', description: { ar: '', en: '', fr: '' } }); setShowForm(true); };
  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: typeof c.name === 'string' ? { ar: c.name, en: '', fr: '' } : { ar: '', en: '', fr: '', ...c.name }, slug: c.slug, description: c.description ? (typeof c.description === 'string' ? { ar: c.description, en: '', fr: '' } : { ar: '', en: '', fr: '', ...c.description }) : { ar: '', en: '', fr: '' } });
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { name: form.name, description: form.description, slug: form.slug || getLocalized(form.name, 'en').toLowerCase().replace(/\s+/g, '-') };
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
              {langTabs(nameLang, setNameLang)}
              <input placeholder="Name" value={getLocalized(form.name, nameLang)} onChange={e => setLocalized('name', nameLang, e.target.value)}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              {langTabs(descLang, setDescLang)}
              <textarea placeholder="Description" value={getLocalized(form.description, descLang)} onChange={e => setLocalized('description', descLang, e.target.value)}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary min-h-[80px]" />
              <input placeholder="Slug" value={form.slug} onChange={e => setForm((f: any) => ({ ...f, slug: e.target.value }))}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={saving || !getLocalized(form.name, 'ar')}
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
              <p className="font-semibold truncate">{localized(c.name, lang)}</p>
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
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: { ar: '', en: '', fr: '' }, slug: '', description: { ar: '', en: '', fr: '' } });
  const [saving, setSaving] = useState(false);
  const [nameLang, setNameLang] = useState('ar');
  const [descLang, setDescLang] = useState('ar');

  const load = useCallback(() => {
    setLoading(true);
    collectionRepo.getAll().then(setCollections).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const getLocalized = (obj: any, lang: string) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] || '';
  };
  const setLocalized = (field: string, lang: string, value: string) => {
    setForm((f: any) => {
      const current = typeof f[field] === 'string' ? {} : { ...(f[field] || {}) };
      current[lang] = value;
      return { ...f, [field]: current };
    });
  };

  const langTabs = (lang: string, setLang: (l: string) => void) => (
    <div className="flex gap-1 mb-1">
      {['ar', 'fr', 'en'].map(l => (
        <button key={l} type="button" onClick={() => setLang(l)}
          className={`px-2 py-0.5 rounded text-xs ${lang === l ? 'bg-primary text-on-primary' : 'bg-surface-container text-outline'}`}>
          {l === 'ar' ? 'العربية' : l === 'fr' ? 'Français' : 'English'}
        </button>
      ))}
    </div>
  );

  const openNew = () => { setEditing(null); setForm({ name: { ar: '', en: '', fr: '' }, slug: '', description: { ar: '', en: '', fr: '' } }); setShowForm(true); };
  const openEdit = (c: Collection) => {
    setEditing(c);
    setForm({ name: typeof c.name === 'string' ? { ar: c.name, en: '', fr: '' } : { ar: '', en: '', fr: '', ...c.name }, slug: c.slug, description: c.description ? (typeof c.description === 'string' ? { ar: c.description, en: '', fr: '' } : { ar: '', en: '', fr: '', ...c.description }) : { ar: '', en: '', fr: '' } });
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { name: form.name, description: form.description, slug: form.slug || getLocalized(form.name, 'en').toLowerCase().replace(/\s+/g, '-') };
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
              {langTabs(nameLang, setNameLang)}
              <input placeholder="Name" value={getLocalized(form.name, nameLang)} onChange={e => setLocalized('name', nameLang, e.target.value)}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              {langTabs(descLang, setDescLang)}
              <textarea placeholder="Description" value={getLocalized(form.description, descLang)} onChange={e => setLocalized('description', descLang, e.target.value)}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary min-h-[80px]" />
              <input placeholder="Slug" value={form.slug} onChange={e => setForm((f: any) => ({ ...f, slug: e.target.value }))}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={saving || !getLocalized(form.name, 'ar')}
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
              <p className="font-semibold truncate">{localized(c.name, lang)}</p>
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
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [titleLang, setTitleLang] = useState('ar');
  const [subtitleLang, setSubtitleLang] = useState('ar');
  const [ctaLang, setCtaLang] = useState('ar');

  const load = useCallback(() => {
    setLoading(true);
    adminRepo.getAllBanners().then(setBanners).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const getLocalized = (obj: any, lang: string) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] || '';
  };
  const setLocalized = (field: string, lang: string, value: string) => {
    setForm((f: any) => {
      const current = typeof f[field] === 'string' ? {} : { ...(f[field] || {}) };
      current[lang] = value;
      return { ...f, [field]: current };
    });
  };

  const langTabs = (lang: string, setLang: (l: string) => void) => (
    <div className="flex gap-1 mb-1">
      {['ar', 'fr', 'en'].map(l => (
        <button key={l} type="button" onClick={() => setLang(l)}
          className={`px-2 py-0.5 rounded text-xs ${lang === l ? 'bg-primary text-on-primary' : 'bg-surface-container text-outline'}`}>
          {l === 'ar' ? 'العربية' : l === 'fr' ? 'Français' : 'English'}
        </button>
      ))}
    </div>
  );

  const openNew = () => {
    setEditing(null);
    setForm({ title: { ar: '', en: '', fr: '' }, subtitle: { ar: '', en: '', fr: '' }, ctaText: { ar: '', en: '', fr: '' }, imageUrl: '', linkUrl: '', sortOrder: 0, active: true });
    setShowForm(true);
  };
  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      id: b.id,
      title: typeof b.title === 'string' ? { ar: b.title, en: '', fr: '' } : { ar: '', en: '', fr: '', ...b.title },
      subtitle: b.subtitle ? (typeof b.subtitle === 'string' ? { ar: b.subtitle, en: '', fr: '' } : { ar: '', en: '', fr: '', ...b.subtitle }) : { ar: '', en: '', fr: '' },
      ctaText: b.ctaText ? (typeof b.ctaText === 'string' ? { ar: b.ctaText, en: '', fr: '' } : { ar: '', en: '', fr: '', ...b.ctaText }) : { ar: '', en: '', fr: '' },
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl || '',
      sortOrder: b.sortOrder || 0,
      active: b.active
    });
    setShowForm(true);
  };

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
              {langTabs(titleLang, setTitleLang)}
              <input placeholder="Title" value={getLocalized(form.title, titleLang)} onChange={e => setLocalized('title', titleLang, e.target.value)}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              {langTabs(subtitleLang, setSubtitleLang)}
              <input placeholder="Subtitle" value={getLocalized(form.subtitle, subtitleLang)} onChange={e => setLocalized('subtitle', subtitleLang, e.target.value)}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              {langTabs(ctaLang, setCtaLang)}
              <input placeholder="CTA Text" value={getLocalized(form.ctaText, ctaLang)} onChange={e => setLocalized('ctaText', ctaLang, e.target.value)}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              <input placeholder="Image URL" value={form.imageUrl} onChange={e => setForm((f: any) => ({ ...f, imageUrl: e.target.value }))}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              <input placeholder="Link URL" value={form.linkUrl} onChange={e => setForm((f: any) => ({ ...f, linkUrl: e.target.value }))}
                className="w-full bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
              <div className="flex items-center gap-4">
                <input type="number" placeholder="Order" value={form.sortOrder} onChange={e => setForm((f: any) => ({ ...f, sortOrder: Number(e.target.value) }))}
                  className="w-24 bg-surface-variant text-on-surface rounded px-4 py-3 text-body-sm outline-none focus:ring-1 focus:ring-primary" />
                <label className="flex items-center gap-2 text-body-sm">
                  <input type="checkbox" checked={form.active} onChange={e => setForm((f: any) => ({ ...f, active: e.target.checked }))} />
                  Active
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={saving || !getLocalized(form.title, 'ar')}
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
                <img src={b.imageUrl} alt={localized(b.title, lang)} className="w-20 h-12 object-cover rounded" />
              ) : (
                <div className="w-20 h-12 rounded flex items-center justify-center" style={{ backgroundColor: '#282a2f' }}>
                  <span className="material-symbols-outlined text-outline-variant">image</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{localized(b.title, lang)}</p>
                <p className="text-body-sm text-outline">{localized(b.subtitle || '', lang)}</p>
            </div>
            <div className="flex items-center gap-2">
              {b.active ? (
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
                <span key={i} className={`material-symbols-outlined text-sm ${i < r.rating ? 'text-primary' : 'text-outline-variant'}`}
                  style={i < r.rating ? { fontVariationSettings: "'FILL' 1" } : undefined}>star</span>
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

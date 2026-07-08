import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../core/auth/store';
import { useCartStore } from '../../../core/store/cart';

const languages = [
  { code: 'ar', label: 'العربية' },
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' }
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language?.split('-')[0] || 'ar';

  return (
    <div className="flex gap-1">
      {languages.map((l) => (
        <button
          key={l.code}
          onClick={() => i18n.changeLanguage(l.code)}
          className={`px-2 py-0.5 rounded text-xs transition-colors ${
            current === l.code
              ? 'bg-primary text-on-primary font-bold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {l.code === 'ar' ? 'ع' : l.code === 'fr' ? 'F' : 'E'}
        </button>
      ))}
    </div>
  );
}

export function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const itemCount = useCartStore(s => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: '#111318cc', backdropFilter: 'blur(12px)' }}>
      <div className="mx-auto flex items-center justify-between px-4 md:px-10 h-16 gap-4" style={{ maxWidth: '1440px' }}>
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-tech-label text-primary">3D DZ</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 shrink-0">
          <Link to="/catalog" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">{t('nav.explore')}</Link>
          <Link to="/catalog" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">{t('nav.categories')}</Link>
          <Link to="/catalog?sort=newest" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">{t('nav.newest')}</Link>
        </nav>

        <form onSubmit={handleSearch} className="flex-1 max-w-xs hidden md:flex">
          <input
            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('nav.search')}
            className="w-full bg-surface-variant text-on-surface rounded-md px-3 py-1.5 text-body-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </form>

        <div className="flex items-center gap-3 shrink-0">
          <LanguageSwitcher />

          <Link to="/account" className="text-on-surface-variant hover:text-primary transition-colors relative">
            <span className="material-symbols-outlined text-xl">favorite</span>
          </Link>

          <Link to="/cart" className="text-on-surface-variant hover:text-primary transition-colors relative">
            <span className="material-symbols-outlined text-xl">shopping_cart</span>
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-error text-on-error text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          {user ? (
            <Link to="/account" className="text-body-sm text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-xl">person</span>
            </Link>
          ) : (
            <Link to="/auth?mode=login" className="bg-primary text-on-primary px-4 py-1.5 rounded-md text-body-sm font-semibold hover:opacity-90 transition-opacity">
              {t('nav.login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-outline-variant/30 mt-16" style={{ backgroundColor: '#1a1b21' }}>
      <div className="mx-auto px-4 md:px-10 py-8" style={{ maxWidth: '1440px' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-headline-md text-primary mb-3">3D DZ</h3>
            <p className="text-body-md text-on-surface-variant">{t('common.manufacturingTheFuture')}</p>
          </div>
          <div>
            <h4 className="text-body-md font-semibold text-on-surface mb-3">{t('nav.explore')}</h4>
            <div className="flex flex-col gap-2">
              <Link to="/catalog" className="text-body-sm text-on-surface-variant hover:text-primary">{t('nav.categories')}</Link>
              <Link to="/catalog?sort=newest" className="text-body-sm text-on-surface-variant hover:text-primary">{t('nav.newest')}</Link>
            </div>
          </div>
          <div>
            <h4 className="text-body-md font-semibold text-on-surface mb-3">{t('nav.myAccount')}</h4>
            <div className="flex flex-col gap-2">
              <Link to="/auth?mode=login" className="text-body-sm text-on-surface-variant hover:text-primary">{t('nav.login')}</Link>
              <Link to="/auth?mode=register" className="text-body-sm text-on-surface-variant hover:text-primary">{t('nav.register')}</Link>
            </div>
          </div>
          <div>
            <h4 className="text-body-md font-semibold text-on-surface mb-3">{t('common.language')}</h4>
            <LanguageSwitcher />
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-outline-variant/20 text-center text-body-sm text-on-surface-variant">
          &copy; {new Date().getFullYear()} 3D DZ. {t('common.allRightsReserved')}.
        </div>
      </div>
    </footer>
  );
}

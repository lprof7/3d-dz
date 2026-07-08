import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
      <span className="material-symbols-outlined text-6xl text-outline-variant">error_outline</span>
      <h1 className="text-headline-md">404</h1>
      <p className="text-on-surface-variant">{t('common.notFound')}</p>
      <Link to="/" className="bg-primary text-on-primary px-6 py-3 rounded-lg font-semibold">
        {t('common.backToHome')}
      </Link>
    </div>
  );
}

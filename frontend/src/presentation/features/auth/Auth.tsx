import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../core/auth/store';
import api from '../../../core/api/client';

export default function Auth() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, loading, error, clearError } = useAuthStore();
  const urlMode = searchParams.get('mode') || 'login';
  const resetToken = searchParams.get('token') || '';
  const initialMode = resetToken ? 'reset' : urlMode;
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '', token: resetToken });
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');

  const toggle = (m: string) => { clearError(); setMode(m); setForgotSent(false); setForgotMsg(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        navigate('/');
      } else if (mode === 'register') {
        if (form.password !== form.confirmPassword) { return alert(t('auth.passwordMismatch')); }
        await register({ fullName: form.fullName, email: form.email, phone: form.phone, password: form.password });
        navigate('/');
      } else if (mode === 'forgot') {
        await api.post('/auth/forgot-password', { email: form.email });
        setForgotSent(true);
        setForgotMsg(t('auth.resetSent'));
      } else if (mode === 'reset') {
        await api.post('/auth/reset-password', { token: form.token, newPassword: form.password });
        setForgotMsg(t('auth.resetSuccess'));
        setTimeout(() => toggle('login'), 2000);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || t('common.error');
      if (mode === 'login' || mode === 'register') {
      } else { setForgotMsg(msg); }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md rounded-lg p-8" style={{ backgroundColor: '#1e1f25' }}>
        <h1 className="text-headline-md text-center mb-6">
          {mode === 'login' ? t('auth.loginTitle') : mode === 'register' ? t('auth.registerTitle') : mode === 'forgot' ? t('auth.forgotPassword') : t('auth.resetPassword')}
        </h1>

        {error && <div className="bg-error-container text-on-error-container p-3 rounded mb-4 text-body-sm">{error}</div>}
        {forgotMsg && <div className="bg-green-900/30 text-green-300 p-3 rounded mb-4 text-body-sm">{forgotMsg}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <input placeholder={t('auth.fullName')} required value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                className="w-full bg-surface-container text-on-surface border border-outline-variant rounded px-4 py-3" />
              <input placeholder={t('auth.phone')} required value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full bg-surface-container text-on-surface border border-outline-variant rounded px-4 py-3" />
            </>
          )}
          {(mode === 'login' || mode === 'forgot') && (
            <input type="email" placeholder={t('auth.email')} required value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-surface-container text-on-surface border border-outline-variant rounded px-4 py-3" />
          )}
          {mode !== 'forgot' && mode !== 'reset' && (
            <input type="password" placeholder={t('auth.password')} required value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full bg-surface-container text-on-surface border border-outline-variant rounded px-4 py-3" />
          )}
          {mode === 'reset' && (
            <>
              <input type="hidden" value={form.token} />
              <input type="password" placeholder={t('auth.newPassword')} required value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full bg-surface-container text-on-surface border border-outline-variant rounded px-4 py-3" />
              <input type="password" placeholder={t('auth.confirmPassword')} required value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                className="w-full bg-surface-container text-on-surface border border-outline-variant rounded px-4 py-3" />
            </>
          )}
          {mode === 'register' && (
            <input type="password" placeholder={t('auth.confirmPassword')} required value={form.confirmPassword}
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              className="w-full bg-surface-container text-on-surface border border-outline-variant rounded px-4 py-3" />
          )}
          <button type="submit" disabled={loading || (mode === 'forgot' && forgotSent)}
            className="w-full bg-primary text-on-primary py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? t('common.loading') : mode === 'login' ? t('auth.loginTitle') : mode === 'register' ? t('auth.registerTitle') : mode === 'forgot' ? t('auth.sendReset') : t('auth.resetPassword')}
          </button>
        </form>

        <div className="text-center mt-4 text-body-sm text-on-surface-variant space-y-2">
          {mode === 'login' && (
            <>
              <p>{t('auth.noAccount')} <button onClick={() => toggle('register')} className="text-primary underline">{t('auth.registerTitle')}</button></p>
              <p><button onClick={() => toggle('forgot')} className="text-outline hover:text-primary underline">{t('auth.forgotPassword')}</button></p>
            </>
          )}
          {mode === 'register' && (
            <p>{t('auth.haveAccount')} <button onClick={() => toggle('login')} className="text-primary underline">{t('auth.loginTitle')}</button></p>
          )}
          {mode === 'forgot' && (
            <p><button onClick={() => toggle('login')} className="text-primary underline">{t('auth.loginTitle')}</button></p>
          )}
        </div>
      </div>
    </div>
  );
}
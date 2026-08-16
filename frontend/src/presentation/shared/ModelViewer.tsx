import { useEffect, useRef, useState, createElement } from 'react';
import { useTranslation } from 'react-i18next';
import '@google/model-viewer';

interface Props {
  modelUrl?: string;
  modelFormat?: string;
  className?: string;
}

export default function ModelViewer({ modelUrl, modelFormat, className = '' }: Props) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const canPreview = modelUrl && modelFormat && ['glb', 'gltf'].includes(modelFormat.toLowerCase());

  useEffect(() => {
    setError(false);
    setProgress(0);
    setLoaded(false);
    const el = ref.current?.querySelector('model-viewer') as any;
    if (!el) return;
    const onError = () => setError(true);
    const onProgress = (e: CustomEvent) => {
      const total = e.detail?.totalProgress ?? 0;
      setProgress(Math.max(0, Math.min(1, total)));
    };
    const onLoad = () => {
      setProgress(1);
      setLoaded(true);
    };
    el.addEventListener('error', onError);
    el.addEventListener('progress', onProgress);
    el.addEventListener('load', onLoad);
    return () => {
      el.removeEventListener('error', onError);
      el.removeEventListener('progress', onProgress);
      el.removeEventListener('load', onLoad);
    };
  }, [modelUrl]);

  if (!modelUrl) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center gap-3 ${className}`} style={{ backgroundColor: '#1e1f25' }}>
        <span className="material-symbols-outlined text-5xl text-outline-variant">view_in_ar</span>
        <p className="text-body-sm text-outline text-center px-4">{t('product.noPreview')}</p>
      </div>
    );
  }

  if (!canPreview || error) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center gap-3 ${className}`} style={{ backgroundColor: '#1e1f25' }}>
        <span className="material-symbols-outlined text-5xl text-outline-variant">view_in_ar</span>
        <p className="text-body-sm text-outline text-center px-4">{t('product.noPreview')}</p>
        <p className="text-body-sm text-outline-variant text-center px-4">
          {t('product.availableFormats')} {modelFormat?.toUpperCase()}
        </p>
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative w-full h-full ${className}`} style={{ backgroundColor: '#1e1f25' }}>
      {createElement('model-viewer', {
        src: modelUrl,
        ar: true,
        ['ar-modes' as string]: 'webxr scene-viewer quick-look',
        ['camera-controls' as string]: true,
        ['auto-rotate' as string]: true,
        ['rotation-per-second' as string]: '30deg',
        ['shadow-intensity' as string]: '1',
        ['touch-action' as string]: 'pan-y',
        className: 'w-full h-full',
        style: { backgroundColor: '#1e1f25' }
      })}
      {!loaded && !error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-5xl text-outline-variant animate-spin">3d_rotation</span>
          <p className="text-body-sm text-outline text-center px-4">{t('product.modelLoading')}</p>
          <div className="w-40 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#2f3137' }}>
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{ width: `${Math.round(progress * 100)}%`, backgroundColor: '#8ab4f8' }}
            />
          </div>
          <p className="text-body-sm text-outline-variant tabular-nums">{Math.round(progress * 100)}%</p>
        </div>
      )}
    </div>
  );
}

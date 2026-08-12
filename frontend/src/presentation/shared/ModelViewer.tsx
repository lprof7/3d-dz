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
  const canPreview = modelUrl && modelFormat && ['glb', 'gltf'].includes(modelFormat.toLowerCase());

  useEffect(() => {
    const el = ref.current?.querySelector('model-viewer') as any;
    if (!el) return;
    const onError = () => setError(true);
    el.addEventListener('error', onError);
    return () => el.removeEventListener('error', onError);
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
    <div ref={ref} className={`w-full h-full ${className}`} style={{ backgroundColor: '#1e1f25' }}>
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
    </div>
  );
}

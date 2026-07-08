// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function localized(value: any, lang: string): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.en || value.fr || value.ar || '';
}

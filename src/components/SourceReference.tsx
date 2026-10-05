import { translations } from '../i18n/translations.ts';
import type { Language } from '../lib/storage.ts';

export function SourceReference({ language, compact = false }: { language: Language; compact?: boolean }) {
  const t = translations[language];
  if (compact) return <aside className="source-reference"><p>{t.footerSource}</p><p><a href="https://oro.open.ac.uk/5393/" target="_blank" rel="noopener noreferrer">{t.footerSourceLink}</a></p></aside>;
  return <aside className="source-reference">
    <p>{t.sourceAttribution}</p>
    <p><a href="https://oro.open.ac.uk/5393/" target="_blank" rel="noopener noreferrer">{t.sourceLink}</a></p>
    <p>{t.sourceCitation}</p><p>{t.sourceIndependence}</p>
  </aside>;
}

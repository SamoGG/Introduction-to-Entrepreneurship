import { translations } from '../i18n/translations.ts';
import type { Language } from '../lib/storage.ts';

export function SourceReference({ language, study = false }: { language: Language; study?: boolean }) {
  const t = translations[language];
  return <aside className="source-reference">
    <p>{study ? t.sourceStudy : t.sourceAttribution}</p>
    {study && <p>{t.sourceAttribution}</p>}
    <p><a href="https://oro.open.ac.uk/5393/" target="_blank" rel="noopener noreferrer">{t.sourceLink}</a></p>
    <p>{t.sourceCitation}</p><p>{t.sourceIndependence}</p>
  </aside>;
}

import { translations } from '../i18n/translations.ts';
import type { Language } from '../lib/storage.ts';

export function QuestionProgress({ answered, language }: { answered: number; language: Language }) {
  const t = translations[language];
  const percentage = answered / 54 * 100;
  return <div>
    <div className="progress-track" role="progressbar" aria-label={t.answeredLabel} aria-valuetext={`${answered} ${t.of} 54`} aria-valuenow={answered} aria-valuemin={0} aria-valuemax={54}><span style={{ width: `${percentage}%` }} /></div>
    <div className="progress-caption"><span>{t.answeredLabel} {answered} / 54</span><span>{Math.round(percentage)}% {t.complete}</span></div>
  </div>;
}

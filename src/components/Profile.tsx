import { categories } from '../data/questions.ts';
import { profileHighlights, profilePercentages } from '../lib/profile.ts';
import type { Result } from '../lib/scoring.ts';
import type { Language } from '../lib/storage.ts';
import { formatScore, numberFormat, translations } from '../i18n/translations.ts';

export function Profile({ result, language }: { result: Result; language: Language }) {
  const t = translations[language];
  const percentages = profilePercentages(result);
  const highlights = profileHighlights(result);
  const point = (index: number, percent: number) => {
    const angle = index * 2 * Math.PI / 5 - Math.PI / 2;
    return [150 + Math.cos(angle) * percent, 145 + Math.sin(angle) * percent];
  };
  const ring = (radius: number) => categories.map((_, index) => point(index, radius).join(',')).join(' ');
  const description = categories.map(category => `${t[category]}: ${percentages[category] === null ? t.na : `${numberFormat(percentages[category]!, language, 0)}%`}`).join('; ');
  const complete = categories.every(category => percentages[category] !== null);
  const names = highlights && new Intl.ListFormat(language, { style: 'long', type: 'conjunction' }).format(highlights.dimensions.map(category => t[category]));
  return <section className="profile-panel" aria-labelledby="profile-title">
    <h2 id="profile-title">{t.profileTitle}</h2>
    {highlights && <p className="profile-summary">{highlights.kind === 'balanced' ? t.profileBalanced : t.profileHigher.replace('{dimensions}', names!)} {t.profileBasis}</p>}
    <div className="profile-layout">
      <svg className="profile-chart" viewBox="0 0 300 285" role="img" aria-label={`${t.profileTitle}: ${description}`}>
        {[25, 50, 75, 100].map(radius => <polygon key={radius} className="profile-grid" points={ring(radius)} />)}
        {categories.map((_, index) => { const [x, y] = point(index, 100); return <line key={index} className="profile-grid" x1="150" y1="145" x2={x} y2={y} />; })}
        <text className="profile-scale" x="154" y="95">50%</text><text className="profile-scale" x="154" y="44">100%</text>
        {complete && <polygon className="profile-shape" points={categories.map((category, index) => point(index, percentages[category]!).join(',')).join(' ')} />}
        {categories.map((category, index) => {
          const [x, y] = point(index, 123);
          const value = percentages[category];
          const [dotX, dotY] = point(index, value ?? 0);
          return <g key={category} aria-hidden="true"><text className="profile-axis" x={x} y={y} textAnchor="middle" dominantBaseline="middle">0{index + 1}</text>{value !== null && <circle className="profile-dot" cx={dotX} cy={dotY} r="4" />}</g>;
        })}
      </svg>
      <ol className="profile-values">{categories.map((category, index) => <li key={category}>
        <span className="profile-label"><span aria-hidden="true">0{index + 1}</span>{t[category]}</span>
        <strong>{percentages[category] === null ? t.na : `${numberFormat(percentages[category]!, language, 0)}%`}</strong>
        <small>{formatScore(result.dimensions[category].finalScore, language)} / {result.dimensions[category].maximum} · {t.coverage}: {numberFormat(result.dimensions[category].coverage, language, 0)}%</small>
      </li>)}</ol>
    </div>
    <p className="small-note">{t.profileNote}</p>
  </section>;
}

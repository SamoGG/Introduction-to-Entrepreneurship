import { useEffect, useState } from 'react';
import { Profile } from './Profile.tsx';
import { categories } from '../data/questions.ts';
import { classificationThresholds, coverageLevel } from '../lib/scoring.ts';
import type { Result, Score } from '../lib/scoring.ts';
import type { Language } from '../lib/storage.ts';
import { formatDate, formatScore, numberFormat, translations } from '../i18n/translations.ts';
import { Icon } from './Icon.tsx';

function CoverageNotice({ score, language }: { score: Score; language: Language }) {
  const t = translations[language];
  const level = coverageLevel(score.coverage);
  if (level === 'full') return null;
  return <p className={`coverage-notice ${level}`}>
    <Icon name="alert" />
    {score.known === 0 ? t.noCoverage : level === 'reduced' ? t.reducedWarning : t.lowWarning}
  </p>;
}

function Calculation({ score, language }: { score: Score; language: Language }) {
  const t = translations[language];
  const proportion = score.known ? numberFormat(score.points / score.known * 100, language) : t.na;
  const [medium, high] = classificationThresholds(score.maximum);
  return <details className="calculation">
    <summary>{t.how}<Icon name="chevron-down" /></summary>
    <div className="calculation-body">
      <dl>
        <div><dt>{t.scoredResponses}</dt><dd>{score.known} / {score.maximum}</dd></div>
        <div><dt>{t.points}</dt><dd>{score.points}</dd></div>
        <div><dt>{t.proportion}</dt><dd>{score.known ? `${score.points} / ${score.known} = ${proportion}%` : t.na}</dd></div>
        <div><dt>{t.normalized}</dt><dd>{score.known ? `${proportion}% × ${score.maximum} ≈ ${formatScore(score.adjusted, language)} / ${score.maximum}` : t.na}</dd></div>
        <div><dt>{t.unknownResponses}</dt><dd>{score.unknown}</dd></div>
        <div><dt>{t.classification}</dt><dd>{score.classification ? t[score.classification] : t.na}</dd></div>
      </dl>
      <p>{t.formulaNote}</p>
      <p>{t.thresholds}: {t.low} &lt; {medium} · {t.medium} ≥ {medium}, &lt; {high} · {t.high} ≥ {high}</p>
      {score.maximum === 54 && <p>{t.scoringRule}</p>}
    </div>
  </details>;
}

function ScoreBar({ score }: { score: Score }) {
  return <div className="score-track" aria-hidden="true"><span style={{ width: `${score.adjusted === null ? 0 : score.adjusted / score.maximum * 100}%` }} /></div>;
}

export function resultSummary(result: Result, language: Language): string {
  const t = translations[language];
  const describe = (name: string, score: Score) => `${name}\n${formatScore(score.adjusted, language)}${score.adjusted === null ? '' : ` / ${score.maximum}`} — ${score.classification ? t[score.classification] : t.na}\n${t.coverage}: ${numberFormat(score.coverage, language, 0)}% (${score.known} / ${score.maximum})`;
  return [t.title,
    describe(t.overall, result.overall),
    `${t.unknownResponses}: ${result.overall.unknown}`,
    ...(result.overall.coverage < 80 ? [result.overall.known === 0 ? t.noCoverage : result.overall.coverage < 60 ? t.lowWarning : t.reducedWarning] : []),
    ...categories.map(category => describe(t[category], result.dimensions[category])), `${t.date}: ${formatDate(result.completedAt, language)}`, t.coverageNote, t.disclaimer,
  ].join('\n\n');
}

export function Results({ result, previous, language, onRetake, onAnnounce }: {
  result: Result; previous: Result | null; language: Language; onRetake: () => void; onAnnounce: (text: string) => void;
}) {
  const t = translations[language];
  const score = result.overall;
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [printFailed, setPrintFailed] = useState(false);
  const [copiedLanguage, setCopiedLanguage] = useState(language);

  useEffect(() => {
    if (copyState !== 'copied') return;
    const timer = window.setTimeout(() => setCopyState('idle'), 2500);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(resultSummary(result, language));
      setCopiedLanguage(language);
      setCopyState('copied');
      onAnnounce(t.copied);
    } catch { setCopyState('failed'); onAnnounce(t.copyFailed); }
  }

  function print() {
    try {
      window.print();
      setPrintFailed(false);
    } catch {
      setPrintFailed(true);
      onAnnounce(t.printFailed);
    }
  }

  function comparisonRow(label: string, before: Score, current: Score) {
    const difference = before.adjusted === null || current.adjusted === null ? null : current.adjusted - before.adjusted;
    return <tr key={label}>
      <th scope="row">{label}</th>
      <td>{formatScore(before.adjusted, language)}<small>{numberFormat(before.coverage, language, 0)}% {t.coverage.toLocaleLowerCase(language)}</small></td>
      <td>{formatScore(current.adjusted, language)}<small>{numberFormat(current.coverage, language, 0)}% {t.coverage.toLocaleLowerCase(language)}</small></td>
      <td>{difference === 0 ? t.noChange : `${difference !== null && difference > 0 ? '+' : ''}${formatScore(difference, language)}`}</td>
    </tr>;
  }

  return <div className="results">
    <header className="page-heading">
      <p className="print-only">{t.title}</p>
      <p className="eyebrow">{t.resultEyebrow}</p>
      <h1 tabIndex={-1} data-page-heading>{t.resultTitle}</h1>
      <p>{t.resultIntro}</p>
      <p className="result-date">{t.date}: {formatDate(result.completedAt, language)}</p>
    </header>

    <section className="overall-card" aria-label={t.overall}>
      <div className="overall-main">
        <p className="eyebrow">{t.overall}</p>
        <div className="overall-score"><strong>{formatScore(score.adjusted, language)}</strong>{score.adjusted !== null && <span>/ 54</span>}</div>
        <span className="classification inverse">{score.classification ? t[score.classification] : t.na}</span>
        <ScoreBar score={score} />
        {score.adjusted !== null && <p className="overall-percent">{numberFormat(score.adjusted / 54 * 100, language, 0)}% {t.scorePercent}</p>}
      </div>
      <div className="overall-coverage">
        <div className="coverage-heading"><span>{t.coverage}</span><strong>{numberFormat(score.coverage, language, 0)}%</strong></div>
        <div className="coverage-track" aria-hidden="true"><span style={{ width: `${score.coverage}%` }} /></div>
        <dl>
          <div><dt>{t.scoredResponses}</dt><dd>{score.known} / 54</dd></div>
          <div><dt>{t.unknown}</dt><dd>{score.unknown}</dd></div>
        </dl>
        <CoverageNotice score={score} language={language} />
      </div>
      <div className="overall-calculation"><Calculation score={score} language={language} /></div>
    </section>
    <div className="result-notes">
      {score.unknown > 0 && score.known > 0 && <p>{t.adjusted}</p>}
      <p>{t.coverageNote}</p>
    </div>

    <Profile result={result} language={language} />

    <div className="section-heading"><h2>{t.dimensions}</h2><p>{t.dimensionsNote}</p></div>
    <div className="dimension-list">
      {categories.map((category, index) => {
        const dimension = result.dimensions[category];
        return <article className="dimension-card" key={category}>
          <div className="dimension-header">
            <div className="dimension-title"><span className="dimension-number" aria-hidden="true">0{index + 1}</span><h3>{t[category]}</h3></div>
            <span className="classification">{dimension.classification ? t[dimension.classification] : t.na}</span>
          </div>
          <div className="dimension-score-row">
            <p className="dimension-score"><strong>{formatScore(dimension.adjusted, language)}</strong>{dimension.adjusted !== null && <span> / {dimension.maximum}</span>}</p>
            <span>{dimension.adjusted === null ? t.na : `${numberFormat(dimension.adjusted / dimension.maximum * 100, language, 0)}%`} <span className="sr-only">{t.scorePercent}</span></span>
          </div>
          <ScoreBar score={dimension} />
          <div className="dimension-coverage"><p>{t.coverage}: <strong>{numberFormat(dimension.coverage, language, 0)}%</strong></p><p>{t.basedOn} {dimension.known} {t.of} {dimension.maximum} {t.scoredResponsesEnd}</p></div>
          <p className="dimension-description">{t[`${category}Description`]}</p>
          <CoverageNotice score={dimension} language={language} />
          <Calculation score={dimension} language={language} />
        </article>;
      })}
    </div>

    {previous && <details className="comparison">
      <summary>{t.previousResult}<Icon name="chevron-down" /></summary>
      <div className="table-container"><table>
        <caption className="sr-only">{t.previousResult}</caption>
        <thead><tr><th scope="col">{t.score}</th><th scope="col">{t.previousValue}</th><th scope="col">{t.currentValue}</th><th scope="col">{t.difference}</th></tr></thead>
        <tbody>{comparisonRow(t.overall, previous.overall, score)}{categories.map(category => comparisonRow(t[category], previous.dimensions[category], result.dimensions[category]))}</tbody>
      </table></div>
      <p>{t.comparisonNote}</p>
    </details>}

    <aside className="disclaimer"><h2>{t.perspective}</h2><p>{t.disclaimer}</p></aside>
    <div className="result-actions no-print">
      <button className="button secondary" onClick={print} aria-describedby="download-hint"><Icon name="download" />{t.download}</button>
      <button className="button secondary" onClick={copy}>{copyState === 'copied' && copiedLanguage === language ? t.copied : t.copy}</button>
      <p id="download-hint" className="small-note">{t.downloadHint}</p>
      <p className="print-status">{printFailed ? t.printFailed : null}</p>
      <div className="copy-status">{copyState === 'copied' && copiedLanguage === language ? t.copied : copyState === 'failed' ? t.copyFailed : ''}</div>
      {copyState === 'failed' && <textarea aria-label={t.copySummary} readOnly value={resultSummary(result, language)} onFocus={event => event.target.select()} rows={12} />}
      <button className="button primary results-retake-action" onClick={onRetake}><Icon name="retake" />{t.retake}</button>
    </div>
  </div>;
}

import { Icon } from './Icon.tsx';
import { QuestionProgress } from './QuestionProgress.tsx';
import { useEffect, useRef, useState } from 'react';
import { categories, questions } from '../data/questions.ts';
import { translations } from '../i18n/translations.ts';
import { quizTranslations } from '../i18n/attributesQuiz.ts';
import { attributeBand, createQuiz, overallBand, scoreQuiz, validQuizAnswers } from '../lib/attributesQuiz.ts';
import type { QuizSession } from '../lib/attributesQuiz.ts';
import type { QuizController } from '../lib/useQuizSession.ts';
import type { Language } from '../lib/storage.ts';

export function AttributesQuiz({ quiz, language, showResults = false, shortcutsEnabled = true }: { quiz: QuizController; language: Language; showResults?: boolean; shortcutsEnabled?: boolean }) {
  const { session, commit, storageError, revision, changedElsewhere, saving } = quiz;
  const [screen, setScreen] = useState<'learn' | 'question' | 'review' | 'results'>(showResults ? 'results' : 'learn');
  useEffect(() => { setScreen(showResults ? 'results' : 'learn'); }, [showResults, revision]);
  const heading = useRef<HTMLHeadingElement>(null);
  const t = translations[language]; const q = quizTranslations[language];
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [screen, session?.currentIndex]);
  const start = () => commit(() => createQuiz(language), () => setScreen('question'));
  const update = (next: QuizSession, after?: () => void) => commit(current => {
    if (!current || current.completed || current !== session) return null;
    return { ...next, language };
  }, after);
  const count = Object.keys(session?.answers ?? {}).length;
  const question = session && questions.find(item => item.id === session.questionOrder[session.currentIndex]);
  const selected = question && session?.answers[question.id];
  const next = () => { if (!session || session.completed || !selected) return; if (session.currentIndex === 53) setScreen('review'); else update({ ...session, currentIndex: session.currentIndex + 1 }); };
  useEffect(() => {
    if (screen !== 'question' || !session || session.completed || !question || !shortcutsEnabled) return;
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat || event.isComposing || event.defaultPrevented || target.isContentEditable || target.closest('button, a, summary, textarea, select, input:not([type="radio"]), dialog')) return;
      if (event.key === 'Enter' && selected) { event.preventDefault(); next(); return; }
      const choice = /^[1-5]$/.test(event.key) ? session!.optionOrder[question!.id][Number(event.key) - 1] : undefined;
      if (choice) { event.preventDefault(); update({ ...session!, answers: { ...session!.answers, [question!.id]: choice } }); }
      if (target.closest('input[type="radio"]')) return;
      if (event.key === 'ArrowLeft' && session!.currentIndex > 0) { event.preventDefault(); update({ ...session!, currentIndex: session!.currentIndex - 1 }); }
      if (event.key === 'ArrowRight' && selected) { event.preventDefault(); next(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const result = session?.completed ? scoreQuiz(session.answers) : null;
  return <div className="attributes-quiz">
    {saving && screen !== 'question' && <p role="status" className="save-note">{q.saving}</p>}
    {changedElsewhere && <p role="status" className="storage-notice">{q.updatedElsewhere}</p>}
    {storageError && <p role="alert" className="storage-notice">{t.storageError}</p>}
    {screen === 'learn' && <>
      <header className="page-heading"><h1 ref={heading} tabIndex={-1} data-page-heading>{q.title}</h1><p>{q.intro}</p></header>
      <div className="attribute-cards learning-cards">{categories.map(c => <article className="attribute-card" key={c}><h2>{t[c]}</h2><p>{q.definitions[c]}</p><ul>{q.traits[c].map(trait => <li key={trait}>{trait}</li>)}</ul></article>)}</div>
      <aside className="attribute-card"><h2>{q.example}</h2><p>{q.exampleText}</p><p><strong>{t.autonomy}</strong> — {q.exampleWhy}</p></aside>
      <p className="quiz-note">{q.note}</p><p>{q.facts}</p>
      {session ? <button className="button primary" onClick={() => setScreen(session.completed ? 'results' : 'question')}>{session.completed ? t.viewResults : q.resume}</button> : <button className="button primary" onClick={start}>{q.start}</button>}
    </>}
    {screen === 'question' && session && !session.completed && question && <>
      <div className="question-topline"><span id="quiz-position" className="eyebrow">{t.question} {session.currentIndex + 1} {t.of} 54</span><button className="text-button" onClick={() => setScreen('review')}>{t.review}</button></div>
      <QuestionProgress answered={count} language={language} />
      <section className="question-card">
        <h1 ref={heading} tabIndex={-1} data-page-heading aria-describedby="quiz-position">{language === 'en' ? question.english : question.greek}</h1>
        <fieldset className="answer-options"><legend>{q.prompt}</legend>{session.optionOrder[question.id].map((c, index) => <label key={c} className={`answer-option ${selected === c ? 'selected' : ''}`}><input type="radio" name="quiz-attribute" value={c} checked={selected === c} onChange={() => update({ ...session, answers: { ...session.answers, [question.id]: c } })} /><span>{t[c]}</span><kbd aria-hidden="true">{index + 1}</kbd></label>)}</fieldset>
        <div className="quiz-actions"><button className="button secondary" disabled={session.currentIndex === 0} onClick={() => update({ ...session, currentIndex: session.currentIndex - 1 })}>{t.previous}</button><button className="button primary" disabled={!selected} onClick={next}>{session.currentIndex === 53 ? t.review : t.next}</button></div>
      </section>
      <p className="keyboard-hint">{t.keyboard} <kbd>1–5</kbd> {q.chooseAttribute} <span>·</span> <kbd>Enter</kbd> {t.keyEnter}</p>
      <p className="save-note" role="status">{storageError ? t.answerNotSaved : saving ? q.saving : selected ? t.answerSaved : t.saved}</p>
    </>}
    {screen === 'review' && session && !session.completed && <>
      <header className="page-heading"><h1 ref={heading} tabIndex={-1} data-page-heading>{t.review}</h1><p>{t.answeredLabel}: {count} / 54 · {q.remaining}: {54 - count}</p></header>
      <nav className="question-grid" aria-label={t.navigator}>{session.questionOrder.map((id, index) => <button key={id} className={session.answers[id] ? 'normal' : 'unanswered'} aria-label={`${t.question} ${index + 1}: ${session.answers[id] ? t.answered : t.unanswered}`} onClick={() => { update({ ...session, currentIndex: index }); setScreen('question'); }}>{index + 1}<small aria-hidden="true">{session.answers[id] ? '✓' : '—'}</small></button>)}</nav>
      <button className="button primary" disabled={count !== 54} onClick={() => { if (!validQuizAnswers(session.answers, true)) return; update({ ...session, completed: true }, () => setScreen('results')); }}>{q.submit}</button>
    </>}
    {screen === 'results' && !result && <section className="page-heading"><h1 ref={heading} tabIndex={-1} data-page-heading>{t.quizResultsNav}</h1><p>{t.noQuizResults}</p><button className="button primary" onClick={() => setScreen(session ? 'question' : 'learn')}>{session ? q.resume : q.learn}</button></section>}
    {screen === 'results' && result && session && <>
      <header className="page-heading"><h1 ref={heading} tabIndex={-1} data-page-heading>{q.results}</h1><p className="quiz-score">{result.correctAnswers} / 54 · {Math.round(result.percentage)}%</p><h2>{q.bands[overallBand(result.percentage)]}</h2><p>{q.correct}: {result.correctAnswers} · {q.incorrect}: {result.incorrectAnswers}</p></header>
      <h2>{q.byAttribute}</h2><div className="attribute-cards">{categories.map(c => { const score = result.byAttribute[c]; return <article className="attribute-card" key={c}><h3>{t[c]}</h3><p>{score.correct} / {score.total} · {Math.round(score.percentage)}%</p><div className="score-track quiz-attribute-progress" role="progressbar" aria-label={t[c]} aria-valuemin={0} aria-valuemax={score.total} aria-valuenow={score.correct} aria-valuetext={`${score.correct} / ${score.total} · ${Math.round(score.percentage)}%`}><span style={{ width: `${score.percentage}%` }} /></div><p>{q.feedback[attributeBand(score.percentage)]}</p></article>; })}</div>
      {result.confusions.length > 0 && <section className="attribute-card"><h2>{q.confusions}</h2>{result.confusions.map(pair => <p key={`${pair.correct}:${pair.selected}`}>{t[pair.correct]} {q.confusedWith} {t[pair.selected]} — {pair.count} {q.times}</p>)}</section>}
      <details className="attribute-card quiz-review"><summary><span><span className="quiz-review-title">{q.reviewIncorrect} ({result.incorrectAnswers})</span><span className="quiz-review-hint quiz-review-expand">{q.expandReview}</span><span className="quiz-review-hint quiz-review-collapse">{q.collapseReview}</span></span><Icon name="chevron-down" /></summary>{result.incorrectAnswers === 0 && <p>{q.perfect}</p>}{session.questionOrder.filter(id => session.answers[id] !== questions.find(item => item.id === id)!.category).map(id => { const item = questions.find(item => item.id === id)!; return <article className="quiz-correction" key={id}><h3>{language === 'en' ? item.english : item.greek}</h3><p>{q.yours}: {t[session.answers[id]!]}</p><p><strong>{q.correctAnswer}: {t[item.category]}</strong></p><p>{q.explanations[item.category]}</p></article>; })}</details>
      <div className="quiz-actions"><button className="button primary" onClick={start}>{q.retake}</button><button className="button secondary" onClick={() => setScreen('learn')}>{q.learn}</button></div>
    </>}
  </div>;
}

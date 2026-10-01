import { useEffect, useRef, useState } from 'react';
import { categories, questions } from '../data/questions.ts';
import { translations } from '../i18n/translations.ts';
import { quizTranslations } from '../i18n/attributesQuiz.ts';
import { attributeBand, createQuiz, loadQuiz, overallBand, quizKey, scoreQuiz } from '../lib/attributesQuiz.ts';
import type { QuizSession } from '../lib/attributesQuiz.ts';
import { saveStored } from '../lib/storage.ts';
import type { Language } from '../lib/storage.ts';

export function AttributesQuiz({ language }: { language: Language }) {
  const [session, setSession] = useState(loadQuiz);
  const [screen, setScreen] = useState<'learn' | 'question' | 'review' | 'results'>('learn');
  const [storageError, setStorageError] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const t = translations[language]; const q = quizTranslations[language];
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [screen, session?.currentIndex]);
  useEffect(() => {
    if (session) setStorageError(!saveStored(quizKey, { ...session, language }));
  }, [session, language]);
  const start = () => { setSession(createQuiz(language)); setScreen('question'); };
  const update = (next: QuizSession) => setSession(next);
  const count = Object.keys(session?.answers ?? {}).length;
  const question = session && questions.find(item => item.id === session.questionOrder[session.currentIndex]);
  const selected = question && session?.answers[question.id];
  const next = () => { if (!session || !selected) return; if (session.currentIndex === 53) setScreen('review'); else update({ ...session, currentIndex: session.currentIndex + 1 }); };
  const result = session?.completed ? scoreQuiz(session.answers) : null;
  return <div className="attributes-quiz">
    {storageError && <p role="alert" className="storage-notice">{t.storageError}</p>}
    {screen === 'learn' && <>
      <header className="page-heading"><h1 ref={heading} tabIndex={-1} data-page-heading>{q.title}</h1><p>{q.intro}</p></header>
      <div className="attribute-cards">{categories.map(c => <article className="attribute-card" key={c}><h2>{t[c]}</h2><p>{q.definitions[c]}</p><ul>{q.traits[c].map(trait => <li key={trait}>{trait}</li>)}</ul></article>)}</div>
      <aside className="attribute-card"><h2>{q.example}</h2><p>{q.exampleText}</p><p><strong>{t.autonomy}</strong> — {q.exampleWhy}</p></aside>
      <p className="quiz-note">{q.note}</p><p>{q.facts}</p>
      {session ? <button className="button primary" onClick={() => setScreen(session.completed ? 'results' : 'question')}>{session.completed ? t.viewResults : q.resume}</button> : <button className="button primary" onClick={start}>{q.start}</button>}
    </>}
    {screen === 'question' && session && question && <>
      <div className="question-topline"><span id="quiz-position">{t.question} {session.currentIndex + 1} {t.of} 54</span><button className="text-button" onClick={() => setScreen('review')}>{t.review}</button></div>
      <div className="progress-track" role="progressbar" aria-label={t.answeredLabel} aria-valuenow={count} aria-valuemin={0} aria-valuemax={54}><span style={{ width: `${count / 54 * 100}%` }} /></div><p>{t.answeredLabel}: {count} / 54</p>
      <section className="question-card" onKeyDown={event => { if (event.key === 'Enter' && selected && !event.repeat && !event.nativeEvent.isComposing && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && (event.target as HTMLElement).matches('input[type="radio"]')) { event.preventDefault(); next(); } }}>
        <h1 ref={heading} tabIndex={-1} data-page-heading aria-describedby="quiz-position">{language === 'en' ? question.english : question.greek}</h1>
        <fieldset className="answer-options"><legend>{q.prompt}</legend>{session.optionOrder[question.id].map(c => <label key={c} className={`answer-option ${selected === c ? 'selected' : ''}`}><input type="radio" name="quiz-attribute" value={c} checked={selected === c} onChange={() => update({ ...session, answers: { ...session.answers, [question.id]: c } })} /><span>{t[c]}</span></label>)}</fieldset>
        <div className="quiz-actions"><button className="button secondary" disabled={session.currentIndex === 0} onClick={() => update({ ...session, currentIndex: session.currentIndex - 1 })}>{t.previous}</button><button className="button primary" disabled={!selected} onClick={next}>{session.currentIndex === 53 ? t.review : t.next}</button></div>
      </section><p className="save-note" role="status">{storageError ? t.answerNotSaved : selected ? t.answerSaved : t.saved}</p>
    </>}
    {screen === 'review' && session && <>
      <header className="page-heading"><h1 ref={heading} tabIndex={-1} data-page-heading>{t.review}</h1><p>{t.answeredLabel}: {count} / 54 · {q.remaining}: {54 - count}</p></header>
      <nav className="question-grid" aria-label={t.navigator}>{session.questionOrder.map((id, index) => <button key={id} className={session.answers[id] ? 'normal' : 'unanswered'} aria-label={`${t.question} ${index + 1}: ${session.answers[id] ? t.answered : t.unanswered}`} onClick={() => { update({ ...session, currentIndex: index }); setScreen('question'); }}>{index + 1}<small aria-hidden="true">{session.answers[id] ? '✓' : '—'}</small></button>)}</nav>
      <button className="button primary" disabled={count !== 54} onClick={() => { if (count !== 54) return; update({ ...session, completed: true }); setScreen('results'); }}>{q.submit}</button>
    </>}
    {screen === 'results' && result && session && <>
      <header className="page-heading"><h1 ref={heading} tabIndex={-1} data-page-heading>{q.results}</h1><p className="quiz-score">{result.correctAnswers} / 54 · {Math.round(result.percentage)}%</p><h2>{q.bands[overallBand(result.percentage)]}</h2><p>{q.correct}: {result.correctAnswers} · {q.incorrect}: {result.incorrectAnswers}</p></header>
      <h2>{q.byAttribute}</h2><div className="attribute-cards">{categories.map(c => { const score = result.byAttribute[c]; return <article className="attribute-card" key={c}><h3>{t[c]}</h3><p>{score.correct} / {score.total} · {Math.round(score.percentage)}%</p><p>{q.feedback[attributeBand(score.percentage)]}</p></article>; })}</div>
      {result.confusions.length > 0 && <section className="attribute-card"><h2>{q.confusions}</h2>{result.confusions.map(pair => <p key={`${pair.correct}:${pair.selected}`}>{t[pair.correct]} {q.confusedWith} {t[pair.selected]} — {pair.count} {q.times}</p>)}</section>}
      <details className="attribute-card"><summary>{q.reviewIncorrect} ({result.incorrectAnswers})</summary>{result.incorrectAnswers === 0 && <p>{q.perfect}</p>}{session.questionOrder.filter(id => session.answers[id] !== questions.find(item => item.id === id)!.category).map(id => { const item = questions.find(item => item.id === id)!; return <article className="quiz-correction" key={id}><h3>{language === 'en' ? item.english : item.greek}</h3><p>{q.yours}: {t[session.answers[id]!]}</p><p><strong>{q.correctAnswer}: {t[item.category]}</strong></p><p>{q.explanations[item.category]}</p></article>; })}</details>
      <div className="quiz-actions"><button className="button primary" onClick={start}>{q.retake}</button><button className="button secondary" onClick={() => setScreen('learn')}>{q.learn}</button></div>
    </>}
  </div>;
}

import { useEffect, useState } from 'react';
import { categories, questions } from './data/questions.ts';
import { translations } from './i18n/translations.ts';
import { calculateResult } from './lib/scoring.ts';
import type { Answer } from './lib/scoring.ts';
import { shuffleQuestions } from './lib/shuffle.ts';
import { deleteTestData, keys, loadPreferences, loadState, saveStored } from './lib/storage.ts';
import type { Language, TestSession } from './lib/storage.ts';
import { Modal } from './components/Modal.tsx';
import { preferencesKey } from './lib/preferences.ts';
import type { Preferences } from './lib/preferences.ts';
import { filterQuestions } from './lib/profile.ts';
import type { ReviewFilter } from './lib/profile.ts';
import { Results } from './components/Results.tsx';
import { FlagIcon, Icon } from './components/Icon.tsx';

type Panel = 'restart' | 'delete' | 'privacy' | 'about' | 'preferences';
type Screen = 'welcome' | 'question' | 'review' | 'results';
const answerChoices: Answer[] = ['agree', 'disagree', 'unknown'];

export default function App() {
  const [initial] = useState(loadState);
  const [session, setSession] = useState(initial.session);
  const [current, setCurrent] = useState(() => initial.current ?? (initial.session?.completed ? calculateResult(initial.session.answers) : null));
  const [previous, setPrevious] = useState(initial.previous);
  const [language, setLanguage] = useState<Language>(initial.language);
  const [screen, setScreen] = useState<Screen>('welcome');
  const [fromReview, setFromReview] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [preferences, setPreferences] = useState(loadPreferences);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [answerStatus, setAnswerStatus] = useState<'answerSaved' | 'answerUpdated' | 'answerNotSaved' | null>(null);
  const [announcement, setAnnouncement] = useState({ text: '', sequence: 0 });
  const [deleteError, setDeleteError] = useState(false);
  const announce = (text: string) => setAnnouncement(previous => ({ text, sequence: previous.sequence + 1 }));
  const t = translations[language];
  const answeredCount = Object.keys(session?.answers ?? {}).length;
  const activeId = session?.questionOrder[session.currentIndex];
  const question = questions.find(item => item.id === activeId);
  const selected = activeId ? session?.answers[activeId] : undefined;

  function persist(key: string, value: unknown) {
    const success = saveStored(key, value);
    if (!success) setStorageError(true);
    return success;
  }

  function updateSession(next: TestSession) {
    setSession(next);
    return persist(keys.session, next);
  }

  function switchLanguage(next: Language) {
    setLanguage(next);
    persist(keys.language, next);
    if (session) updateSession({ ...session, language: next });
  }

  function startNew() {
    // Move the last completed result only once. Restarting an unfinished
    // retake must not erase its immediately previous completed result.
    if (current) {
      setPrevious(current);
      persist(keys.previous, current);
      setCurrent(null);
      persist(keys.current, null);
    }
    let order = shuffleQuestions();
    if (session && order.every((id, index) => id === session.questionOrder[index])) order = order.reverse();
    updateSession({ version: 2, questionOrder: order, answers: {}, currentIndex: 0, language, completed: false });
    persist(keys.language, language);
    setFromReview(false);
    setReviewFilter('all');
    setAnswerStatus(null);
    setScreen('question');
  }

  function requestNew() {
    if (session && !session.completed) setPanel('restart');
    else startNew();
  }

  function choose(answer: Answer) {
    if (!session || !activeId || session.completed) return;
    const changed = session.answers[activeId] !== undefined;
    const saved = updateSession({ ...session, answers: { ...session.answers, [activeId]: answer } });
    const status = saved ? changed ? 'answerUpdated' : 'answerSaved' : 'answerNotSaved';
    setAnswerStatus(status);
    announce(`${t[answer]} ${t.selectedLabel}. ${t[status]}`);
  }

  function move(offset: number) {
    if (!session || (offset > 0 && !selected)) return;
    if (session.currentIndex + offset >= 54) { setScreen('review'); return; }
    if (session.currentIndex + offset < 0) return;
    updateSession({ ...session, currentIndex: session.currentIndex + offset });
  }

  function finish() {
    if (!session || answeredCount !== 54) return;
    const result = calculateResult(session.answers);
    setCurrent(result);
    persist(keys.current, result);
    updateSession({ ...session, completed: true });
    setScreen('results');
    announce(t.resultsCalculated);
  }

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t.title;
  }, [language, t.title]);

  useEffect(() => {
    const heading = document.querySelector<HTMLElement>('[data-page-heading]');
    heading?.focus({ preventScroll: true });
    if (heading && heading.getBoundingClientRect().top < 0) heading.scrollIntoView({ block: 'start' });
    setAnswerStatus(null);
  }, [screen, session?.currentIndex]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = preferences.theme;
    root.dataset.largerText = String(preferences.largerText);
    root.dataset.highContrast = String(preferences.highContrast);
    root.dataset.reduceMotion = String(preferences.reduceMotion);
  }, [preferences]);

  function changePreference(next: Preferences) {
    setPreferences(next);
    persist(preferencesKey, next);
  }

  function clearData() {
    if (!deleteTestData()) { setDeleteError(true); return; }
    setSession(null); setCurrent(null); setPrevious(null);
    setFromReview(false); setReviewFilter('all'); setAnswerStatus(null);
    setDeleteError(false); setPanel(null); setScreen('welcome');
    announce(t.dataDeleted);
  }

  useEffect(() => {
    if (screen !== 'question' || panel) return;
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat ||
          event.isComposing || event.defaultPrevented || target.isContentEditable || target.closest('button, a, summary, textarea, select, input:not([type="radio"]), dialog')) return;
      if (event.key === 'Enter' && selected && !target.closest('button, a, summary')) {
        event.preventDefault();
        if (fromReview) setScreen('review');
        else move(1);
        return;
      }
      // Native radio arrow keys remain available for assistive technology.
      if (target.closest('input[type="radio"]')) return;
      const answer = answerChoices[Number(event.key) - 1];
      if (answer) { event.preventDefault(); choose(answer); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
      if (event.key === 'ArrowRight' && selected) { event.preventDefault(); move(1); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const counts = Object.values(session?.answers ?? {}).reduce((totals, answer) => {
    if (answer) totals[answer]++;
    return totals;
  }, { agree: 0, disagree: 0, unknown: 0 });

  const visibleQuestions = session ? filterQuestions(session.questionOrder, session.answers, reviewFilter) : [];
  const hasTestData = Boolean(session || current || previous);
  const openPanel = (next: Panel) => { setDeleteError(false); setPanel(next); };
  const panelTitle = panel === 'restart' ? t.restartTitle : panel === 'delete' ? t.deleteTitle : panel === 'privacy' ? t.privacyTitle : panel === 'about' ? t.aboutTitle : t.preferences;

  return <>
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true"><span key={announcement.sequence}>{announcement.text}</span></div>
    <a href="#main" className="skip-link">{t.skip}</a>
    <header className="site-header no-print">
      <button className="brand" onClick={() => setScreen('welcome')} aria-label={t.title}>
        <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
        <span>{t.brand}<small>{t.brandNote}</small></span>
      </button>
      <div className="language-switch" role="group" aria-label={t.language}>
        <button lang="en" aria-label="English" aria-pressed={language === 'en'} onClick={() => switchLanguage('en')}><FlagIcon language="en" /><span>EN</span></button>
        <span aria-hidden="true" />
        <button lang="el" aria-label="Ελληνικά" aria-pressed={language === 'el'} onClick={() => switchLanguage('el')}><FlagIcon language="el" /><span>ΕΛ</span></button>
      </div>
    </header>

    <main id="main" className={`main-content ${screen}`}>
      {storageError && <p className="storage-notice" role="alert">{t.storageError}</p>}
      {screen === 'welcome' && <>
        <section className="welcome-hero">
          <p className="eyebrow"><span aria-hidden="true" className="tiny-line" />{t.eyebrow}</p>
          <h1 tabIndex={-1} data-page-heading><span className="test-name">{t.title}</span>{t.welcomeTitle}<br /><em>{t.welcomeAccent}</em></h1>
          <p className="hero-description">{t.introduction}</p>
          <div className="test-facts"><span><Icon name="list" />{t.statements}</span><span><Icon name="clock" />{t.minutes}</span><span><Icon name="lock" />{t.private}</span></div>
        </section>

        <section className="welcome-card">
          <div className="card-label"><span className="eyebrow">{t.before}</span><Icon name="sparkle" className="small-flower" /></div>
          <ol className="instructions">
            {(['One', 'Two', 'Three'] as const).map((number, index) => <li key={number}><span className="instruction-number" aria-hidden="true">0{index + 1}</span><div><h2>{t[`instruction${number}`]}</h2><p>{t[`instruction${number}Detail`]}</p></div></li>)}
          </ol>
          {session && !session.completed ? <div className="resume-block">
            <h2>{t.resumeTitle}</h2><p>{answeredCount} / 54 {t.answered}. {t.resumeText}</p>
            <button className="button primary start-button" onClick={() => { setFromReview(false); setScreen('question'); }}>{t.continue}<Icon name="arrow-right" /></button>
            <button className="text-button new-test" onClick={requestNew}>{t.newTest}</button>
          </div> : <>
            <button className="button primary start-button" onClick={current ? () => setScreen('results') : startNew}>{current ? t.viewResults : t.start}<Icon name="arrow-right" /></button>
            {current && <button className="button secondary completed-retake" onClick={requestNew}>{t.retake}</button>}
          </>}
          <p className="save-note"><span className="save-dot" aria-hidden="true" />{storageError ? t.storageError : t.saved}</p>
        </section>

        <section className="framework"><h2>{t.framework}</h2><div className="dimension-tags">{categories.map(category => <span key={category}>{t[`${category}Short`]}</span>)}</div><p>{t.frameworkNote}</p></section>
      </>}

      {screen === 'question' && session && question && <>
        <div className="question-topline"><span id="question-position" className="eyebrow">{t.question} {session.currentIndex + 1} {t.of} 54</span><button className="text-button" onClick={() => setScreen('review')}>{fromReview ? t.backReview : t.review}<Icon name="external" /></button></div>
        <div className="progress-track" role="progressbar" aria-label={t.answeredLabel} aria-valuetext={`${answeredCount} ${t.of} 54`} aria-valuenow={answeredCount} aria-valuemin={0} aria-valuemax={54}><span style={{ width: `${answeredCount / 54 * 100}%` }} /></div>
        <div className="progress-caption"><span>{t.answeredLabel} {answeredCount} / 54</span><span>{Math.round(answeredCount / 54 * 100)}% {t.complete}</span></div>
        <section className="question-card">
          <p className="question-intro">{t.questionInstruction}</p>
          <h1 id="question-text" aria-describedby="question-position" tabIndex={-1} data-page-heading>{language === 'en' ? question.english : question.greek}</h1>
          <fieldset className="answer-options" aria-labelledby="question-text">
            <legend className="sr-only">{t.questionInstruction}</legend>
            {answerChoices.map((answer, index) => <label key={answer} className={`answer-option ${selected === answer ? 'selected' : ''}`}>
              <input type="radio" name={`response-${session.currentIndex}`} value={answer} checked={selected === answer} onChange={() => choose(answer)} />
              <span>{t[answer]}</span><kbd aria-hidden="true">{index + 1}</kbd>
            </label>)}
          </fieldset>
          <p className="answer-feedback">{answerStatus ? t[answerStatus] : '\u00a0'}</p>
        </section>
          <div className="question-navigation"><button className="button secondary" disabled={session.currentIndex === 0} onClick={() => move(-1)}><Icon name="arrow-left" />{t.previous}</button><button className="button primary" disabled={!selected} onClick={() => fromReview ? setScreen('review') : move(1)}>{fromReview ? t.backReview : session.currentIndex === 53 ? t.review : t.next}<Icon name="arrow-right" /></button></div>
        <p className="keyboard-hint">{t.keyboard} <kbd>1</kbd> {t.keyAgree} <span>·</span> <kbd>2</kbd> {t.keyDisagree} <span>·</span> <kbd>3</kbd> {t.keyUnknown} <span>·</span> <kbd>Enter</kbd> {t.keyEnter}</p>
        <div className="session-footer"><p className="save-note"><span className="save-dot" aria-hidden="true" />{storageError ? t.storageError : t.saved}</p><button className="text-button subdued" onClick={requestNew}>{t.restart}</button></div>
      </>}

      {screen === 'review' && session && <>
        <header className="page-heading"><p className="eyebrow">{t.reviewEyebrow}</p><h1 tabIndex={-1} data-page-heading>{t.reviewTitle}</h1><p>{t.reviewText}</p></header>
        <section className="review-card">
          <div className="review-total"><h2>{t.totalQuestions}</h2><strong>54</strong></div>
          <dl className="review-counts">{answerChoices.map(answer => <div key={answer}><dt>{t[answer]}</dt><dd>{counts[answer]}</dd></div>)}<div><dt>{t.unanswered}</dt><dd>{54 - answeredCount}</dd></div></dl>
          <div className="navigator-legend"><span><i className="normal" aria-hidden="true"><Icon name="check" /></i>{t.normalResponse}</span><span><i className="unknown" aria-hidden="true"><Icon name="help" /></i>{t.unknown}</span><span><i className="unanswered" aria-hidden="true"><Icon name="minus" /></i>{t.unanswered}</span></div>
          <div className="review-filters" role="group" aria-label={t.reviewFilters}>
            {(['all', 'unknown', 'unanswered'] as const).map(filter => <button key={filter} aria-pressed={reviewFilter === filter} onClick={() => {
              setReviewFilter(filter); announce(`${filterQuestions(session.questionOrder, session.answers, filter).length} ${t.questionsShown}`);
            }}>{t[`${filter}Filter`]} <span>{filter === 'all' ? 54 : filter === 'unknown' ? counts.unknown : 54 - answeredCount}</span></button>)}
          </div>
          {visibleQuestions.length === 0 && <p className="empty-filter">{t.emptyFilter}</p>}
          <nav className="question-grid" aria-label={t.navigator}>{visibleQuestions.map(({ id, index }) => {
            const answer = session.answers[id];
            return <button key={id} className={answer === 'unknown' ? 'unknown' : answer ? 'normal' : 'unanswered'} aria-label={`${t.question} ${index + 1}: ${answer ? t[answer] : t.unanswered}`} onClick={() => { updateSession({ ...session, currentIndex: index }); setFromReview(true); setScreen('question'); }}>{index + 1}<small aria-hidden="true">{answer === 'unknown' ? <Icon name="help" /> : answer ? <Icon name="check" /> : <Icon name="minus" />}</small></button>;
          })}</nav>
          <p className={`review-readiness ${answeredCount === 54 ? 'ready' : ''}`}>{answeredCount === 54 ? t.ready : t.remaining}</p>
          <button className="button primary calculate-button" disabled={answeredCount !== 54} onClick={finish}>{t.calculate}<Icon name="arrow-right" /></button>
        </section>
        <div className="session-footer"><p className="save-note"><span className="save-dot" aria-hidden="true" />{storageError ? t.storageError : t.saved}</p><button className="text-button subdued" onClick={requestNew}>{t.restart}</button></div>
      </>}

      {screen === 'results' && current && <Results result={current} previous={previous} language={language} onRetake={startNew} onAnnounce={announce} />}
    </main>

    <footer className="site-footer no-print">
      <div className="footer-privacy"><Icon name="lock" className="footer-lock" /><p>{t.privacy}</p></div>
      <nav aria-label={t.preferences} className="footer-links">
        <button className="text-button" onClick={() => openPanel('preferences')}>{t.preferences}</button>
        <button className="text-button" onClick={() => openPanel('privacy')}>{t.privacyTitle}</button>
        <button className="text-button" onClick={() => openPanel('about')}>{t.aboutTitle}</button>
        {hasTestData && <button className="text-button" onClick={() => openPanel('delete')}>{t.deleteData}</button>}
      </nav>
    </footer>
    {panel && <Modal title={panelTitle} closeLabel={t.close} onClose={() => setPanel(null)}>
      {panel === 'preferences' ? <div className="preferences-panel">
        <fieldset><legend>{t.theme}</legend><div className="theme-options">
          {(['system', 'light', 'dark'] as const).map(theme => <label key={theme}><input type="radio" name="theme" checked={preferences.theme === theme} onChange={() => changePreference({ ...preferences, theme })} />{t[theme]}</label>)}
        </div></fieldset>
        {(['largerText', 'highContrast', 'reduceMotion'] as const).map(key => <label className="preference-option" key={key}><input type="checkbox" checked={preferences[key]} onChange={event => changePreference({ ...preferences, [key]: event.target.checked })} />{t[key]}</label>)}
      </div> : panel === 'privacy' ? <div className="info-panel"><p>{t.privacyBody}</p><p>{t.privacyExtra}</p></div>
        : panel === 'about' ? <div className="info-panel"><p>{t.aboutBody}</p><p>{t.aboutScoring}</p><p>{t.disclaimer}</p></div>
        : <>
          <p>{panel === 'restart' ? t.restartMessage : t.deleteMessage}</p>
          {deleteError && <p role="alert" className="delete-error">{t.deleteFailed}</p>}
          <div className="dialog-actions">
            <button className="button secondary" onClick={() => setPanel(null)}>{t.cancelAction}</button>
            <button className="button destructive" onClick={() => { if (panel === 'restart') { setPanel(null); startNew(); } else clearData(); }}>{panel === 'restart' ? t.confirmRestart : t.deleteConfirm}</button>
          </div>
        </>}
    </Modal>}
  </>;
}

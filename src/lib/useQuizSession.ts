import { useEffect, useRef, useState } from 'react';
import { parseQuiz, quizKey, validQuizSession } from './attributesQuiz.ts';
import type { QuizSession } from './attributesQuiz.ts';
import type { Language } from './storage.ts';

function readSnapshot() {
  try { return { raw: localStorage.getItem(quizKey), available: true }; }
  catch { return { raw: null, available: false }; }
}

// Owned by App so browser-storage failures do not discard progress on tab navigation.
export function useQuizSession(language: Language) {
  const [initial] = useState(readSnapshot);
  const [session, setSession] = useState(() => parseQuiz(initial.raw));
  const sessionRef = useRef(session);
  const snapshot = useRef(initial);
  const [storageError, setStorageError] = useState(!initial.available);
  const generation = useRef(0);
  const [revision, setRevision] = useState(0);
  const [pendingWrites, setPendingWrites] = useState(0);
  const [changedElsewhere, setChangedElsewhere] = useState(false);

  function refresh(latest: ReturnType<typeof readSnapshot>) {
    if (!latest.available) { setStorageError(true); return; }
    if (latest.raw === snapshot.current.raw) return;
    generation.current++;
    snapshot.current = latest;
    sessionRef.current = parseQuiz(latest.raw);
    setSession(sessionRef.current);
    setChangedElsewhere(true);
    setRevision(value => value + 1);
  }

  function commit(change: (current: QuizSession | null) => QuizSession | null, after?: () => void) {
    const next = change(sessionRef.current);
    if (!next || !validQuizSession(next)) return;
    const expectedGeneration = generation.current;
    setPendingWrites(count => count + 1);
    // Respond immediately to rapid keyboard input; persistence is serialized separately.
    sessionRef.current = next;
    setSession(next);
    setChangedElsewhere(false);
    after?.();
    const run = () => {
      if (generation.current !== expectedGeneration) return;
      const latest = readSnapshot();
      // Compare inside the cross-tab lock. A remote change cancels pending local writes.
      if (latest.available && latest.raw !== snapshot.current.raw) { refresh(latest); return; }
      let saved = false;
      const raw = JSON.stringify(next);
      try { localStorage.setItem(quizKey, raw); saved = true; } catch { /* Keep the usable in-memory attempt. */ }
      if (saved) snapshot.current = { raw, available: true };
      setStorageError(!saved);
    };
    if (navigator.locks) void navigator.locks.request('attributes-quiz-data', run)
      .catch(() => setStorageError(true))
      .finally(() => setPendingWrites(count => count - 1));
    else { try { run(); } finally { setPendingWrites(count => count - 1); } }
  }

  async function clear(): Promise<boolean> {
    // Cancel queued writes so a pending answer cannot recreate deleted data.
    generation.current++;
    const run = () => {
      localStorage.removeItem(quizKey);
      snapshot.current = { raw: null, available: true };
      sessionRef.current = null;
      setSession(null);
      setStorageError(false);
      setChangedElsewhere(false);
      setRevision(value => value + 1);
    };
    try {
      if (navigator.locks) await navigator.locks.request('attributes-quiz-data', run);
      else run();
      return true;
    } catch { setStorageError(true); return false; }
  }

  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.key === quizKey || event.key === null) refresh(readSnapshot());
    };
    const focused = () => refresh(readSnapshot());
    window.addEventListener('storage', changed);
    window.addEventListener('focus', focused);
    return () => { window.removeEventListener('storage', changed); window.removeEventListener('focus', focused); };
  }, []);

  useEffect(() => {
    if (sessionRef.current && sessionRef.current.language !== language) {
      commit(current => current ? { ...current, language } : null);
    }
  }, [language]);

  return { session, commit, clear, storageError, revision, changedElsewhere, saving: pendingWrites > 0 };
}
export type QuizController = ReturnType<typeof useQuizSession>;

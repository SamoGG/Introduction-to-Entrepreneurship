import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

// Native dialog supplies modal semantics and Escape handling. Tab wrapping
// keeps keyboard focus inside the panel even at browser-toolbar boundaries.
// Restore the opener when it survives the action; otherwise focus the new page.
export function Modal({ title, children, onClose, closeLabel }: {
  title: string; children: ReactNode; onClose: () => void; closeLabel: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    opener.current = document.activeElement as HTMLElement;
    const dialog = ref.current!;
    dialog.showModal();
    return () => {
      dialog.close();
      const target = opener.current?.isConnected ? opener.current : document.querySelector<HTMLElement>('[data-page-heading]');
      target?.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={ref} className="confirm-dialog" aria-labelledby="modal-title"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const elements = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')]
        .filter(element => element.getClientRects().length > 0);
      const first = elements[0];
      const last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
    <header className="modal-heading"><h2 id="modal-title">{title}</h2>
      <button className="close-button" onClick={onClose} aria-label={closeLabel} autoFocus>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
      </button>
    </header>
    {children}
  </dialog>;
}

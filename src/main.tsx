import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { questions, validateQuestions } from './data/questions.ts';
import { translations } from './i18n/translations.ts';
import './styles.css';

const root = createRoot(document.getElementById('root')!);
try {
  validateQuestions(questions);
  root.render(<StrictMode><App /></StrictMode>);
} catch (error) {
  console.error(error);
  root.render(<main className="configuration-error" role="alert">
    <h1>{translations.en.errorTitle} / <span lang="el">{translations.el.errorTitle}</span></h1>
    <p>{translations.en.errorText}</p>
    <p lang="el">{translations.el.errorText}</p>
  </main>);
}

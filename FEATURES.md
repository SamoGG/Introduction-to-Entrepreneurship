# Application

This application provides a GET2 self-reflection questionnaire and a separate educational quiz about the framework's attributes. It uses React 19, TypeScript and Vite, with component state for navigation rather than URL routing. `App.tsx` owns the GET2 session and preferences; `useQuizSession` owns the independent Attributes Quiz session. Scoring, validation, persistence and translation dictionaries are separate modules.

English and Greek are available throughout the interface. A saved language takes priority over the session language and browser-language fallback. Switching language preserves answers and question order. Dates and GET2 numeric summaries use locale-aware formatting.

The header provides GET2 Test, Attributes Quiz and a Results menu with separate destinations for both activities. Footer dialogs provide appearance/accessibility preferences, privacy information, About and deletion of saved activity data. Preferences include system/light/dark theme, larger text, high contrast and reduced motion.

Accessibility includes a skip link, semantic landmarks and headings, native buttons and radio groups, visible focus indicators, live status messages, answer progress, keyboard shortcuts and focus management when questions/screens change. Dialogs trap focus, support Escape and restore focus to the opener. Responsive layouts support narrow screens; print styles provide a GET2 result view.

Storage is local to the browser, with no application backend, accounts, cookies, analytics or tracking. Storage failures are reported and in-memory progress remains usable. The privacy dialog distinguishes application data handling from possible technical request logging by the hosting provider.

GET/GET2 research is attributed to Sally Caird and Cliff Johnson in About and in the quiz learning area. The linked source is Sally Caird (2013), “General measure of Enterprising Tendency test”, at The Open University's Open Research Online: <https://oro.open.ac.uk/5393/>. The reference explicitly identifies this application as an independent implementation. It is separate from footer implementation credits to Samuel Gabriel Galgóci, Juraj Budinský and Justinas Jankauskas and the disclosure that development used AI assistance.

# GET2 Test

The questionnaire contains 54 statements with permanent original IDs. Users select Agree, Disagree or I don't know. Presentation order is randomized; the shuffle avoids three consecutive statements from the same category. Original question numbering appears separately from the current presentation position.

Answers and the current position autosave. Returning users can continue an unfinished attempt. Selecting an answer does not advance automatically. Number keys 1–3 select responses; Enter advances after selection. Left/right arrows navigate when appropriate. Native radio arrow-key behavior is preserved, and shortcuts are suppressed in dialogs, editable controls and other interactive contexts.

The review screen shows response counts, completion readiness and a question navigator. Filters show all questions, unknown responses or unanswered items. Users can revisit and edit answers; calculation requires all 54 responses, including explicit unknowns.

The original scoring key is based on permanent IDs: Agree earns one point on even IDs and Disagree earns one point on odd IDs. Other responses earn no points. “I don't know” counts toward completion, earns no points and reduces response coverage. The maximum score remains 54; there is no prorating. Response coverage is definite Agree/Disagree answers divided by the number of statements.

The five dimensions are:

| Dimension | Statements | Meaning |
| --- | ---: | --- |
| Need for Achievement | 12 | Challenging goals, persistence, responsibility and performance feedback |
| Need for Autonomy | 6 | Independence and control over decisions and working methods |
| Creative Tendency | 12 | Imagination, curiosity, ideas and unconventional approaches |
| Calculated Risk-Taking | 12 | Evaluating uncertain opportunities and their likely consequences |
| Internal Locus of Control | 12 | Connecting outcomes with personal actions, decisions and effort |

Restarting an unfinished GET2 test requires confirmation and clears its answers with a new order. Retaking a completed test preserves that result as the previous result. Restarting an unfinished retake does not replace the previous completed result.

# Attributes Quiz

This is an educational classification exercise, not an assessment of the user's personality or entrepreneurial tendency. Its learning screen explains the five attributes, lists typical traits and gives a practice example. Below the five cards, a “More in-depth explanations of the five attributes” link opens <http://www.get2test.net/index.html#enterprisingPotential>, using the same destination previously linked from the GET2 welcome screen. The duplicate welcome-screen dimensions section has been removed. A shared source area after the cards links to the original GET2 resource and explains that these characteristics are part of the GET/GET2 framework, not a definitive psychological model.

The same 54 statements are presented in randomized order. Each statement has five attribute options, with a randomized option order saved separately for every question. Users identify the intended category, including when a statement is phrased negatively.

Beside the quiz start/continue/retake buttons, the learning page offers “Show instant feedback”, OFF by default. A localized tooltip explains the submit-and-review flow on hover or keyboard focus; a help button also makes it accessible on touch devices. Escape dismisses the tooltip:

- **Normal mode:** selecting an attribute reveals no correctness. Users move on with Next and receive feedback after submitting.
- **Instant-feedback mode:** pick an option, then activate **Submit answer** (or press Enter) to save and reveal the result for that question. Before submission, the choice can be changed and no correctness is shown. After submission, the answer is locked: the selected radio retains the user's actual answer, a wrong choice is marked “Your answer — incorrect”, and the correct option is highlighted and labeled “Correct answer”. The explanatory sentence appears in a polite, atomic status region. Next becomes available after a 700 millisecond guard and advances only when activated. Returning to a submitted question restores its feedback and locked answer. Normal-mode answers remain editable.

Unsubmitted choices are temporary in-memory drafts and do not count toward completion; reloading discards them. Submitted answers use the existing saved answers map, so no additional storage schema is needed. Existing saved instant-feedback answers are treated as submitted because their feedback was already revealed by the previous implementation.

Mode is fixed for an unfinished attempt, with its checkbox shown disabled on the learning page. The selected mode is retained for retakes; returning to the learning page after completion allows choosing the next attempt's mode. Version 2 sessions persist `instantFeedback` alongside question order, option orders, answers, position, language and completion. Valid version 1 sessions migrate in memory to version 2 with feedback OFF and save in the new format on the next change. Corrupt or unsupported sessions are rejected safely.

Quiz progress autosaves independently of GET2. Resume restores both orders and the mode. Keys 1–5 select displayed attribute options before submission; Enter submits a draft or advances after feedback. Navigation arrows respect the submission and feedback guard. Review provides a question navigator and remaining count; all 54 answers are required for submission. Retaking resets quiz answers and randomizes both orders without changing GET2 data.

# Results

## GET2 results

GET2 results show the total score out of 54, percentage of the maximum, classification and response coverage. Each dimension shows its raw score, percentage, classification, coverage and explanatory text. Expandable calculation details expose counts and thresholds.

Existing classification thresholds remain unchanged: overall medium begins at 27 and high at 44; autonomy medium begins at 3 and high at 4; other dimensions medium begins at 7 and high at 10. With no definite responses, classification is unavailable while raw score remains zero. Coverage of 60–79% produces a reduced-coverage notice; below 60% produces a low-coverage notice.

A profile compares dimensions on a common percentage scale and distinguishes dimensions without definite responses. Its text summary uses dimensions with at least 60% coverage. If a previous completed result exists, a comparison table includes score differences and coverage for the total and each dimension.

Users can copy a localized text summary or open the browser print dialog to print/save as PDF. Clipboard failure provides a selectable text fallback. Results include reflection/interpretation disclaimers and do not claim to diagnose personality or determine ability.

## Attributes Quiz results

Results prominently display the overall understanding score out of 100, with the raw correct count out of 54 underneath. Correct and incorrect counts are also shown.

`normalized total score = correct answers / 54 × 100`

`scoreQuiz.totalScore` preserves the unrounded value; `percentage` is the same value retained for compatibility. The display rounds to a whole number. The five attribute percentages are **NOT simply averaged**: autonomy has six statements and the other attributes have twelve, so equal weighting of dimension percentages would distort the question-level result.

Qualitative bands use the unrounded normalized score: at least 90 excellent, at least 80 very good, at least 70 good, at least 60 developing, otherwise review recommended. Per-attribute results preserve correct counts, actual category denominators, percentages, progress bars and feedback bands (90, 70 and 50 boundaries).

Confusion analysis reports up to two most frequent directional category confusions, each occurring at least twice. An expandable incorrect-answer review shows the statement, selected answer, correct category and explanatory sentence. A perfect attempt shows that there are no incorrect answers. These calculations are identical in normal and instant-feedback mode, though feedback mode supports learning during the attempt.

# Other

## Data stored locally

| Key | Persisted data |
| --- | --- |
| `get2-active-session` | GET2 question order, answers, position, language and completion (version 2) |
| `get2-current-result` | Current GET2 answers, scores and completion timestamp (version 4) |
| `get2-previous-result` | Previous completed GET2 result |
| `attributes-quiz-session` | Quiz orders, answers, position, language, completion and feedback mode (version 2) |
| `get2-language` | Selected interface language |
| `get2-preferences` | Theme and accessibility preferences (version 1) |

Deletion requires confirmation and removes GET2 and quiz data while retaining language and appearance/accessibility preferences. Browser site-data controls can remove all data. Data is specific to the browser/device and may be lost when browser storage is cleared. There is no cross-device synchronization.

The app responds to browser storage changes across tabs. Quiz persistence serializes writes through Web Locks where supported, checks snapshots to detect competing changes and cancels pending writes after deletion or a remote change. It also refreshes on focus. Without Web Locks, quiz writes use the synchronous fallback; this is not a server synchronization system.

English and Greek translation dictionaries cover controls, results, explanations, dialogs, source references and accessible labels. Original author names, GET2 and the cited publication's formal English title remain proper names. Questionnaire statements and category mappings are shared by both activities and were not changed for these features.

Source links use readable localized text without a parenthetical new-tab notice, and use `target="_blank"` with `rel="noopener noreferrer"`. Following a link visits an external site; that site's behavior is outside the application's storage/privacy controls.

Design constraints: no backend, accounts, analytics or tracking; no changes to established GET2 scoring or mappings; no definitive psychological interpretation; no claim of institutional endorsement. Source attribution does not establish a questionnaire reuse license. Deployment contact information and licensing verification remain existing project follow-up items in source comments.

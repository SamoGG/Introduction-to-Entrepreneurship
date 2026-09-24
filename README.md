# Entrepreneurial Tendency Test

A small, static React + TypeScript application in English and Greek. Responses and the immediately previous result stay in localStorage on the participant’s device. No backend, accounts, cookies, analytics, external fonts, or runtime content requests.

## Run

### On a Mac without Node.js: Dev Container

The included dev container provides Node.js 22 and npm. Your Mac only needs Docker Desktop, VS Code, and Microsoft's [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).

1. Start Docker Desktop and wait for its engine to be running.
2. Open this project folder in VS Code.
3. Press **Command+Shift+P**, then select **Dev Containers: Reopen in Container**.
4. Wait for the first setup to finish. It downloads the container image and installs the locked dependencies automatically with `npm ci`.
5. Open a terminal in the container (**Terminal → New Terminal**) and run:

   ```sh
   npm run dev
   ```

Open **http://localhost:5173** on your Mac. VS Code forwards the container's port; if that port is already occupied, use the address shown in VS Code's **Ports** tab. Vite's existing localhost binding works with this forwarding.

To build, press **Control+C** in the terminal, then run:

```sh
npm run build
npm run preview
```

The preview is forwarded at **http://localhost:4173**. The generated `dist/` folder is available in your project on your Mac. Edits are shared with the container, while Linux dependencies stay in a separate Docker volume so they do not conflict with macOS dependencies.

After changing container configuration, use **Dev Containers: Rebuild Container**. After changing `package-lock.json`, run `npm ci` in the container terminal. For browser tests in the Linux container, first run `npx playwright install --with-deps chromium`, then `npm run test:e2e`.

### With Node.js installed locally

Use Node.js 22.18 or newer.

```sh
npm install
npm run dev
```

## Build and deploy

```sh
npm run build
```

Publish the `dist/` directory on any static host. The relative Vite base supports subdirectories, including GitHub Pages. There are no client-side URL routes or server rewrite requirements. `npm run preview` serves the production build locally. A hosting provider only needs the build command `npm run build` and output directory `dist`.

## Share with students through GitHub Pages

1. Create a GitHub repository and push this project to its `main` branch. Include `.github/workflows/deploy.yml` and `package-lock.json`; do not upload `node_modules/` or `dist/` to Git.
2. In the repository, open **Settings → Pages → Build and deployment → Source**, and choose **GitHub Actions**.
3. Open **Actions → Deploy to GitHub Pages → Run workflow**, or push a change to `main`.
4. The workflow installs dependencies, runs the logic tests and TypeScript checks, builds, and deploys `dist/`. Share the URL shown by the deployment, usually `https://USERNAME.github.io/REPOSITORY/`.

Future pushes to `main` update the same site. Students only need the link and a browser; your Mac and Docker do not need to stay running. Responses remain in each student's browser and are not collected by the site owner. Use the same site address to resume saved progress.

The project uses relative assets (`base: './'`), no history routing, and no external runtime services. The production tests serve the built files under a repository subdirectory to check loading and refresh. There is no service worker, so no extra offline cache/version management is needed.

Official deployment reference: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Questionnaire content

All 54 English statements match the canonical wording supplied by the application owner, including punctuation. Every statement has a faithful contemporary Greek translation, preserving its polarity and intensity.

All 54 objects are written directly in `src/data/questions.ts`; each pairs both languages with a permanent ID and category. The English text is the source of truth. Switching language never changes question identity, answers, order, categories, or scoring.

Session and result version 2 identifies the completed questionnaire. Earlier version 1 attempts used placeholder statements and are not resumed or compared with these results. The saved language preference is retained.

## Scoring and storage

- Even original IDs score one point for agreement; odd original IDs score one point for disagreement.
- Unknown responses count as completed but are excluded from the scoring denominator. The known-answer proportion is normalized to 12, 6, or 54. No known responses yields N/A.
- Classification uses full precision; displayed scores are rounded to at most one decimal place. Overall normalization is calculated directly, not as a sum of normalized dimensions.
- Coverage measures scored responses, not statistical confidence. Thresholds for coverage notices are 60% and 80%.
- Fisher–Yates with small safe swaps prevents triples from the same category. Order is generated only when starting or restarting, then saved with answers keyed by permanent ID.
- The test/language storage keys are `get2-active-session`, `get2-current-result`, `get2-previous-result`, and `get2-language`. Display preferences use `get2-preferences` (version 1). Corrupt or incompatible stored records are ignored. Valid version 2 test sessions remain compatible. If saving is blocked, the app shows a warning and remains usable in memory. Every fresh page load opens the welcome screen; Continue Test restores saved answers and position, and View Results opens a completed test.
- Results can be copied in the selected language or printed/saved as PDF through the browser. Clipboard failure offers a selectable summary; print failure shows a localized message. Only the current and immediately previous completed result are retained.

## Verification

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
```

Browser tests run against the production preview and cover persistence, both languages, review, keyboard controls, scoring, comparisons, copying, printing, and small screens. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to test with an existing Chromium-based browser instead of downloading one.

Keyboard controls: 1/2/3 select a response; Enter confirms the currently selected response and advances to the next question (or back to Review when revisiting an answer); Left/Right navigate when focus is outside the radio inputs. Radio inputs retain their standard arrow-key behavior. Selecting a response by itself never advances automatically.

## Accessibility and privacy controls

The footer offers appearance/accessibility preferences, Privacy, About this test, and confirmed deletion of saved test data. Theme defaults to the system preference; language defaults to Greek for an `el` browser locale unless a saved language exists. Larger text, high contrast, and reduced motion are saved locally. System reduced motion is always respected.

Delete Saved Data is available only in the footer and removes the active session plus current/previous results while preserving language and display preferences. Results use Retake Test as the repeat action so students can immediately start another randomized attempt. A reusable native dialog handles Escape, focus containment, and focus restoration. One polite live region announces selection/saving and completed actions.

Profile percentages use each dimension's original maximum. The deterministic summary compares at least three dimensions with coverage of 60% or higher; it is omitted when fewer qualify. N/A values are not plotted as zero, and an incomplete profile does not draw a filled polygon. The textual scores remain the authoritative alternative. Print output always uses a white background.

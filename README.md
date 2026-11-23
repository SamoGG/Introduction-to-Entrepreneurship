# Entrepreneurial Tendency Test

**[Open the app on GitHub Pages](https://samogg.github.io/Introduction-to-Entrepreneurship/)**

An educational web app for exploring entrepreneurial tendencies and learning about the GET/GET2 framework. Available in **English, Greek and French**.

The app includes two independent activities:

- **GET2 Test:** a 54-statement self-reflection questionnaire with randomized questions, answer review, a five-dimension profile and comparison with the previous completed attempt. Choose the standard Agree / Disagree / I don’t know responses or an optional Agree / Disagree-only mode.
- **Attributes Quiz:** learn the five entrepreneurial attributes, then match statements to their intended attribute. Optional instant feedback provides explanations after each submitted answer. Results include an overall understanding score, results by attribute and an incorrect-answer review.

Both activities run entirely in the browser. No account or installation is required to use the hosted app.

## Features

- Switch languages without losing answers or question order.
- Save and resume progress on the same browser and device.
- View GET2 scores, response coverage and a visual profile across five dimensions: achievement, autonomy, creativity, calculated risk-taking and internal locus of control.
- Copy GET2 results or print/save them as PDF through the browser.
- Use keyboard controls, larger text, high contrast and reduced motion.
- Choose system, light or dark appearance.
- Delete saved activity data while retaining language and display preferences.

GET2 is a self-reflection tool. Its results are not a clinical diagnosis or a definitive assessment of personality or ability. The Attributes Quiz measures understanding of the framework, independently of the questionnaire results.

See [the feature guide](docs/FEATURES.md) for detailed behavior, scoring rules, keyboard shortcuts and storage formats.

## Getting started

For local development, install **Node.js 22.18 or newer**, which includes npm, and Git. The project uses React 19, TypeScript 5.9 and Vite 8.

```sh
git clone https://github.com/SamoGG/Introduction-to-Entrepreneurship.git
cd Introduction-to-Entrepreneurship
npm ci
npm run dev
```

Open **http://localhost:5173** in a browser, or use the address printed by Vite if that port is occupied. These commands work on Windows, macOS and Linux with a compatible Node.js installation.

`npm ci` installs the dependency versions recorded in `package-lock.json`. Node's built-in TypeScript support runs the logic tests directly.

### Development container

The repository also includes a VS Code development container with Node.js 22 and npm. This option requires a running Docker environment and the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).

1. Clone the repository and open its folder in VS Code.
2. Open the Command Palette and select **Dev Containers: Reopen in Container**.
3. Wait for setup to install dependencies with `npm ci`.
4. Run `npm run dev` in the container terminal.
5. Open the forwarded address shown in VS Code's **Ports** tab.

The container forwards ports 5173 and 4173 and keeps dependencies in a separate Docker volume. After changing container configuration, select **Dev Containers: Rebuild Container**. After changing the lockfile, run `npm ci` in the container.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server on port 5173 |
| `npm run typecheck` | Check TypeScript without generating output |
| `npm test` | Run Node logic tests in `tests/*.test.ts` |
| `npm run build` | Check TypeScript and generate the production site in `dist/` |
| `npm run preview` | Serve the existing production build locally on port 4173 |
| `npm run test:e2e` | Build and run Playwright Chromium browser tests |

Development and preview servers bind to localhost. Generated dependencies, builds and browser-test reports are ignored by Git.

## Testing

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
```

On Linux or inside the development container, use `npx playwright install --with-deps chromium` if browser system dependencies are needed. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use an existing compatible Chromium-based browser instead of downloading one.

Playwright builds the app and starts its own production preview on port 4173. Stop any manually started preview before running browser tests; the suite does not reuse an existing server.

Tests cover scoring, translation completeness, storage validation, persistence, question review, keyboard controls, copy/print behavior, responsive layouts, quiz feedback, multiple tabs, deletion and loading under a repository subdirectory. Browser coverage includes English/Greek flows and French binary-mode and quiz flows.

## Build and deployment

```sh
npm run build
npm run preview
```

Open **http://localhost:4173** to preview the production build. Deploy the contents of `dist/` to a static host. Vite uses relative asset paths (`base: './'`), so the build supports repository subdirectories as well as root paths. Navigation uses application state, with no server routing rewrites required.

### GitHub Pages

The included [deployment workflow](.github/workflows/deploy.yml) runs on pushes to `main` and manual dispatches. It installs locked dependencies, runs logic tests, typechecks and builds the app, runs Chromium browser tests, and deploys `dist/` after those checks pass.

To deploy a fork or another copy of the repository:

1. Push the project to the repository's `main` branch.
2. Under **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**.
3. Push a change to `main`, or run **Deploy to GitHub Pages** from the **Actions** tab.
4. Use the URL shown by the deployment. Update the app link at the top of this README for the new repository.

The deployed app runs independently of the development environment. Visitors need only the site URL and a browser.

## Privacy and local data

Answers, activity progress, current/previous GET2 results and display preferences are stored in `localStorage` on the participant's browser and device. The app has no backend, accounts, cookies, analytics, external fonts or runtime content fetching. The hosting provider may process ordinary technical request logs, and following source links visits external sites.

Progress does not synchronize across devices or browsers. Use the same site address and browser to resume an attempt. Clearing browser site data can remove saved progress. **Delete Saved Data** in the footer removes both activities' data while preserving language, theme and accessibility preferences.

Stored records are validated, and competing-tab changes are detected. These checks support consistency; browser data can still be inspected or modified by someone with access to that browser. The app does not authenticate participants or provide verified examination results.

See [the security notes](docs/STATIC_APP_SECURITY.md) for storage boundaries, browser policies, hosting limitations and the dated security audit record. Any future `VITE_*` environment values are public and must not contain secrets.

## Project structure

| Location | Purpose |
| --- | --- |
| `src/App.tsx` | Activity navigation, GET2 session, preferences and footer dialogs |
| `src/components/` | Quiz, results, profile, progress, dialogs, icons and source references |
| `src/data/questions.ts` | All 54 statements in three languages, permanent IDs and attribute mappings |
| `src/i18n/` | English, Greek and French interface and quiz translations |
| `src/lib/` | Scoring, validation, persistence, preferences and question shuffling |
| `src/styles.css` | Application styles, responsive layouts and print presentation |
| `tests/` | Node logic tests and Playwright browser tests |
| `docs/` | Detailed feature documentation and security notes |
| `.devcontainer/` | Container-based development environment |
| `.github/workflows/deploy.yml` | GitHub Pages checks and deployment |

English questionnaire wording is the source of truth. Each statement has a permanent ID shared by both activities; changing language or display order does not change its identity, category or scoring.

## Authors and attribution

Created by **Samuel Gabriel Galgóci, Juraj Budinský, Justinas Jankauskas and Quentin Bonnehon**, with assistance from AI tools.

The app is an independent educational implementation of GET/GET2, originally developed by Sally Caird and Cliff Johnson. See [Sally Caird (2013), “General measure of Enterprising Tendency test”, The Open University](https://oro.open.ac.uk/5393/) for the cited source.

Source attribution does not establish a questionnaire reuse license or institutional endorsement. Verification of reuse licensing and addition of a verified site operator/privacy contact remain documented deployment follow-up items.

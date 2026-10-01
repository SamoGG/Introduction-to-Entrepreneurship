# Static app security audit

Audited 2026-10-01 against the applicable categories in [benavlabs/vibe-check](https://github.com/benavlabs/vibe-check). Scope: the current working tree, seven locally available commits, production build, and HTTPS response from the deployed site. Existing uncommitted quiz work was preserved. This is a scoped review, not a guarantee of security.

## Architecture and data

Static React/TypeScript/Vite SPA on GitHub Pages. No backend/API, database, authentication, accounts, payments, uploads, or service worker. Questionnaire and attributes-quiz answers/results, position, order, language and display preferences use browser localStorage. No analytics, external fonts, CDN scripts, or runtime content requests were found. All 54 canonical questions, unique IDs 1–54, mappings and scoring rules are bundled locally and validated by tests. Quiz correctness comes from canonical data, not DOM state.

Browser storage is neither encrypted nor access-controlled. People or scripts with access to the same browser origin can read/change it; GitHub Pages projects on the same host share an origin. Schema/score validation rejects corrupt records but cannot prove answers are authentic. The app is not an authoritative examination system. Clearing site data removes progress; another device/browser does not inherit it. No responses are uploaded to the administrator. This does not make claims about GitHub's ordinary hosting/access logs.

## Findings and changes

- **Deletion mismatch fixed:** the footer previously deleted only GET2 data, leaving attributes-quiz progress/results. It now clears both activities, exposes deletion for quiz-only attempts, cancels queued quiz writes, and retains language, display preferences and unrelated keys. English/Greek confirmation wording was updated. Storage failures remain visible instead of claiming success.
- **Ignore rules fixed:** `.env` and `.env.*` are ignored, with a placeholder-only `.env.example` exception. No environment files or `VITE_*` variables currently exist. Any future `VITE_*` value is public, never a secret.
- **Browser policies added:** early CSP meta and `strict-origin-when-cross-origin` referrer meta in `index.html`. Scripts/assets are same-origin; objects and form submissions are disabled. Inline styles are allowed for React progress bars and Vite development styles. No inline scripts, unsafe-eval, wildcards or external domains are allowed. Same-origin connections preserve development compatibility; the production app performs no API requests.
- **CI permissions narrowed:** build/test has only `contents: read`; the dependent deployment job has only `pages: write` and `id-token: write`. Official GitHub Actions, main/manual triggers, no application secrets or untrusted PR execution. Browser tests now gate artifact upload alongside unit tests, TypeScript and production build. Only `dist/` is uploaded.

## Verification

| Area | Result |
| --- | --- |
| Secrets | No tracked `.env` files. Keyword review of source, public files, hidden configs, workflow, package files and README found no credentials. Signature scan of all seven local commits and generated assets found no secret matches. This is pattern-based review, not proof that arbitrary secrets cannot exist. |
| Dependencies | `npm ci` succeeds; `npm audit --json` reports **0 vulnerabilities**, including dev dependencies. Manifest/lock declarations match; all resolved packages use npm's registry. React/React DOM are the only runtime dependencies; declared development tools are used. No dependency changes were needed. |
| Public output | Only `index.html`, `favicon.svg`, one JS bundle (~325 KB) and one CSS bundle (~35 KB). No source maps (Vite default), environment files, repository metadata, PDFs, archives, fixtures, reports, logs or internal documentation. `public/` contains only the favicon. No localhost URLs or secret signatures in built assets. |
| XSS/debug | No app use of raw HTML sinks, eval, debug routes/panels or diagnostic logging. React text rendering and strict restored-data validation are used. The existing startup `console.error` reports configuration failure; UI messages do not expose its stack. React's own bundled HTML implementation is not an app raw-HTML use. |
| Storage/privacy | JSON parsing/storage failures are caught. Versions, types, answer IDs, permutations, completion and reconstructed scores are validated. Privacy wording describes browser/device-only storage, no upload/admin access, no synchronization, browser clearing, and deletion with retained preferences. No encryption or anonymity guarantee. |
| Copy/print | Result summary constructs intended localized scores, coverage, completion date and explanatory text explicitly; print renders the result UI. Neither serializes storage keys, schema metadata or browser identifiers. |
| Deployment | Relative Vite base supports repository paths and root/custom-domain paths. No custom-domain CNAME exists. Live `https://samogg.github.io/Introduction-to-Entrepreneurship/` returned HTTP 200 over HTTPS with HSTS. Repository Pages settings were not inspected; local edits have not been deployed. |

Validation ran in a temporary Node 22 Docker container because the host has no Node/npm. `npm test`: **42 passing**; `npm run build` (including `tsc --noEmit`): passed. Production Chromium suite covers repository-subdirectory loading, no external requests, CSP compatibility, localStorage corruption/XSS payloads, deletion, persistence, languages, copy/print and questionnaire/quiz behavior. **All 29 browser tests passed** (Chromium, production preview).

## Hosting limitations

GitHub Pages controls HTTP response headers; this repository cannot set arbitrary CSP/X-Frame-Options headers. Embedding is not required, but framing protection is **not enforced** by this change: `frame-ancestors` does not work in a CSP meta tag. No frame-busting JavaScript or ineffective meta headers were added. The observed host-controlled `Access-Control-Allow-Origin: *` applies to public static resources, not a private API. Header-level framing controls would require hosting/proxy support. See [CSP guidance](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy) and [GitHub Pages HTTPS documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).

## Backend-only categories

| Category | Status and reason |
| --- | --- |
| DATABASE_ACCESS / SQL_INJECTION | N/A — no database or SQL. |
| AUTH_MIDDLEWARE / ACCESS_CONTROL / IDOR / PASSWORD_HASHING | N/A — no accounts, authentication, private server resources or passwords. |
| API CORS | N/A — no API or application server CORS configuration. |
| CSRF | N/A — no authentication cookies or state-changing server requests. |
| SSRF | N/A — no server or user-provided URL fetching. |
| RATE_LIMITING | N/A — no server endpoints. |
| FILE_UPLOADS | N/A — no upload functionality. |
| PAYMENT_WEBHOOKS | N/A — no payments or webhooks. |
| Server debug/API-doc endpoints | N/A — only static assets are deployed. |

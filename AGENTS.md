# AGENTS.md

## Cursor Cloud specific instructions

This is a static, single-page web app (`index.html` + `assets/*.js` + `assets/styles.css`). There is **no build step** and **no third-party install step** — it runs straight from static files. Node.js is only used for the dev server and the check script.

### Run / serve

- Start the local dev server (serves the repo root with `Cache-Control: no-store` so edits show up immediately): `npm run dev` then open `http://localhost:8000/index.html`.
- A plain static server (e.g. `python3 -m http.server`) also works, but browsers will cache `assets/app.js`; prefer `npm run dev` (no-cache) or hard-refresh (Ctrl+Shift+R) after editing JS/CSS.

### Lint / test

- `npm run check` (runs `scripts/check-code.mjs`): does `node --check` syntax validation on the JS assets and asserts several invariants in `index.html`/`app.js` plus a few unit assertions from `assets/app-utils.js`. Run this before committing.

### Auth / data gotchas (important)

- The app authenticates against a hard-coded Firebase project (`assets/app.js`, `firebaseConfig`) and only initializes after `onAuthStateChanged` fires with a logged-in user. Without valid Firebase credentials the login screen blocks the UI.
- `carregarDoFirebase()` has a fallback: if Firestore reads throw, it loads the bundled sample data in `assets/dados-norte.js` (Região Norte only). To exercise the UI locally without credentials, you can temporarily bypass the login screen and call `init()` — but treat that as throwaway debug code and never commit it.
- The Dashboard is the initial view after data loads (`abrirDashboardInicial()` in `app.js`).

### Role terminology

- The five record types map to role names via `TIPO_LABELS` (short codes shown on badges) and `TIPO_NOMES` (full names) in `assets/app.js`: `L`=Liderança, `M`=Mobilizador, `CA`=Coordenador de Área, `LE`=Liderança EMPREGADO, `ME`=Mobilizador EMPREGADO.

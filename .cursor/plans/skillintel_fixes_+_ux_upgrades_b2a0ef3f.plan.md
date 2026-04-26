---
name: SkillIntel fixes + UX upgrades
overview: Make theme consistent across the SPA, fix trending to reflect real backend fields (REST + Socket.io), seed 30–40 realistic skills, repair comparison rendering/selection, add personalized skills/recommendations, add dashboard-only Gemini chatbot, implement ATS scoring on resume upload, clean up sidebar/nav, and add Roadmap placeholder—without breaking existing APIs, JWT/session auth, or the trends pipeline.
todos:
  - id: theme-tokenize
    content: Make global styles and key pages fully token-based; ensure ThemeProvider wraps app; fix light/dark contrast across Home/Dashboard/Profile/Compare/Footer.
    status: completed
  - id: trending-realdata
    content: Unify REST and Socket.io trending sort/fields; map trendScore/growth/percentChange correctly in frontend; remove hardcoded values.
    status: completed
  - id: seed-skills
    content: Expand `data/skills.json` to 30–40 realistic skills + categories; make `seed.js` idempotent/upsert and non-destructive by default.
    status: completed
  - id: compare-fix
    content: "Improve compare UX: autocomplete from `/api/skills`, multi-skill selection, render all results, and sync quick picks with user skills."
    status: completed
  - id: personalize-dashboard
    content: Add Your/Recommended/Trending skills sections using existing `/api/auth/profile`, `/api/recommended/:skill`, `/api/trending`.
    status: completed
  - id: dashboard-progress
    content: Clarify metrics labels and add progress tracker cards (profile completion, skills completion, resume status).
    status: completed
  - id: gemini-chatbot
    content: Add JWT-protected backend proxy endpoint for Gemini; implement dashboard-only chatbot widget UI.
    status: completed
  - id: profile-ats
    content: Implement resume parsing + ATS scoring on upload; store additive analysis in user profile; display ATS score + suggestions on Profile page.
    status: completed
  - id: nav-roadmap
    content: Remove Intelligence/Settings from Profile sidebar, add `/roadmap` placeholder page, and wire routes/nav.
    status: completed
  - id: auth-redesign
    content: Redesign login/register with AI-themed split layout while preserving existing submit/auth logic and theme compatibility.
    status: completed
isProject: false
---

## Constraints / non-negotiables
- Preserve existing routes and auth behavior: JWT API routes, SSR session logic, and existing `/api/*` paths.
- Avoid duplicate endpoints when an existing one already serves the purpose.
- Theme must be centralized, token-based, and persisted via `localStorage` (already present in `client/src/contexts/ThemeContext.jsx`).

## Architecture (as-is, relevant bits)
- **Backend entry**: [`/Users/kartikyasokhal/Documents/WORK/COLLEGE/SEM 4/Backend Project/SkillIntel/server.js`] wires Express + Mongo + sessions + Socket.io.
- **Skills APIs**: [`routes/skillRoutes.js`] mounts `/api/trending`, `/api/compare`, `/api/skills` etc.
- **Trending REST**: [`controllers/skillController.js`] sorts by `{ trendScore: -1, growth: -1, demandIndex: -1 }` and returns full Skill docs.
- **Trending Socket.io**: `server.js` currently sorts only by `growth` and selects a limited field set.
- **Frontend theming**: Theme state is correct (`<html data-theme=...>` + localStorage) but many UI surfaces use hardcoded colors in CSS/inline styles, bypassing tokens.

## Implementation plan (staged to stay safe)

### Stage A — Global theme consistency (light/dark)
Target: fix the inconsistency (Home/Trending/Footer/Compare/Dashboard/Profile) and dark-mode contrast issues.
- Update [`client/src/main.jsx`] (verify) to ensure the whole app is wrapped in `ThemeProvider` from [`client/src/contexts/ThemeContext.jsx`].
- Refactor theme-incompatible hardcoded colors to token-based styles:
  - Primary file: [`client/src/index.css`]
    - Replace hardcoded dark surfaces with `var(--bg-*)` tokens where possible (e.g. `.navbar`, `.stats-strip`, `.stat-item`, `footer`, `.compare-table th`, etc.).
    - For places where gradients must remain, add explicit `[data-theme='light']` overrides so they remain readable.
  - Pages with inline hex styling to migrate to tokens/classes:
    - [`client/src/pages/Dashboard.jsx`] (header gradient and any hex colors)
    - [`client/src/pages/Compare.jsx`] (replace hardcoded `SKILL_COLORS` or map them to CSS variables)
    - Auth pages [`client/src/pages/Login.jsx`], [`client/src/pages/Register.jsx`] (use tokens for link/gradient colors)
- Add a minimal “contrast audit” pass: ensure text uses `--text-primary/secondary/muted` and backgrounds use `--bg-*` so no invisible text appears in dark/light.

### Stage B — Trending section: real data + correct mapping + real-time updates
Target: ensure multiple skills show meaningful trend values and front-end uses the backend fields.
- Align Socket.io trending data with REST `/api/trending`:
  - In [`server.js`], change the `requestTrending` handler to query the same sort order as REST (prefer `trendScore`, then `growth`, then `demandIndex`) and include trend fields (`trendScore`, `direction`, `percentChange`, `lastTrendComputedAt`) in the selection.
  - Consider increasing emitted list length (e.g. 10) while keeping Dashboard display at 5.
- Fix frontend mapping logic:
  - In [`client/src/pages/Dashboard.jsx`], when rendering trending:
    - Prefer displaying `percentChange` if present; otherwise fall back to `growth`.
    - Render `trendScore`/direction badge consistently with `SkillCard` semantics.
  - Ensure REST fallback uses `/api/trending` and respects the same shape.

### Stage C — Seed 30–40 realistic skills (dynamic, categorized)
Target: eliminate sparse/0 metrics by providing realistic starting data, while keeping it safe/idempotent.
- Update the seed data file [`data/skills.json`] to include 30–40 skills across categories (Frontend/Backend/DevOps/Cloud/Data/AI/etc.) with realistic `demandIndex`, `salary`, `growth`, `experienceBarrier`, and `recommended` arrays.
- Make seeding idempotent and non-destructive for demo environments:
  - Adjust [`seed.js`] to **upsert** skills by name instead of `deleteMany()` (so it won’t wipe real data accidentally).
  - Keep admin/test user creation but avoid deleting users if not necessary (or gate destructive behavior behind an env flag like `SEED_RESET=true`).

### Stage D — Comparison section fixes
Target: selection + rendering for multiple skills (Python/JS/Go + AWS/Docker/K8s) works reliably and reflects DB.
- API usage is already correct in [`client/src/pages/Compare.jsx`] (`/api/compare?skills=A,B,C`).
- Improve UX/logic:
  - Add a dynamic skills dropdown/autocomplete backed by `/api/skills` (reuse existing endpoint) so users don’t mistype names.
  - Allow selecting N skills (beyond fixed 3) while preserving backward-compat behavior; keep URL param `skills=`.
  - Ensure the UI renders all returned skills and makes “not found” entries explicit.
- Sync with user profile:
  - Pull user skills (`skillsDetailed`) from `/api/auth/profile` and show them as quick-select chips in Compare.

### Stage E — Skills personalization (“Your / Recommended / Trending”)
Target: personalize without inventing duplicate APIs.
- Data sources:
  - “Your Skills”: from `profile.skillsDetailed` in `/api/auth/profile` (already exists).
  - “Recommended Skills”: reuse existing backend `/api/recommended/:skill` for each top user skill, de-duplicate, filter out already-owned skills.
  - “Trending Skills”: `/api/trending` (already exists) + Socket.io for live.
- Frontend placement:
  - Add a “Personalized Skills” section on Dashboard (or Explorer) showing these three lists.

### Stage F — Dashboard improvements + progress tracker
Target: clarify vague metrics and show completion.
- Replace “High Growth” count with clearer labels:
  - “High Growth (≥20% YoY)”
  - “Moderate Growth (10–19%)”
  - “Declining/Stable (<10%)”
- Progress tracker cards:
  - Profile completion: derived from profile fields + skills + resume present (logic already similar to `computeIntegrityScore` in [`client/src/pages/Profile.jsx`]).
  - Skills completion: % based on count of user skills vs a target (e.g. 8 skills).
  - Resume status: `profile.resume.hasFile`.

### Stage G — Gemini chatbot (dashboard only, authenticated)
Target: dashboard-only assistant, hidden when logged out.
- Backend:
  - Reuse existing Gemini integration in [`config/gemini.js`] and [`services/geminiAnalyzer.js`].
  - Add a JWT-protected endpoint (e.g. under [`routes/dashboardRoutes.js`] or a new `routes/aiRoutes.js` mounted under `/api`) that proxies requests to Gemini so the API key never reaches the client.
  - Input/output: accept `{ message, context }`; return `{ reply }`.
- Frontend:
  - Add a `ChatbotWidget` component rendered only on [`client/src/pages/Dashboard.jsx`] (already protected by `PrivateRoute`).
  - Place it beside the skills/personalization section; make it responsive (collapsible on mobile).

### Stage H — Profile page fixes + ATS score system
Target: alignment + clear verified skills UI + ATS score computed from resume.
- Profile alignment:
  - Reduce remaining inline styles and rely on the existing CSS layout in [`client/src/index.css`] (`.profile-*`).
  - Clean up the left sidebar links to match the requested nav (see Stage I).
- ATS scoring:
  - Backend:
    - Add resume parsing on upload in [`controllers/authController.js`] `uploadResume`.
    - Add dependencies for parsing: PDF (`pdf-parse`) and DOCX (`mammoth`) and a safe fallback for DOC (or mark DOC as “uploaded, not parsable”).
    - Extract keywords from parsed text and score against:
      - trending skills list (from `Skill` collection ordered by `trendScore`)
      - optionally: category-weighted matches
    - Store an additive `profile.resumeAnalysis` with `{ atsScore, matchedKeywords, missingSkills, updatedAt }` in [`models/User.js`].
    - Expose it in `/api/auth/profile` response without changing existing fields.
  - Frontend:
    - Display ATS score (0–100) and suggestions on [`client/src/pages/Profile.jsx`] under Document Integrity.

### Stage I — Sidebar cleanup + Roadmap placeholder
Target: remove Intelligence/Settings, keep Dashboard/Roadmap/Profile only.
- Implement a real Roadmap page:
  - Add [`client/src/pages/Roadmap.jsx`] with placeholder text: “Personalized roadmap based on your resume — coming soon”.
  - Register route `/roadmap` in [`client/src/App.jsx`].
- Update Profile sidebar in [`client/src/pages/Profile.jsx`]:
  - Keep links: Dashboard (`/dashboard`), Roadmap (`/roadmap`), Profile (`/profile` active)
  - Remove: Intelligence, Settings
- Optionally add “Roadmap” link in [`client/src/components/Navbar.jsx`] when logged in.

### Stage J — Login/Register UI redesign
Target: modern AI-themed split layout with illustration.
- Move inline-style heavy auth pages to class-based layout in [`client/src/index.css`] or a dedicated `auth.css`.
- Implement a two-column layout:
  - Left: AI-themed illustration (SVG/gradient panel), feature bullets.
  - Right: form card (existing functionality preserved).
- Ensure theme compatibility using tokens.

## Verification checklist (non-destructive)
- Theme: toggling updates Home, Dashboard, Profile, Compare, Footer; no invisible text.
- Trending: REST `/api/trending` and Socket.io `trendingUpdate` show multiple skills with meaningful `growth` and (when available) `percentChange`.
- Compare: `?skills=Python,JavaScript,Go` renders all; `AWS,Docker,Kubernetes` works.
- Seed: `npm run seed` results in 30–40 skills and doesn’t wipe data unless explicitly configured.
- Chatbot: only visible on `/dashboard` when authenticated; backend key stays server-side.
- ATS: uploading resume computes ATS score and shows suggestions in Profile.

## Key files you’ll see changed
- Backend: [`server.js`], [`controllers/skillController.js`] (maybe minimal), [`controllers/authController.js`], [`models/User.js`], seed files [`seed.js`], [`data/skills.json`], plus a new AI route file if needed.
- Frontend: [`client/src/index.css`], [`client/src/pages/Dashboard.jsx`], [`client/src/pages/Compare.jsx`], [`client/src/pages/Profile.jsx`], [`client/src/pages/Login.jsx`], [`client/src/pages/Register.jsx`], [`client/src/App.jsx`], plus new [`client/src/pages/Roadmap.jsx`] and `ChatbotWidget` component.

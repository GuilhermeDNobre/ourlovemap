# Repository Guidelines

## Project Structure & Module Organization
This project is a Vite + React + TypeScript frontend.

- `src/main.tsx` boots the app and providers.
- `src/routes.tsx` defines route wiring.
- `src/pages/` contains top-level pages (`Landing`, `WizardPage`, `PublicMapPage`).
- `src/components/` is split by domain (`landing/`, `wizard/`, `public-map/`, `ui/`).
- `src/hooks/`, `src/lib/`, `src/stores/`, and `src/types/` hold reusable logic, state, and shared types.
- `src/__tests__/` contains unit/component tests; `src/__mocks__/` contains Jest mocks.
- `src/assets/` and `public/` hold static assets.

## Build, Test, and Development Commands
Use npm scripts from `package.json`:

- `npm run dev`: start local Vite dev server.
- `npm run build`: run TypeScript project build (`tsc -b`) and create production bundle.
- `npm run preview`: preview the production build locally.
- `npm run type-check`: run strict TypeScript checks without emitting files.
- `npm test`: run Jest tests (`--passWithNoTests` enabled).

## Coding Style & Naming Conventions
- Language: TypeScript (`.ts` / `.tsx`) with ESM imports.
- Indentation: 2 spaces; keep trailing commas where existing patterns use them.
- Components/pages: `PascalCase` filenames (for example, `PaymentModal.tsx`).
- Hooks: `use-*.ts(x)` in `src/hooks/` (for example, `use-payment-polling.ts`).
- Utilities/libs: kebab-case filenames in `src/lib/` (for example, `build-map-form-data.ts`).
- Prefer small, focused modules and colocate domain UI under the corresponding component folder.

## Testing Guidelines
- Framework: Jest + `ts-jest` with `jest-environment-jsdom`.
- Test files: `*.test.ts` or `*.test.tsx`; colocated under `src/__tests__/...` by feature.
- Reuse mocks from `src/__mocks__/` for browser/map/media integrations.
- Run `npm test` locally before opening a PR; run `npm run type-check` for type safety.

## Commit & Pull Request Guidelines
- Follow Conventional Commit style observed in history: `fix(scope): message` (for example, `fix(final-map): fix mobile capture timing`).
- Keep commits scoped and atomic; avoid mixing unrelated changes.
- PRs should include:
  - Clear summary of behavior changes.
  - Linked issue/ticket when available.
  - Screenshots or short recordings for UI changes.
  - Notes on test coverage (what was added/updated and which commands were run).

## Release Checklist
- Before merge: run `npm run type-check` and `npm test`.
- Build verification: run `npm run build` and confirm no TypeScript or bundling errors.
- Smoke test: run `npm run preview` and validate key flows:
  - Landing page rendering and navigation.
  - Wizard step progression and submission path.
  - Public map route loading and media/map interactions.
- Environment sanity: confirm required variables match `.env.example` and no secrets were committed.

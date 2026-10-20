# Repository Guidelines

## Project Structure & Module Organization

This is a TypeScript plugin for Strapi v5. `admin/src/` contains React components, pages, translation files, and admin registration. `server/src/` contains lifecycle hooks, routes, controllers, and Zod configuration schemas. Server tests live in `server/src/__tests__/`, including controller tests in a nested directory. `assets/` holds the logo and preview images. Builds generate `dist/`; edit source files rather than generated output.

## Build, Test, and Development Commands

Run `mise trust` and `mise install` to provision Node 22 and enable Corepack. Use the pnpm version pinned in `package.json`.

- `pnpm install --frozen-lockfile`: install dependencies from the committed lockfile.
- `pnpm watch`: rebuild the plugin during development.
- `pnpm watch:link`: run the SDK's linked development workflow with a consuming Strapi app.
- `pnpm typecheck:front` and `pnpm typecheck:back`: check admin and server TypeScript separately.
- `pnpm lint` / `pnpm lint:fix`: check style or apply automatic fixes.
- `pnpm test --run`: run the test suite once; `pnpm test:watch` reruns tests during development.
- `pnpm test:coverage`: generate V8 coverage reports.
- `pnpm build` followed by `pnpm verify`: build and validate the distributable plugin.

## Coding Style & Naming Conventions

Follow `eslint.config.mjs`: two-space indentation, single quotes, no semicolons, trailing commas in multiline structures, and Unix line endings. Use PascalCase for React components (`PluginIcon.tsx`) and camelCase for utilities (`getTranslation.ts`). Reuse Strapi design-system components and existing helpers. Keep admin and server plugin identifiers consistent.

## Testing Guidelines

Vitest runs in a Node environment and currently discovers only `server/src/__tests__/**/*.test.ts`. Follow existing `describe` / `it` / `expect` patterns and mock Strapi dependencies where needed. Add regression tests for changed validation, registration, or controller behavior. No numeric coverage threshold is configured. Manually exercise admin UI changes in a consuming Strapi app.

## Commit & Pull Request Guidelines

Use Conventional Commits, following history: `fix(admin): ...`, `fix(ci): ...`, or `chore(deps-dev): ...`. Keep commits focused. Target `main`; describe the problem, resulting behavior, and validation performed. Link related issues when applicable and include screenshots for visible UI changes. Before requesting review, run both typechecks, lint, tests, build, and verify; these mirror PR CI.

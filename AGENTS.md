# Repository Guidelines

## Project Structure & Module Organization

This is a TypeScript plugin for Strapi v5. `admin/src/` contains React components, translation files, and admin registration. `server/src/` contains lifecycle hooks, routes, controllers, and Zod configuration schemas. Tests live in `tests/{project}/` and mirror paths and filenames within `{project}/src/`, including `index` files: `admin/src/components/Input.tsx` maps to `tests/admin/components/Input.test.tsx`, and `server/src/config/index.ts` maps to `tests/server/config/index.test.ts`. The private `playground/` pnpm workspace contains a Strapi app with exactly Page, Article, and Showcase collections; its field tests mirror `playground/config/` under `tests/playground/config/`. `assets/` holds the logo and preview images. Builds generate `dist/`; edit source files rather than generated output.

## Build, Test, and Development Commands

Run `mise trust` and `mise install` to provision Node 22 and enable Corepack. Use the pnpm version pinned in `package.json`.

- `pnpm install --frozen-lockfile`: install dependencies from the committed lockfile.
- `pnpm watch`: rebuild the plugin during development.
- `pnpm watch:link`: run the SDK's linked development workflow with a consuming Strapi app.
- `pnpm playground:dev`: build and run the in-repo Strapi app, restarting on plugin edits; first configure `playground/.env` as documented in its README.
- `pnpm playground:build` / `pnpm playground:smoke`: build the app and plugin, then run the separate Vitest boot check with a disposable SQLite database and secrets.
- `pnpm typecheck:playground`: check playground configuration and tests after building the plugin declarations.
- `pnpm --dir playground types:generate`: regenerate the committed schema declarations after building the plugin. Regenerate and commit `playground/types/generated/` whenever playground schemas or the resolved Strapi version change; preserve generated formatting and do not edit declarations manually.
- `pnpm typecheck:admin` and `pnpm typecheck:server`: check admin and server TypeScript separately.
- `pnpm lint` / `pnpm lint:fix`: check style or apply automatic fixes.
- `pnpm test --run`: run the test suite once; `pnpm test:watch` reruns tests during development.
- `pnpm test --run --project server` / `pnpm test --run --project admin`: run one test project.
- `pnpm exec playwright install chromium`: install the browser used by admin tests; use `--with-deps` on Linux when system dependencies are missing.
- `pnpm test --project admin --browser.headless=false`: debug admin tests in a visible browser.
- `pnpm test:coverage`: generate combined server/admin V8 coverage reports.
- `pnpm build` followed by `pnpm verify`: build and validate the distributable plugin.

## Coding Style & Naming Conventions

Follow `eslint.config.mjs`: two-space indentation, single quotes, no semicolons, trailing commas in multiline structures, and Unix line endings. Use PascalCase for React components (`PluginIcon.tsx`) and camelCase for utilities (`getTranslation.ts`). Reuse Strapi design-system components and existing helpers. Keep admin and server plugin identifiers consistent.

## Testing Guidelines

Vitest's default projects are `server` (`tests/server/**/*.test.ts`, Node), `admin` (`tests/admin/**/*.test.{ts,tsx}`, real headless Chromium through Playwright), and `playground` (`tests/playground/{config,src}/**/*.test.ts`, Node). The separate `playground/vitest.smoke.config.ts` runs `tests/playground/smoke.test.ts` after a playground build. Each typecheck includes its corresponding tests. Follow existing `describe` / `it` / `expect` patterns. Admin component tests use `vitest-browser-react`, real design-system controls, and mocked Strapi fetch/query hooks. Prefer browser locators and retrying assertions. Add regression tests for changed validation, registration, controller, or UI behavior. No numeric coverage threshold is configured. Manually exercise admin UI changes in the playground.

## Dependency Management

- Review both `dependencies` and `devDependencies` against the npm registry's latest stable releases. Distinguish manifest ranges, lockfile resolutions, and installed versions; an older range minimum does not necessarily mean the installed package is outdated.
- Before recommending an upgrade, trace reachable usage, callers, configuration, tests, and exports. Check whether the dependency is needed at all. Remove unused scaffolding with its dependency when removal is agreed; an import in an unregistered page does not justify keeping a package.
- Default to exact Strapi development versions for React, React DOM, their types, React Router, styled-components, Koa types, and TypeScript, even when alignment requires a downgrade. Use the resolved `@strapi/strapi` development release as the reference, inspecting its package manifests and repository-level type pins. Do not upgrade these packages to unsupported majors just because npm lists a newer release.
- Keep development pins separate from peer compatibility ranges. A development pin selects the version checked locally; a peer range describes compatible consuming apps. Do not copy an exact development pin into `peerDependencies` or raise the minimum supported Strapi version merely to match the development environment.
- Explain each candidate's purpose, concrete benefit, compatibility requirements, and migration cost. Check Node, Strapi, and related tooling together. Independently owned dependencies such as Zod may use newer compatible versions than Strapi itself.
- During interactive dependency reviews, discuss each package or coupled group before applying its change; honor explicit batch authorizations. Dependabot groups patch/minor proposals into `strapi`, `testing`, `linting`, `internal`, and `github-actions`; major updates remain separate proposals. Review every included package, even within a grouped PR. Dependabot does not read these guidelines or derive exact pins from Strapi's manifests, so check and correct its proposals against the alignment policy.
- For approved upgrades, update both `package.json` and `pnpm-lock.yaml`. Preserve the chosen exact pins or ranges, and check that pnpm has not rewritten them. Keep changes targeted and preserve concurrent work from other agents.
- Preserve exported and inferred configuration types during migrations. Compare the complete inferred types against the previous schemas, including callback parameters, optional fields, extra arguments, and synchronous/asynchronous returns. Add focused type assertions and runtime regression tests for affected validation boundaries.
- Validate each change proportionately: check manifest/lockfile alignment when installed versions are unchanged, run lint for lint-tooling updates, and run both typechecks, lint, tests, build, and verify for runtime migrations and package-manager upgrades. Run the full suite before PR review. Report skipped checks and distinguish local validation from an actual GitHub Actions run.
- Keep the pnpm version pinned in `packageManager`; CI derives its version and cache keys from that declaration. Package-manager upgrades must pass a frozen install with the required lockfile metadata. Check fresh installs and fresh installs from a warmed store when lifecycle behavior changes. CI caches the store, not `node_modules`; keep required external setup such as Corepack and Playwright installation explicit rather than relying on an unchanged install to rerun scripts.

## Commit & Pull Request Guidelines

Use Conventional Commits, following history: `fix(admin): ...`, `fix(ci): ...`, or `chore(deps-dev): ...`. Keep commits focused. Target `main`; describe the problem, resulting behavior, and validation performed. Link related issues when applicable and include screenshots for visible UI changes. Before requesting review, run both typechecks, lint, tests, build, and verify; these mirror PR CI. Server and admin tests run in separate required jobs. The admin job caches Playwright browsers by runner OS, architecture, and resolved Playwright version, and always installs Chromium system dependencies. Coverage is local only.

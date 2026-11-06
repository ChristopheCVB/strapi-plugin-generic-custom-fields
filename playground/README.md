# Plugin playground

A local Strapi 5.61.0 app consuming the plugin through a pnpm workspace link. Install dependencies once from the repository root using the pinned pnpm version. No Docker or external API is required.

## First launch

From the repository root:

```sh
mise trust
mise install
pnpm install --frozen-lockfile
cp playground/.env.example playground/.env
```

Generate a fresh secret for each placeholder with:

```sh
mise exec -- node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Set two different secrets in the comma-separated `APP_KEYS`, and one each for `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, and `ENCRYPTION_KEY`. Keep `.env` local and ignored.

```sh
pnpm playground:dev
```

Open http://127.0.0.1:1337/admin and register your own local administrator. No account or content is created automatically. The app binds to localhost by default; its configuration is for local development.

## What to exercise

There are exactly three collections:

- **Page**: required title and unique slug, with Draft & Publish enabled.
- **Article**: required title and unique slug, with Draft & Publish enabled.
- **Showcase**: title plus Iconify Icon, Internal Document, Link Target, Unique Icon, and Private Icon attributes. The last two reuse Iconify Icon to exercise Strapi's unique/private settings.

The three registered custom fields adapt [ndsuv's configuration](https://github.com/ChristopheCVB/ndsuv/tree/main/back/config/plugins/generic-custom-fields):

- **Iconify Icon** searches the complete installed Iconify catalogue offline. Empty search shows collection samples; searches return up to 64 matches with SVG previews. The catalogue loads lazily on first search. Its npm package occupies about 642 MB unpacked.
- **Internal Document** queries published Pages and Articles by title and resolves their saved paths. Root options `/` and `/articles` are always available. Drafts do not appear. A deleted or unpublished selection keeps its stored path visible.
- **Link Target** offers `_self` (Same window) and `_blank` (New window). Its Showcase attribute is required and defaults to `_self`.

Create a Page and an Article manually and publish them. Create a Showcase, search for their titles, choose an icon and link target, save, and reopen it. Verify icons and selected labels survive reopening. An unknown saved Link Target keeps its raw value visible.

To check advanced settings, confirm `_self` is preselected, clearing the required Link Target prevents saving, and reusing a Unique Icon across entries is rejected. Private Icon remains visible to administrators and is excluded by Strapi's content-API serialization; the playground does not enable public content access automatically.

## Commands

Run these from the repository root:

```sh
pnpm playground:dev       # Build, develop, and restart automatically on plugin source edits
pnpm playground:build     # Build plugin declarations/bundles, then the Strapi app
pnpm typecheck:playground # Requires a preceding plugin build
pnpm test --run --project playground
pnpm playground:smoke     # Requires playground:build; uses a temporary database and random secrets
pnpm playground:start     # Serve a preceding playground:build
```

Plugin source edits trigger a complete rebuild and restart, so unsaved admin forms may be lost. Strapi watches its own configuration and content-type sources. The playground Vite configuration works around Strapi 5.61's Prism grammar initialization order and prebundles the plugin's admin dependencies. Root and playground Node type pins match Strapi to keep pnpm's admin dependency graph shared.

Build errors leave the watcher running; fix the source to trigger another build. Ctrl+C stops the development process tree. Dependency or package-manifest changes require reinstalling and restarting the command.

The SQLite database defaults to `playground/.tmp/data.db` and persists between sessions. To reset it, stop the app and delete that file and any matching `-wal`/`-shm` files. This deletes local content and administrator accounts. Upload files remain under `playground/public/uploads/`; delete them separately if needed.

The smoke command runs a separate Vitest project and requests admin HTML without executing browser JavaScript. It never uses the development database or creates an admin account or entries. It checks the three collection schemas, field registration and callbacks, offline icon search, HTTP health, and the built admin page, then closes Strapi and removes its temporary database. CI runs it after the playground build and focused field tests. Browser interaction remains a manual check.

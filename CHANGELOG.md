# Changelog

> This changelog was generated with the help of [Claude Code](https://claude.ai/claude-code).

All notable changes to this project will be documented in this file.

This project follows [Semantic Versioning](https://semver.org/) with the major version matching the supported Angular version.

## [22.2.0] - 2026-07-17

### Features
- Nested pages / sub-commands. A command with `children` becomes a submenu: selecting it opens a scoped page with its own placeholder, empty message, and breadcrumb chip. Backspace on an empty input goes back one level; Escape closes from any depth.
- `children` accepts a static `Command[]`, a `() => Observable<Command[]>` loader (fetched once per palette session, cancellable, cached until close), or `{ provider: string }` to reuse a registered search provider as a page.
- Typing a provider prefix and selecting a command that points at the same provider land on the identical page, so prefixes and submenus share one implementation.
- `pagePlaceholder` and `pageEmptyMessage` properties on `Command` for configuring the page a command opens.
- New service API: `openPage`, `pushPage`, `popPage`, `goBack`, and the `currentPage` and `breadcrumbs` signals.
- Container commands render a chevron in the default item template.
- The footer shows a Backspace hint while nested and hides prefix hints inside pages.
- Page titles are announced to screen readers via a polite live region, and the input's `aria-label` follows the page title.
- `escapeBehavior` config option. `'close'` (default) dismisses the palette from any depth; `'pop'` makes Escape go back one page (or out of prefix mode) per press and only close at the root.

### Notes
- `Command.action` is now optional to support container commands. If a custom item template calls `command.action()` directly, change it to `command.action?.()`, or better, `palette.execute(command)` so recents tracking works.
- `activeProvider()` is now also non-null while a provider page entered by selection is active, not only when its prefix is typed. Consumers rendering a prefix chip from it should switch to `breadcrumbs()`.
- Recency boosts are now computed against the commands actually being scored, so recorded ids that are not visible (for example page children while at the root) no longer consume boost slots. Executing a child also records its ancestor containers, so frequently used submenus rise at the root.

### Bug Fixes
- Static commands no longer leak into results while a prefix provider is active.
- Clicking a palette item no longer moves focus out of the search input, which previously killed keyboard navigation when the palette stayed open.
- Clearing provider results now cancels in-flight searches, so a late response can no longer repopulate results after a page transition or close.
- Identical consecutive provider queries no longer trigger a duplicate fetch.
- Overlapping provider prefixes now match longest first, so registering `>` no longer shadows `>>`.
- Group heading ids are slugified, fixing `aria-labelledby` for category names containing spaces.
- Regex metacharacters in `context.routes` patterns are now treated as literal text; only `*` and `**` act as wildcards.
- Pushing a page whose provider id is not registered now warns in dev mode instead of failing silently, as does rendering more than one `<cmd-palette>` instance.

## [22.1.0] - 2026-06-19

### Features
- Prefix-aware input with visual chip. When a user types a prefix character (e.g. `@`), a chip appears in the input, the placeholder updates to the provider's custom text, and pressing Backspace on an empty input exits prefix mode.
- `placeholder` property on `SearchProvider` for custom input placeholder text when the provider's prefix is active.
- `emptyMessage` property on `SearchProvider` for per-provider empty state text (defaults to "No results found.").
- New signals on `CommandPaletteService`: `activeProvider`, `displayQuery`, `activePlaceholder`, `emptyMessage`.
- CSS custom properties `--cmd-prefix-chip-bg` and `--cmd-prefix-chip-color` for theming the prefix chip across all built-in themes.

## [22.0.2] - 2026-06-18

### Fixes
- Add repository, homepage, and bugs metadata to package.json for npm sidebar links.
- Remove beta notice and fix badge URLs in README.

## [22.0.1] - 2026-06-18

> **Note**: Version 22.0.0 has been retracted from npm. 22.0.1 is the first available stable release for Angular 22.

### Features
- Custom item templates. Use `<ng-template cmdItemTemplate>` inside `<cmd-palette>` to override how result rows are rendered. Supports global templates and per-category templates with a resolution order of category-specific, global, then built-in default.
- `CmdItemTemplateDirective` for marking custom item templates.
- `CmdItemTemplateContext` interface for type-safe template context (`$implicit: Command`, `active: boolean`).
- `data` property on `Command` interface (`Record<string, unknown>`) for attaching arbitrary metadata that custom templates can render.

### Bug Fixes
- Fixed fuzzy search scoring when a substring appears multiple times in a label. The matcher now finds the best-scoring occurrence instead of always using the first. For example, searching "foo" in "xfoo foo" now correctly scores as a word-boundary match (60) instead of a mid-string match (40).
- Added forward slash (`/`) as a word boundary character in fuzzy matching. Route-derived labels like "admin/settings" now get word-boundary scoring when searching "settings".

## [22.0.0] - 2026-06-16 [RETRACTED]

> This version has been retracted from npm. Use 22.0.1 instead.

Initial stable release for Angular 22.

### Features
- Core command palette component (`<cmd-palette />`) with two-line setup
- `provideCommandPalette()` provider function and `CommandPaletteService`
- `ng add` schematic for one-command setup
- Automatic route registration from Angular Router config
- Lazy-load aware route scanning (re-scans as lazy modules load)
- Fuzzy search with scoring for exact, prefix, word boundary, and character matches
- Async search providers with per-provider debounce and loading states
- Prefix routing to scope providers behind prefixes (e.g. `@`, `#`)
- Contextual commands with route-based or dynamic visibility conditions
- Recent commands tracking with localStorage persistence and recency boost
- Built-in themes: `default`, `dark`, `github`, `linear` with visually distinct colour palettes
- Configurable open animations: `scale`, `slide`, `none`
- Theme and animation configurable via provider config, input binding, or CSS class
- Standalone CSS theme files for external use (`themes/dark.css`, `themes/github.css`, `themes/linear.css`)
- `prefers-reduced-motion` support for automatic animation disabling
- WAI-ARIA combobox pattern with focus trapping and screen reader announcements
- Full theming via CSS custom properties
- Signal-based reactive state with Angular signals
- `Cmd+K` / `Ctrl+K` global keyboard shortcut

## Supported Versions

The library is available for Angular 19 through 22. Each version lives on its own branch with the package major version matching the Angular version. See each branch's CHANGELOG for version-specific details.

| Angular | Package  | Branch       | npm tag     |
|---------|----------|--------------|-------------|
| 22      | `22.1.0` | `angular/22` | `latest`    |
| 21      | `21.0.1` | `angular/21` | `angular21` |
| 20      | `20.0.1` | `angular/20` | `angular20` |
| 19      | `19.0.1` | `angular/19` | `angular19` |

# Changelog

> This changelog was generated with the help of [Claude Code](https://claude.ai/claude-code).

All notable changes to this project will be documented in this file.

This project follows [Semantic Versioning](https://semver.org/) with the major version matching the supported Angular version.

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
| 22      | `22.0.2` | `angular/22` | `latest`    |
| 21      | `21.0.1` | `angular/21` | `angular21` |
| 20      | `20.0.1` | `angular/20` | `angular20` |
| 19      | `19.0.1` | `angular/19` | `angular19` |

# Changelog

> This changelog was generated with the help of [Claude Code](https://claude.ai/claude-code).

All notable changes to this project will be documented in this file.

This project follows [Semantic Versioning](https://semver.org/) with the major version matching the supported Angular version.

## [22.0.0] - 2026-06-16

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
| 22      | `22.0.0` | `angular/22` | `latest`    |
| 21      | `21.0.0` | `angular/21` | `angular21` |
| 20      | `20.0.0` | `angular/20` | `angular20` |
| 19      | `19.0.0` | `angular/19` | `angular19` |

# Changelog

All notable changes to this project will be documented in this file.

This project follows [Semantic Versioning](https://semver.org/) with the major version matching the supported Angular version.

## [22.0.0-beta.3] - 2024-06-16

### Added
- Built-in themes: `default`, `dark`, `github`, `linear` with visually distinct colour palettes
- Configurable open animations: `scale`, `slide`, `none`
- Theme and animation configurable via `provideCommandPalette()`, input binding, or CSS class
- Standalone CSS theme files for external use (`themes/dark.css`, `themes/github.css`, `themes/linear.css`)
- Recent commands tracking with localStorage persistence and recency boost in search scoring
- `prefers-reduced-motion` support for automatic animation disabling

### Changed
- Demo site "Appearance" command category renamed to "Palette Appearance" for clarity

### Fixed
- `Ctrl+K` shortcut now works correctly on Windows

## [22.0.0-beta.2] - 2024-06-15

### Added
- `ng add` schematic for one-command setup
- Integration test suite
- Demo/docs site with full feature documentation
- GitHub Pages deployment

### Changed
- Improved responsive styles for the palette dialog

### Fixed
- Glob pattern bug in route scanning
- Signal side effects removed, reduced coupling between services
- Accessibility issues from review (focus trapping, screen reader announcements)

## [22.0.0-beta.1] - 2024-06-14

### Added
- Core command palette component (`<cmd-palette />`)
- `provideCommandPalette()` provider function
- `CommandPaletteService` for registering commands and controlling the palette
- Automatic route registration from Angular Router config
- Lazy-load aware route scanning (re-scans as lazy modules load)
- Fuzzy search with scoring for exact, prefix, word boundary, and character matches
- Async search providers with per-provider debounce and loading states
- Prefix routing to scope providers behind prefixes (e.g. `@`, `#`)
- Contextual commands with route-based or dynamic visibility conditions
- WAI-ARIA combobox pattern with focus trapping and screen reader announcements
- Full theming via CSS custom properties
- Signal-based reactive state with Angular signals
- `Cmd+K` / `Ctrl+K` global keyboard shortcut

## Backports

The library is available for Angular 19 through 22. Each version lives on its own branch with the package major version matching the Angular version.

| Angular | Package        | Branch       | npm tag        |
| ------- | -------------- | ------------ | -------------- |
| 22      | `22.0.0-beta.3` | `angular/22` | `latest`       |
| 21      | `21.0.0-beta.1` | `angular/21` | `angular21`    |
| 20      | `20.0.0-beta.1` | `angular/20` | `angular20`    |
| 19      | `19.0.0-beta.1` | `angular/19` | `angular19`    |

### 21.0.0-beta.1

Port of 22.0.0-beta.3 to Angular 21. Config-only changes (TypeScript 5.9, removed `ignoreDeprecations`). No library source changes.

### 20.0.0-beta.1

Port of 22.0.0-beta.3 to Angular 20. Switched to `@angular-devkit/build-angular` builders and standalone vitest runner with `@analogjs/vite-plugin-angular`. No library source changes.

### 19.0.0-beta.1

Port of 22.0.0-beta.3 to Angular 19. Uses `provideExperimentalZonelessChangeDetection`, `experimentalDecorators`, `moduleResolution: "node"`, and escaped `@` symbols in demo templates for block syntax compatibility. No library source changes.

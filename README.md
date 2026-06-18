# @theryansmee/ngx-command-palette

[![npm version](https://img.shields.io/npm/v/@theryansmee/ngx-command-palette.svg)](https://www.npmjs.com/package/@theryansmee/ngx-command-palette)
[![npm downloads](https://img.shields.io/npm/dw/@theryansmee/ngx-command-palette.svg)](https://www.npmjs.com/package/@theryansmee/ngx-command-palette)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/theryansmee/ngx-command-palette/blob/main/LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@theryansmee/ngx-command-palette)](https://bundlephobia.com/package/@theryansmee/ngx-command-palette)
[![Angular](https://img.shields.io/badge/Angular-22-dd0031)](https://angular.dev)
[![docs](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://theryansmee.github.io/ngx-command-palette/)

A keyboard-driven command palette for Angular. Routes are auto-registered from your Router config - zero setup required. Add custom commands, async search providers, contextual visibility, and full keyboard navigation out of the box.

Inspired by tools like Linear, GitHub, and Raycast.

## Features

- **Auto-registers routes** - walks your Angular Router config and creates searchable commands from every route with a `title`
- **Lazy-load aware** - re-scans routes as lazy modules load
- **Async search providers** - register API-backed search sources with per-provider debounce and loading states
- **Prefix routing** - scope providers behind prefixes (`@` for users, `#` for tickets) so they only fire when needed
- **Contextual commands** - show or hide commands based on the current route or dynamic conditions
- **Fuzzy search** - built-in scoring that ranks exact matches, prefix matches, word boundary matches, and character-by-character fuzzy matches
- **Keyword search** - add extra search terms to any command
- **Recent commands** - tracks recently used commands in localStorage with a configurable recency boost
- **Priority boosting** - manually rank commands higher or lower
- **Keyboard navigation** - Arrow keys, Enter, Escape, Tab - all handled
- **Accessible** - follows the WAI-ARIA combobox pattern with `role="combobox"`, `aria-activedescendant`, and focus trapping
- **Custom item templates** - override row rendering globally or per-category with `ng-template`
- **Fully themeable** - CSS custom properties for every visual aspect
- **SSR-safe** - platform checks for `localStorage` and DOM APIs
- **Standalone components** - no `NgModule` needed
- **Signal-based** - reactive state using Angular signals

## Angular Version Support

Each Angular major version is maintained on its own branch:

| Branch | Angular | Library | npm tag |
|---|---|---|---|
| `angular/19` | 19.x | 19.x.x | `angular19` |
| `angular/20` | 20.x | 20.x.x | `angular20` |
| `angular/21` | 21.x | 21.x.x | `angular21` |
| `angular/22` | 22.x | 22.x.x | `latest` |

The `main` branch tracks the latest stable version.

To install a specific Angular version:

```bash
npm install @theryansmee/ngx-command-palette@angular21
```

## Installation

```bash
ng add @theryansmee/ngx-command-palette
```

This automatically adds `provideCommandPalette()` to your app config, imports `CmdPaletteComponent`, and adds `<cmd-palette />` to your root template.

Or install manually:

```bash
npm install @theryansmee/ngx-command-palette
# or
yarn add @theryansmee/ngx-command-palette
# or
pnpm add @theryansmee/ngx-command-palette
```

### Peer Dependencies

| Package | Version |
|---------|---------|
| `@angular/core` | `^22.0.0` |
| `@angular/common` | `^22.0.0` |
| `@angular/router` | `^22.0.0` |
| `@angular/cdk` | `^22.0.0` |

## Quick Start

### 1. Provide the command palette

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideCommandPalette } from '@theryansmee/ngx-command-palette';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideCommandPalette(),
  ],
};
```

### 2. Add the component to your root template

```html
<!-- app.component.html -->
<cmd-palette />
<router-outlet />
```

### 3. Add titles to your routes

```typescript
// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent, title: 'Dashboard' },
  { path: 'settings', component: SettingsComponent, title: 'Settings' },
  { path: 'profile', component: ProfileComponent, title: 'Profile' },
];
```

That's it. Press `Cmd+K` (or `Ctrl+K`) and all your titled routes are searchable.

## Configuration

Pass a config object to `provideCommandPalette()` to customize behavior:

```typescript
provideCommandPalette({
  shortcut: 'mod.k',            // Keyboard shortcut to open (default: 'mod.k')
  placeholder: 'Search...',     // Input placeholder text (default: 'Search or type a command...')
  autoRegisterRoutes: true,     // Auto-register routes from Router config (default: true)
  maxResults: 10,               // Maximum search results shown (default: 10)
  trackRecent: true,            // Track recently used commands (default: false)
  recentCount: 5,               // Number of recent commands to track (default: 5)
  debounce: 150,                // Input debounce in milliseconds (default: 0)
  animation: 'scale',           // Open animation: 'scale' | 'slide' | 'none' (default: 'scale')
  theme: 'default',             // Built-in theme: 'default' | 'dark' | 'github' | 'linear'
});
```

### Shortcut Format

The shortcut string uses dot-separated modifier keys followed by the key:

| Shortcut | Keys |
|----------|------|
| `mod.k` | Cmd+K (Mac) / Ctrl+K (Windows/Linux) |
| `meta.k` | Cmd+K (Mac) / Win+K (Windows) |
| `ctrl.k` | Ctrl+K |
| `ctrl.shift.p` | Ctrl+Shift+P |
| `meta.shift.p` | Cmd+Shift+P |
| `alt.shift.k` | Alt+Shift+K |

## Route Configuration

### Basic Routes

Routes with a `title` property are auto-registered with no extra config:

```typescript
{ path: 'dashboard', component: DashboardComponent, title: 'Dashboard' }
// -> Appears as "Dashboard" in the palette, navigates to /dashboard
```

Routes without a `title` still get registered - the label is generated from the path:

```typescript
{ path: 'user-settings', component: UserSettingsComponent }
// -> Appears as "User Settings" in the palette
```

### Enriching Routes

Add a `commandPalette` object to `data` to customize how a route appears:

```typescript
{
  path: 'settings/billing',
  component: BillingComponent,
  title: 'Billing',
  data: {
    commandPalette: {
      label: 'Billing & Payments',           // Override the display label
      category: 'Settings',                   // Override the default "Pages" category
      keywords: ['invoice', 'payment', 'subscription'],  // Extra search terms
      priority: 5,                            // Higher = appears first
    },
  },
}
```

### Excluding Routes

Set `commandPalette` to `false` to exclude a route:

```typescript
{
  path: 'admin/debug',
  component: DebugComponent,
  title: 'Debug Panel',
  data: { commandPalette: false },
}
```

### Parameterized Routes

Routes with parameters (e.g. `:id`) are automatically skipped unless you provide an explicit `commandPalette` config:

```typescript
// This route is SKIPPED (has :id, no commandPalette config)
{ path: 'users/:id', component: UserDetailComponent, title: 'User Detail' }

// This route is INCLUDED (explicit config provided)
{
  path: 'users/:id',
  component: UserDetailComponent,
  title: 'User Detail',
  data: {
    commandPalette: {
      label: 'View User',
    },
  },
}
```

### Wildcard and Redirect Routes

Wildcard (`**`) and redirect (`redirectTo`) routes are always excluded automatically.

### Child Routes

Child routes are walked recursively and registered with their full path:

```typescript
{
  path: 'admin',
  component: AdminComponent,
  title: 'Admin',
  children: [
    { path: 'users', component: AdminUsersComponent, title: 'Users' },
    { path: 'roles', component: AdminRolesComponent, title: 'Roles' },
  ],
}
// Registers: "Admin" (/admin), "Users" (/admin/users), "Roles" (/admin/roles)
```

### Lazy-Loaded Routes

The palette automatically re-scans routes when lazy modules are loaded. Routes inside `loadChildren` become available once the module has been loaded at least once.

## Custom Commands

### Registering Commands

Inject `CommandPaletteService` and call `register()` to add custom commands:

```typescript
import { Component, inject, DestroyRef } from '@angular/core';
import { CommandPaletteService } from '@theryansmee/ngx-command-palette';

@Component({ ... })
export class ProjectListComponent {
  readonly #palette = inject(CommandPaletteService);
  readonly #destroyRef = inject(DestroyRef);

  constructor() {
    this.#palette.register(
      [
        {
          id: 'create-project',
          label: 'Create New Project',
          category: 'Actions',
          shortcut: 'Cmd+N',
          keywords: ['new', 'add'],
          priority: 10,
          action: () => this.openCreateDialog(),
        },
        {
          id: 'export-csv',
          label: 'Export Projects as CSV',
          category: 'Actions',
          action: () => this.exportService.exportCSV(),
        },
      ],
      this.#destroyRef,  // Commands auto-deregister when the component is destroyed
    );
  }
}
```

### Auto-Cleanup with DestroyRef

When you pass a `DestroyRef` as the second argument to `register()`, the commands are automatically deregistered when the component or service is destroyed. This is the recommended approach for component-scoped commands.

```typescript
// Commands exist only while this component is alive
this.palette.register(commands, this.destroyRef);
```

Without a `DestroyRef`, commands persist until manually deregistered or the app is destroyed.

### Contextual Commands

Commands can be scoped to specific routes or dynamic conditions using the `context` property:

```typescript
this.palette.register(
  [
    {
      id: 'delete-project',
      label: 'Delete Project',
      category: 'Danger',
      action: () => this.deleteProject(),
      context: {
        routes: ['/projects/*'],       // Only visible on /projects/* pages
        when: () => this.canDelete(),  // And only when the user has permission
      },
    },
  ],
  this.destroyRef,
);
```

Context rules:

- **`routes`** - an array of glob patterns matched against the current URL. Supports `*` (single segment) and `**` (any depth).
- **`when`** - a function that returns `boolean`. Re-evaluated each time the palette opens or the query changes.
- If both are provided, both must pass for the command to be visible.
- Commands without a `context` are always visible.

### Command Interface

```typescript
interface Command {
  id: string;                              // Unique identifier
  label: string;                           // Display text
  category?: string;                       // Group heading (e.g. "Pages", "Actions")
  icon?: string;                           // Icon name or identifier
  keywords?: string[];                     // Additional search terms
  shortcut?: string;                       // Display-only shortcut hint (e.g. "Cmd+N")
  action: () => void | Promise<void>;      // What happens when the command is executed
  priority?: number;                       // Ranking boost (higher = appears first)
  context?: {
    routes?: string[];                     // Glob patterns for route visibility
    when?: () => boolean;                  // Dynamic visibility check
  };
  data?: Record<string, unknown>;          // Arbitrary metadata for custom templates
}
```

## Async Search Providers

Register API-backed search sources that return results asynchronously. Results are merged with static commands and grouped by category.

### Basic Provider (Universal)

A provider without a `prefix` fires on every query:

```typescript
import { Component, inject, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { CommandPaletteService } from '@theryansmee/ngx-command-palette';

@Component({ ... })
export class AppComponent {
  readonly #palette = inject(CommandPaletteService);
  readonly #destroyRef = inject(DestroyRef);
  readonly #http = inject(HttpClient);

  constructor() {
    this.#palette.registerProvider(
      {
        id: 'doc-search',
        category: 'Documentation',
        minQueryLength: 2,
        debounce: 300,
        search: (query) => this.#http.get<Doc[]>(`/api/docs?q=${query}`).pipe(
          map(docs => docs.map(doc => ({
            id: `doc:${doc.id}`,
            label: doc.title,
            action: () => window.open(doc.url),
          }))),
        ),
      },
      this.#destroyRef,
    );
  }
}
```

### Prefixed Provider

A provider with a `prefix` only fires when the user types that prefix. This prevents unnecessary API calls when you have many providers:

```typescript
this.palette.registerProvider(
  {
    id: 'user-search',
    category: 'Users',
    prefix: '@',                    // Only fires when query starts with @
    minQueryLength: 2,
    debounce: 300,
    search: (query) => this.userService.search(query).pipe(
      map(users => users.map(user => ({
        id: `user:${user.id}`,
        label: user.name,
        icon: 'person',
        action: () => this.router.navigate(['/users', user.id]),
      }))),
    ),
  },
  this.destroyRef,
);

this.palette.registerProvider(
  {
    id: 'ticket-search',
    category: 'Tickets',
    prefix: '#',                    // Only fires when query starts with #
    minQueryLength: 1,
    debounce: 200,
    search: (query) => this.ticketService.search(query).pipe(
      map(tickets => tickets.map(ticket => ({
        id: `ticket:${ticket.id}`,
        label: `${ticket.key}: ${ticket.title}`,
        action: () => this.router.navigate(['/tickets', ticket.id]),
      }))),
    ),
  },
  this.destroyRef,
);
```

With the above, typing `@john` only hits the user API, typing `#billing` only hits the ticket API, and typing `dashboard` only searches static commands. The prefix is stripped before being passed to the provider's `search` function.

Registered prefixes are automatically shown as hints in the palette footer.

### SearchProvider Interface

```typescript
interface SearchProvider {
  id: string;                                        // Unique identifier
  category: string;                                  // Group heading for results
  search: (query: string) => Observable<Command[]>;  // The search function
  prefix?: string;                                   // Prefix trigger (e.g. '@', '#')
  debounce?: number;                                 // Debounce in ms (default: 300)
  minQueryLength?: number;                           // Minimum chars before searching (default: 1)
  order?: number;                                    // Category sort order
}
```

### Loading State

The palette shows a "Searching..." indicator while async providers are in-flight. You can also read the loading state programmatically:

```typescript
const isLoading: boolean = this.palette.loading();
```

## Custom Item Templates

> Available from v22.0.1

By default, each result row renders an icon, label, and shortcut badge. For richer results (avatars, status badges, descriptions, etc.) you can provide custom templates that override how items are rendered while keeping all keyboard navigation, accessibility, and active-state behavior intact.

### Global Template

A template without a category value applies to all result items:

```html
<cmd-palette>
  <ng-template cmdItemTemplate let-command let-active="active">
    <img [src]="command.data?.['avatar']" class="avatar" />
    <div class="details">
      <span>{{ command.label }}</span>
      <span class="description">{{ command.data?.['description'] }}</span>
    </div>
  </ng-template>
</cmd-palette>
```

### Per-Category Template

Provide a category name to scope the template to a specific group. Items in other categories fall back to the default rendering:

```html
<cmd-palette>
  <ng-template cmdItemTemplate="Jira Issues" let-command let-active="active">
    <span class="status-badge" [class]="command.data?.['status']">
      {{ command.data?.['status'] }}
    </span>
    <span>{{ command.label }}</span>
    <span class="ticket-id">{{ command.data?.['ticketId'] }}</span>
  </ng-template>

  <ng-template cmdItemTemplate="Team Members" let-command let-active="active">
    <img [src]="command.data?.['avatar']" class="avatar" />
    <span>{{ command.label }}</span>
    <span class="role">{{ command.data?.['role'] }}</span>
  </ng-template>
</cmd-palette>
```

### Resolution Order

When rendering an item, the palette resolves its template in this order:

1. **Category-specific template** matching the item's `category`
2. **Global template** (one with no category value)
3. **Built-in default** (icon + label + shortcut)

### Template Context

Each template receives the following context variables:

| Variable | Type | Access | Description |
|----------|------|--------|-------------|
| `$implicit` | `Command` | `let-command` | The command object for this row |
| `active` | `boolean` | `let-active="active"` | Whether this row is the currently selected item |

### Using the `data` Property

The `data` property on `Command` is an optional `Record<string, unknown>` for attaching arbitrary metadata that your custom templates can render. Search providers are the primary use case:

```typescript
this.palette.registerProvider(
  {
    id: 'ticket-search',
    category: 'Jira Issues',
    search: (query) => this.ticketService.search(query).pipe(
      map(tickets => tickets.map(ticket => ({
        id: `ticket:${ticket.id}`,
        label: ticket.title,
        action: () => this.router.navigate(['/tickets', ticket.id]),
        data: {
          ticketId: ticket.key,
          status: ticket.status,
          assignee: ticket.assignee,
        },
      }))),
    ),
  },
  this.destroyRef,
);
```

### Importing the Directive

The `CmdItemTemplateDirective` is standalone. Import it in the component where you use `<cmd-palette>`:

```typescript
import { CmdPaletteComponent, CmdItemTemplateDirective } from '@theryansmee/ngx-command-palette';

@Component({
  imports: [CmdPaletteComponent, CmdItemTemplateDirective],
  // ...
})
export class AppComponent {}
```

## Programmatic Control

```typescript
const palette = inject(CommandPaletteService);

// Open the palette
palette.open();

// Open with a pre-filled query
palette.open('settings');

// Close the palette
palette.close();

// Toggle open/closed
palette.toggle();

// Update the search query
palette.updateQuery('dashboard');

// Execute a command programmatically
palette.execute(someCommand);

// Read current state (signals)
const isOpen: boolean = palette.isOpen();
const query: string = palette.query();
const results: ScoredCommand[] = palette.results();
const isLoading: boolean = palette.loading();
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Cmd+K` / `Ctrl+K` | Open the palette (configurable) |
| `Escape` | Close the palette |
| `Arrow Down` / `Tab` | Move selection down |
| `Arrow Up` | Move selection up |
| `Enter` | Execute the selected command |

## Search & Ranking

The built-in search engine uses a multi-signal scoring approach:

### Scoring Breakdown

| Signal | Score Range | Description |
|--------|-------------|-------------|
| Exact label match | 100 | Query matches the label exactly |
| Label starts with query | 80 | Label begins with the query |
| Word boundary match | 60 | Query matches at a word boundary |
| Fuzzy substring match | 40 | Characters appear in order within the label |
| Fuzzy character match | 0-35 | Characters match with gaps (consecutive matches score higher) |
| Keyword match | Capped below label | Keywords contribute but never outrank a label match |
| Recent command boost | +4 to +20 | Recently used commands get a boost (most recent = highest) |
| Priority boost | `priority * 10` | Manual priority multiplier |

When the query is empty, commands are sorted by priority (highest first) and limited to `maxResults`.

## Theming

### Built-in Themes

Four themes ship out of the box. Set via config for a permanent theme:

```typescript
provideCommandPalette({
  theme: 'github',   // 'default' | 'dark' | 'github' | 'linear'
});
```

Or bind the `theme` input for dynamic runtime switching:

```html
<cmd-palette [theme]="activeTheme()" />
```

Or apply a theme via CSS class on any ancestor element:

```html
<body class="cmd-theme-dark">
  <cmd-palette />
</body>
```

When using the CSS class approach, import the theme file in your global styles:

```css
@import '@theryansmee/ngx-command-palette/themes/dark.css';
```

| Theme | Description | CSS file |
|-------|-------------|----------|
| `default` | Clean light theme | n/a (built-in) |
| `dark` | Neutral dark background with light text | `themes/dark.css` |
| `github` | Dark theme inspired by GitHub's command palette | `themes/github.css` |
| `linear` | Minimal dark theme inspired by Linear | `themes/linear.css` |

### Animations

The palette opens with a configurable animation:

```typescript
provideCommandPalette({
  animation: 'scale',   // 'scale' | 'slide' | 'none'
});

// Or dynamically via input:
// <cmd-palette [animation]="activeAnimation()" />
```

Animations are automatically disabled when the user has `prefers-reduced-motion` enabled.

### CSS Custom Properties

The palette uses CSS custom properties for full visual control. Override any variable on the `cmd-palette` selector or a parent element:

```css
cmd-palette {
  /* Backdrop */
  --cmd-backdrop: rgba(0, 0, 0, 0.5);

  /* Dialog */
  --cmd-bg: #ffffff;
  --cmd-border: #e2e8f0;
  --cmd-border-radius: 12px;
  --cmd-shadow: 0 16px 70px rgba(0, 0, 0, 0.2);
  --cmd-width: 640px;
  --cmd-max-height: 400px;

  /* Input */
  --cmd-input-padding: 16px;
  --cmd-input-font-size: 16px;
  --cmd-input-color: #1a1a1a;
  --cmd-input-placeholder: #64748b;

  /* Items */
  --cmd-item-padding: 10px 16px;
  --cmd-item-color: #334155;
  --cmd-item-hover-bg: #f1f5f9;
  --cmd-item-active-bg: #e2e8f0;

  /* Group headings */
  --cmd-group-heading-color: #64748b;
  --cmd-group-heading-size: 12px;

  /* Shortcut badges */
  --cmd-shortcut-bg: #f1f5f9;
  --cmd-shortcut-color: #64748b;
  --cmd-shortcut-border: #e2e8f0;

  /* Empty state */
  --cmd-empty-color: #64748b;
}
```

### Dark Theme Example

```css
.dark cmd-palette,
cmd-palette.dark {
  --cmd-backdrop: rgba(0, 0, 0, 0.7);
  --cmd-bg: #1e1e2e;
  --cmd-border: #313244;
  --cmd-shadow: 0 16px 70px rgba(0, 0, 0, 0.5);
  --cmd-input-color: #cdd6f4;
  --cmd-input-placeholder: #6c7086;
  --cmd-item-color: #cdd6f4;
  --cmd-item-hover-bg: #313244;
  --cmd-item-active-bg: #45475a;
  --cmd-group-heading-color: #a6adc8;
  --cmd-shortcut-bg: #313244;
  --cmd-shortcut-color: #a6adc8;
  --cmd-shortcut-border: #45475a;
  --cmd-empty-color: #6c7086;
}
```

## Accessibility

The palette follows the [WAI-ARIA combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) out of the box with no configuration needed. Focus trapping, focus restoration, screen reader announcements, keyboard navigation, and active item scrolling all work automatically.

## API Reference

### `provideCommandPalette(config?)`

Environment provider factory. Call in your `appConfig.providers` array.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `shortcut` | `string` | `'mod.k'` | Keyboard shortcut to open the palette |
| `placeholder` | `string` | `'Search or type a command...'` | Input placeholder text |
| `autoRegisterRoutes` | `boolean` | `true` | Auto-register routes from Router config |
| `maxResults` | `number` | `10` | Maximum results shown |
| `trackRecent` | `boolean` | `false` | Track recently used commands and boost them in results |
| `recentCount` | `number` | `5` | Number of recent commands tracked (requires `trackRecent: true`) |
| `debounce` | `number` | `0` | Input debounce in milliseconds |
| `animation` | `'scale' \| 'slide' \| 'none'` | `'scale'` | Open animation style |
| `theme` | `'default' \| 'dark' \| 'github' \| 'linear'` | `'default'` | Built-in colour theme |

### `CommandPaletteService`

The main service for interacting with the palette.

| Method | Signature | Description |
|--------|-----------|-------------|
| `open` | `(initialQuery?: string) => void` | Opens the palette, optionally with a pre-filled query |
| `close` | `() => void` | Closes the palette and clears the query |
| `toggle` | `() => void` | Toggles the palette open/closed |
| `updateQuery` | `(query: string) => void` | Updates the search query |
| `execute` | `(command: Command) => void` | Executes a command, records it as recent, and closes |
| `register` | `(commands: Command[], destroyRef?: DestroyRef) => void` | Registers static commands with optional auto-cleanup |
| `registerProvider` | `(provider: SearchProvider, destroyRef?: DestroyRef) => void` | Registers an async search provider with optional auto-cleanup |

| Signal | Type | Description |
|--------|------|-------------|
| `isOpen` | `Signal<boolean>` | Whether the palette is currently open |
| `query` | `Signal<string>` | The current search query |
| `results` | `Signal<ScoredCommand[]>` | The current search results (scored and sorted) |
| `loading` | `Signal<boolean>` | Whether any async provider is currently searching |

### `CmdPaletteComponent`

The root component. Add it once in your app root template.

```html
<cmd-palette />
```

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `theme` | `CommandPaletteTheme` | config value | Override the theme for this instance |
| `animation` | `CommandPaletteAnimation` | config value | Override the animation for this instance |

**Content projection:** Place `<ng-template cmdItemTemplate>` elements inside `<cmd-palette>` to customize item rendering. See [Custom Item Templates](#custom-item-templates).

### `CmdItemTemplateDirective`

> Available from v22.0.1

Structural directive used on `<ng-template>` to define custom item templates.

```html
<ng-template cmdItemTemplate let-command let-active="active">...</ng-template>
<ng-template cmdItemTemplate="Category Name" let-command let-active="active">...</ng-template>
```

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `cmdItemTemplate` | `string` | `''` | Category name to scope the template to. Empty string applies to all items. |

### `CmdItemTemplateContext`

> Available from v22.0.1

The type-safe context interface for custom item templates.

```typescript
interface CmdItemTemplateContext {
  $implicit: Command;  // Available via let-command (or any variable name)
  active: boolean;     // Available via let-active="active"
}
```

## License

MIT

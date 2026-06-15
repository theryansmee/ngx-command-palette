# Backport Plan: Angular 21, 20, 19

Port `ngx-command-palette` from Angular 22 (main) to Angular 21, 20, and 19. Each version gets its own long-lived branch following the `angular/<version>` convention from `ngx-virtual-grid`.

## Branch Strategy

```
main (Angular 22) ← latest, demo site deploys from here
├── angular/21
├── angular/20
└── angular/19
```

- Package major version matches Angular major version (e.g. `21.0.0-beta.1` for Angular 21)
- Each branch is independent after creation. Bug fixes get cherry-picked down as needed.
- CI already runs on `angular/*` branches (`.github/workflows/ci.yml`)
- Demo site only deploys from `main`

## API Compatibility Assessment

All Signal APIs used in the library (`signal()`, `computed()`, `effect()`, `input()`, `output()`, `viewChild()`, `inject()`, `untracked()`, `DestroyRef`, `takeUntilDestroyed`) are stable in Angular 17+. **No source code changes are needed for 19, 20, or 21.** The port is purely config and dependency changes.

The `@angular/cdk` imports (`A11yModule`, `OverlayModule`, `PortalModule`) are available in all target versions.

## What Changes Per Version

| Concern | Angular 22 (main) | Angular 21 | Angular 20 | Angular 19 |
|---|---|---|---|---|
| **TypeScript** | ~6.0.3 | ~5.9.3 | ~5.8.3 | ~5.8.3 |
| **Build builder** | `@angular/build:ng-packagr` | `@angular/build:ng-packagr` | `@angular-devkit/build-angular:ng-packagr` | `@angular-devkit/build-angular:ng-packagr` |
| **Test builder** | `@angular/build:unit-test` | `@angular/build:unit-test` | `@angular-devkit/build-angular:web-test-runner` | `@angular-devkit/build-angular:web-test-runner` |
| **App builder** | `@angular/build:application` | `@angular/build:application` | `@angular-devkit/build-angular:application` | `@angular-devkit/build-angular:application` |
| **Dev server** | `@angular/build:dev-server` | `@angular/build:dev-server` | `@angular-devkit/build-angular:dev-server` | `@angular-devkit/build-angular:dev-server` |
| **tsconfig** | `ignoreDeprecations: "6.0"`, no `experimentalDecorators` | no `ignoreDeprecations`, no `experimentalDecorators` | `experimentalDecorators: true`, add `lib` array | `experimentalDecorators: true`, add `lib` array, `moduleResolution: "node"` |
| **pnpm** | 11.3.0 | 11.3.0 | 11.3.0 | 9.15.9 |
| **zone.js** | not needed | not needed | dependency (devDep) | dependency (dep + devDep) |
| **eslint** | eslint 9, flat config, `angular-eslint` pkg | eslint 9, flat config, `angular-eslint` pkg | eslint 9, flat config, `angular-eslint` pkg | eslint 8, flat config (may need minor adjustments) |
| **@angular-devkit/core** | ^22 (for schematics) | ^21 | ^20 | ^19 |
| **@angular-devkit/schematics** | ^22 | ^21 | ^20 | ^19 |
| **@schematics/angular** | ^22 | ^21 | ^20 | ^19 |
| **Node.js** | 22 | 22 | 22 (or 20) | 22 (or 20) |
| **Source code** | as-is | as-is | as-is | as-is |

## Execution Order

Start with Angular 21 (closest to 22, fewest changes), then 20, then 19.

---

## Phase 1: Angular 21

### 1.1 Create branch
```bash
git checkout main
git checkout -b angular/21
```

### 1.2 Update `package.json` (workspace root)
- All `@angular/*` packages: `~22.0.0` -> latest `~21.x.x`
- `@angular/build`: `~22.0.0` -> `~21.x.x`
- `@angular/cli`: `~22.0.0` -> `~21.x.x`
- `@angular/compiler-cli`: `~22.0.0` -> `~21.x.x`
- `ng-packagr`: `~22.0.0` -> `~21.x.x`
- `typescript`: `~6.0.3` -> `~5.9.3`
- `@angular-devkit/core`: `^22` -> `^21`
- `@angular-devkit/schematics`: `^22` -> `^21`
- `@schematics/angular`: `^22` -> `^21`
- `@angular-eslint/*` and `angular-eslint`: `^22` -> `^21`
- `@angular/cdk`: `~22.0.0` -> `~21.x.x`

### 1.3 Update `tsconfig.json`
- Remove `"ignoreDeprecations": "6.0"` (only needed for TS 6)

### 1.4 Update `projects/ngx-command-palette/package.json`
- Version: `21.0.0-beta.1`
- Peer deps: all `^22.0.0` -> `^21.0.0`
- Update `angular22` keyword to `angular21`

### 1.5 angular.json
- No changes needed. Angular 21 uses the same `@angular/build:ng-packagr` and `@angular/build:unit-test` builders.

### 1.6 Install, build, test
```bash
pnpm install
pnpm -w run build:lib
pnpm -w run test
pnpm -w run lint
```

### 1.7 Commit and push
```bash
git add -A
git commit -m "Port to Angular 21"
git push -u origin angular/21
```

### 1.8 Publish
```bash
npm publish dist/ngx-command-palette --access public --tag angular21
```

---

## Phase 2: Angular 20

### 2.1 Create branch
```bash
git checkout angular/21
git checkout -b angular/20
```

### 2.2 Update `package.json` (workspace root)
- All `@angular/*` packages: -> latest `~20.x.x`
- **Remove** `@angular/build` (does not exist for Angular 20)
- **Add** `@angular-devkit/build-angular`: `~20.x.x`
- `ng-packagr`: -> `~20.x.x`
- `typescript`: `~5.9.3` -> `~5.8.3`
- `@angular-devkit/core`: `^21` -> `^20`
- `@angular-devkit/schematics`: `^21` -> `^20`
- `@schematics/angular`: `^21` -> `^20`
- `@angular-eslint/*` and `angular-eslint`: -> `^20`
- **Add** `zone.js: ~0.15.1` to devDependencies
- **Add** `@web/test-runner: ^0.20.2` and `@web/test-runner-core: ^0.13.4` to devDependencies
- **Remove** `vitest` and `jsdom` (Angular 20 uses web-test-runner, not vitest natively)

### 2.3 Update `tsconfig.json`
- Add `"experimentalDecorators": true`
- Add `"lib": ["es2022", "dom"]`

### 2.4 Update `angular.json`
- Library build builder: `@angular/build:ng-packagr` -> `@angular-devkit/build-angular:ng-packagr`
- Library test builder: `@angular/build:unit-test` -> `@angular-devkit/build-angular:web-test-runner`
  - Add `polyfills: ["zone.js", "zone.js/testing"]` to test options
- Demo build builder: `@angular/build:application` -> `@angular-devkit/build-angular:application`
- Demo serve builder: `@angular/build:dev-server` -> `@angular-devkit/build-angular:dev-server`

### 2.5 Test runner migration
This is the biggest change. Angular 20 does not have `@angular/build:unit-test` which runs vitest. Two options:

**Option A: Keep vitest (recommended)**
Keep vitest and jsdom. Do NOT use the `@angular-devkit/build-angular:web-test-runner` builder for tests. Instead, run vitest directly:
- Keep `vitest` and `jsdom` in devDependencies
- Change the test script in package.json to `vitest run --project projects/ngx-command-palette`
- Add a `vitest.config.ts` at the workspace root
- Remove the test architect entry from angular.json (or keep it as web-test-runner for compatibility)

**Option B: Migrate to web-test-runner + Jasmine**
- Rewrite all `describe/it/expect/vi` imports from vitest to Jasmine equivalents
- Replace `vi.fn()` with `jasmine.createSpy()`
- Replace `vi.useFakeTimers()` with `jasmine.clock().install()`
- This is a lot of work for 10 spec files

**Recommendation:** Go with Option A. Vitest works independently of Angular's build system. Just need a vitest config that handles Angular compilation.

### 2.6 Update library `package.json`
- Version: `20.0.0-beta.1`
- Peer deps: all `^21.0.0` -> `^20.0.0`
- Update keyword to `angular20`

### 2.7 Install, build, test, publish

---

## Phase 3: Angular 19

### 3.1 Create branch
```bash
git checkout angular/20
git checkout -b angular/19
```

### 3.2 Update `package.json` (workspace root)
- All `@angular/*` packages: -> latest `~19.x.x`
- `@angular-devkit/build-angular`: -> `~19.x.x`
- `ng-packagr`: -> `~19.x.x`
- `typescript`: stays `~5.8.3`
- `@angular-devkit/core`: -> `^19`
- `@angular-devkit/schematics`: -> `^19`
- `@schematics/angular`: -> `^19`
- `@angular-eslint/*`: -> `^19`
- `angular-eslint`: check if the unified package exists for v19, may need individual packages only
- `eslint`: `^9` -> `^8` (Angular 19's angular-eslint may need eslint 8)
- `pnpm` in `packageManager`: `11.3.0` -> `9.15.9` (Angular 19 era)
- Move `zone.js` from devDependencies to dependencies (Angular 19 still requires it at runtime)

### 3.3 Update `tsconfig.json`
- Change `"moduleResolution": "bundler"` -> `"moduleResolution": "node"` (Angular 19 convention)

### 3.4 Update library `package.json`
- Version: `19.0.0-beta.1`
- Peer deps: all `^20.0.0` -> `^19.0.0`
- Update keyword to `angular19`

### 3.5 Update `.nvmrc`
- Keep `22` (Node 22 works fine with Angular 19)

### 3.6 eslint config
- May need adjustments if angular-eslint v19 does not export a unified `angular-eslint` package. Check and adapt the flat config imports.

### 3.7 Install, build, test, publish

---

## npm Tag Strategy

| Branch | npm tag | Example |
|---|---|---|
| main (Angular 22) | `latest` | `22.0.0-beta.3` |
| angular/21 | `angular21` | `21.0.0-beta.1` |
| angular/20 | `angular20` | `20.0.0-beta.1` |
| angular/19 | `angular19` | `19.0.0-beta.1` |

Users install with:
```bash
# Angular 22 (default)
npm install @theryansmee/ngx-command-palette

# Specific Angular version
npm install @theryansmee/ngx-command-palette@angular21
npm install @theryansmee/ngx-command-palette@angular20
npm install @theryansmee/ngx-command-palette@angular19
```

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Vitest not working with Angular 20/19 build pipeline | High | Option A above. Vitest runs independently of Angular CLI builders. May need `@analogjs/vite-plugin-angular` or equivalent for compilation. |
| `@angular/cdk` version mismatch | Low | CDK versions match Angular versions. Just update the version number. |
| eslint config incompatibility on v19 | Low | Worst case: temporarily simplify eslint config on that branch. |
| Schematics (`ng add`) break on older CLI | Medium | Test manually. The schematic is simple (just modifies app config), should work across versions. |
| `#` private fields with older TS | None | ES2022 private fields work in TS 5.8+, target is es2022 on all branches. |

## Checklist Per Branch

- [ ] Create branch from parent
- [ ] Update all Angular package versions
- [ ] Update TypeScript version
- [ ] Update build tooling (builders, tsconfig)
- [ ] Update library package.json (version, peer deps, keywords)
- [ ] `pnpm install` (regenerate lockfile)
- [ ] `pnpm -w run build:lib` passes
- [ ] `pnpm -w run test` passes (all 108 tests)
- [ ] `pnpm -w run lint` passes
- [ ] Commit, push branch
- [ ] Publish to npm with version-specific tag

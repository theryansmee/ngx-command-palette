import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component, DestroyRef, PLATFORM_ID } from '@angular/core';
import { provideRouter, Router, Routes } from '@angular/router';
import { describe, it, expect, beforeEach, vi, afterEach, MockInstance } from 'vitest';
import { of, delay } from 'rxjs';
import { CommandPaletteService } from './services/command-palette.service';
import { ProviderRegistry } from './services/provider-registry';
import { AsyncSearchCoordinator } from './services/async-search';
import { RouterCommandExtractor } from './services/router-extractor';
import { CmdPaletteComponent } from './components/palette/palette.component';
import { COMMAND_PALETTE_CONFIG } from './provide';
import { Command, CommandPaletteConfig, ScoredCommand } from './models/command';

@Component({
	standalone: true,
	template: '',
})
class DummyComponent {}

@Component({
	standalone: true,
	imports: [CmdPaletteComponent],
	template: '<cmd-palette />',
})
class PaletteHostComponent {}

const testRoutes: Routes = [
	{
		path: '',
		redirectTo: 'dashboard',
		pathMatch: 'full', 
	},
	{
		path: 'dashboard',
		component: DummyComponent,
		title: 'Dashboard', 
	},
	{
		path: 'settings',
		component: DummyComponent,
		title: 'Settings', 
	},
	{
		path: 'settings/billing',
		component: DummyComponent,
		title: 'Billing',
		data: {
			commandPalette: {
				label: 'Billing & Payments',
				keywords: [
					'invoice',
					'payment',
				],
				category: 'Settings',
			},
		},
	},
	{
		path: 'profile',
		component: DummyComponent,
		title: 'Profile', 
	},
	{
		path: 'users/:id',
		component: DummyComponent,
		title: 'User Detail',
		data: { commandPalette: false },
	},
];

const config: CommandPaletteConfig = {
	maxResults: 10,
	trackRecent: true,
	recentCount: 5,
	autoRegisterRoutes: false,
};

function makeCommand(overrides: Partial<Command> = {}): Command {
	return {
		id: overrides.id ?? 'test',
		label: overrides.label ?? 'Test',
		action: overrides.action ?? ((): void => {}),
		...overrides,
	};
}

describe('Integration', () => {
	let service: CommandPaletteService;
	let providerRegistry: ProviderRegistry;
	let asyncSearch: AsyncSearchCoordinator;
	let extractor: RouterCommandExtractor;
	let router: Router;

	beforeEach(() => {
		vi.useFakeTimers();
		localStorage.clear();

		TestBed.configureTestingModule({
			providers: [
				{
					provide: PLATFORM_ID,
					useValue: 'browser', 
				},
				{
					provide: COMMAND_PALETTE_CONFIG,
					useValue: config, 
				},
				provideRouter(testRoutes),
			],
		});

		service = TestBed.inject(CommandPaletteService);
		providerRegistry = TestBed.inject(ProviderRegistry);
		asyncSearch = TestBed.inject(AsyncSearchCoordinator);
		extractor = TestBed.inject(RouterCommandExtractor);
		router = TestBed.inject(Router);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('route extraction through the full stack', () => {
		beforeEach(() => {
			extractor.init();
		});

		it('should auto-extract routes and make them searchable via the service', () => {
			service.updateQuery('dashboard');

			const results: ScoredCommand[] = service.results();
			const ids: string[] = results.map((result: ScoredCommand) => result.command.id);
			expect(ids).toContain('route:dashboard');
		});

		it('should apply custom labels from route commandPalette data', () => {
			service.updateQuery('billing');

			const results: ScoredCommand[] = service.results();
			const billingResult: ScoredCommand | undefined = results.find(
				(result: ScoredCommand) => result.command.id === 'route:settings/billing',
			);
			expect(billingResult).toBeDefined();
			expect(billingResult!.command.label).toBe('Billing & Payments');
		});

		it('should find routes via keywords from commandPalette data', () => {
			service.updateQuery('invoice');

			const results: ScoredCommand[] = service.results();
			const ids: string[] = results.map((result: ScoredCommand) => result.command.id);
			expect(ids).toContain('route:settings/billing');
		});

		it('should exclude routes with commandPalette set to false', () => {
			service.updateQuery('');

			const results: ScoredCommand[] = service.results();
			const ids: string[] = results.map((result: ScoredCommand) => result.command.id);
			expect(ids).not.toContain('route:users/:id');
		});

		it('should return both route commands and custom commands in results', () => {
			service.register([
				makeCommand({
					id: 'custom-action',
					label: 'Export Data', 
				}),
			]);
			service.updateQuery('');

			const results: ScoredCommand[] = service.results();
			const ids: string[] = results.map((result: ScoredCommand) => result.command.id);
			expect(ids).toContain('route:dashboard');
			expect(ids).toContain('custom-action');
		});
	});

	describe('contextual commands with routing', () => {
		beforeEach(() => {
			extractor.init();
		});

		it('should show contextual commands when on a matching route', () => {
			Object.defineProperty(router, 'url', {
				get: () => '/dashboard',
				configurable: true, 
			});

			service.register([
				makeCommand({
					id: 'dashboard-export',
					label: 'Export Dashboard',
					context: { routes: ['/dashboard'] },
				}),
			]);

			service.updateQuery('export');

			const results: ScoredCommand[] = service.results();
			const ids: string[] = results.map((result: ScoredCommand) => result.command.id);
			expect(ids).toContain('dashboard-export');
		});

		it('should hide contextual commands when on a different route', () => {
			Object.defineProperty(router, 'url', {
				get: () => '/profile',
				configurable: true, 
			});

			service.register([
				makeCommand({
					id: 'dashboard-export',
					label: 'Export Dashboard',
					context: { routes: ['/dashboard'] },
				}),
			]);

			service.updateQuery('export');

			const results: ScoredCommand[] = service.results();
			const ids: string[] = results.map((result: ScoredCommand) => result.command.id);
			expect(ids).not.toContain('dashboard-export');
		});

		it('should show glob-matched contextual commands on nested routes', () => {
			Object.defineProperty(router, 'url', {
				get: () => '/settings/billing',
				configurable: true, 
			});

			service.register([
				makeCommand({
					id: 'reset-settings',
					label: 'Reset Settings',
					context: { routes: ['/settings/**'] },
				}),
			]);

			service.updateQuery('reset');

			const results: ScoredCommand[] = service.results();
			const ids: string[] = results.map((result: ScoredCommand) => result.command.id);
			expect(ids).toContain('reset-settings');
		});

		it('should evaluate context.when alongside route matching', () => {
			Object.defineProperty(router, 'url', {
				get: () => '/dashboard',
				configurable: true, 
			});

			let featureEnabled: boolean = false;

			service.register([
				makeCommand({
					id: 'feature-action',
					label: 'Feature Action',
					context: {
						routes: ['/dashboard'],
						when: () => featureEnabled,
					},
				}),
			]);

			service.updateQuery('feature');
			expect(service.results().length).toBe(0);

			featureEnabled = true;

			// Change query to invalidate the computed signal cache, since
			// context.when() is not a tracked signal dependency.
			service.updateQuery('featur');
			service.updateQuery('feature');

			const results: ScoredCommand[] = service.results();
			const ids: string[] = results.map((result: ScoredCommand) => result.command.id);
			expect(ids).toContain('feature-action');
		});
	});

	describe('async providers through the service', () => {
		it('should merge async provider results with static results', () => {
			service.register([
				makeCommand({
					id: 'static-cmd',
					label: 'Static Command', 
				}),
			]);

			service.registerProvider({
				id: 'test-provider',
				category: 'Dynamic',
				debounce: 0,
				search: () => of([
					makeCommand({
						id: 'dynamic-cmd',
						label: 'Dynamic Command', 
					}),
				]),
			});

			service.updateQuery('command');
			TestBed.flushEffects();
			vi.advanceTimersByTime(0);

			const results: ScoredCommand[] = service.results();
			const ids: string[] = results.map((result: ScoredCommand) => result.command.id);
			expect(ids).toContain('static-cmd');
			expect(ids).toContain('dynamic-cmd');
		});

		it('should route prefixed queries to the correct provider only', () => {
			let userSearchCalled: boolean = false;
			let helpSearchCalled: boolean = false;

			service.registerProvider({
				id: 'user-provider',
				category: 'Users',
				prefix: '@',
				debounce: 0,
				search: () => {
					userSearchCalled = true;
					return of([
						makeCommand({
							id: 'user-1',
							label: 'Alice', 
						}),
					]);
				},
			});

			service.registerProvider({
				id: 'help-provider',
				category: 'Help',
				prefix: '#',
				debounce: 0,
				search: () => {
					helpSearchCalled = true;
					return of([]);
				},
			});

			service.updateQuery('@alice');
			TestBed.flushEffects();
			vi.advanceTimersByTime(0);

			expect(userSearchCalled).toBe(true);
			expect(helpSearchCalled).toBe(false);

			const results: ScoredCommand[] = service.results();
			const ids: string[] = results.map((result: ScoredCommand) => result.command.id);
			expect(ids).toContain('user-1');
		});

		it('should expose loading state while async providers are in-flight', () => {
			service.registerProvider({
				id: 'slow-provider',
				category: 'Slow',
				debounce: 0,
				search: () => of([
					makeCommand({
						id: 'result',
						label: 'Result', 
					}),
				]).pipe(delay(500)),
			});

			service.updateQuery('test');
			TestBed.flushEffects();
			vi.advanceTimersByTime(0);

			expect(service.loading()).toBe(true);

			vi.advanceTimersByTime(500);

			expect(service.loading()).toBe(false);
			expect(service.results().some(
				(result: ScoredCommand) => result.command.id === 'result',
			)).toBe(true);
		});

		it('should clear async results when the palette closes', () => {
			service.registerProvider({
				id: 'test-provider',
				category: 'Test',
				debounce: 0,
				search: () => of([
					makeCommand({
						id: 'async-result',
						label: 'Async Result', 
					}),
				]),
			});

			service.open();
			service.updateQuery('async');
			TestBed.flushEffects();
			vi.advanceTimersByTime(0);
			expect(asyncSearch.results().length).toBe(1);

			service.close();
			expect(asyncSearch.results().length).toBe(0);
		});

		it('should clean up provider when DestroyRef fires', () => {
			const destroyCallbacks: (() => void)[] = [];
			const mockDestroyRef: DestroyRef = {
				onDestroy: (callback: () => void): void => {
					destroyCallbacks.push(callback);
				},
			} as DestroyRef;

			service.registerProvider({
				id: 'temp-provider',
				category: 'Temp',
				debounce: 0,
				search: () => of([
					makeCommand({
						id: 'temp-result',
						label: 'Temp', 
					}),
				]),
			}, mockDestroyRef);

			service.updateQuery('temp');
			TestBed.flushEffects();
			vi.advanceTimersByTime(0);
			expect(service.results().some(
				(result: ScoredCommand) => result.command.id === 'temp-result',
			)).toBe(true);

			destroyCallbacks.forEach((callback: () => void) => callback());

			expect(providerRegistry.providers().length).toBe(0);
			expect(asyncSearch.results().length).toBe(0);
		});
	});

	describe('full open, search, execute flow', () => {
		beforeEach(() => {
			extractor.init();
		});

		it('should support the full lifecycle: open, search, execute, close', () => {
			const actionSpy = vi.fn();
			service.register([
				makeCommand({
					id: 'action',
					label: 'Run Action',
					action: actionSpy, 
				}),
			]);

			service.open();
			expect(service.isOpen()).toBe(true);

			service.updateQuery('run');
			const results: ScoredCommand[] = service.results();
			expect(results.length).toBeGreaterThan(0);

			const target: ScoredCommand | undefined = results.find(
				(result: ScoredCommand) => result.command.id === 'action',
			);
			expect(target).toBeDefined();

			service.execute(target!.command);
			expect(actionSpy).toHaveBeenCalledOnce();
			expect(service.isOpen()).toBe(false);
			expect(service.query()).toBe('');
		});

		it('should boost recently executed commands in subsequent searches', () => {
			service.register([
				makeCommand({
					id: 'alpha',
					label: 'Command Alpha', 
				}),
				makeCommand({
					id: 'bravo',
					label: 'Command Bravo', 
				}),
			]);

			service.execute(makeCommand({
				id: 'bravo',
				label: 'Command Bravo',
				action: (): void => {}, 
			}));

			service.open();
			service.updateQuery('command');

			const results: ScoredCommand[] = service.results();
			expect(results[0].command.id).toBe('bravo');
		});

		it('should combine route commands, custom commands, and async results', () => {
			service.register([
				makeCommand({
					id: 'custom',
					label: 'Dashboard Export Tool', 
				}),
			]);

			service.registerProvider({
				id: 'async-provider',
				category: 'Async',
				debounce: 0,
				search: () => of([
					makeCommand({
						id: 'async-result',
						label: 'Dashboard Analytics', 
					}),
				]),
			});

			service.updateQuery('dash');
			TestBed.flushEffects();
			vi.advanceTimersByTime(0);

			const results: ScoredCommand[] = service.results();
			const ids: string[] = results.map((result: ScoredCommand) => result.command.id);
			expect(ids).toContain('route:dashboard');
			expect(ids).toContain('custom');
			expect(ids).toContain('async-result');
		});
	});

	describe('nested pages through the rendered palette', () => {
		beforeEach(() => {
			// jsdom does not implement scrollIntoView, which the active item calls.
			Element.prototype.scrollIntoView = vi.fn();
		});

		function settle(fixture: ComponentFixture<PaletteHostComponent>): void {
			TestBed.flushEffects();
			fixture.detectChanges();
		}

		function openPalette(): {
			fixture: ComponentFixture<PaletteHostComponent>;
			input: HTMLInputElement;
			} {
			const fixture: ComponentFixture<PaletteHostComponent> = TestBed.createComponent(PaletteHostComponent);
			fixture.detectChanges();

			service.open();
			settle(fixture);

			const input: HTMLInputElement = fixture.nativeElement.querySelector('input') as HTMLInputElement;
			return {
				fixture,
				input,
			};
		}

		function typeQuery(fixture: ComponentFixture<PaletteHostComponent>, input: HTMLInputElement, text: string): void {
			input.value = text;
			input.dispatchEvent(new Event('input'));
			settle(fixture);
		}

		function pressKey(fixture: ComponentFixture<PaletteHostComponent>, input: HTMLInputElement, key: string): void {
			input.dispatchEvent(new KeyboardEvent('keydown', { key }));
			settle(fixture);
		}

		function registerThemeSubmenu(onDark: () => void = (): void => {}): void {
			service.register([
				{
					id: 'theme',
					label: 'Change theme...',
					category: 'Preferences',
					pagePlaceholder: 'Pick a theme...',
					children: [
						makeCommand({
							id: 'theme.light',
							label: 'Light',
						}),
						makeCommand({
							id: 'theme.dark',
							label: 'Dark',
							action: onDark,
						}),
						makeCommand({
							id: 'theme.system',
							label: 'System',
						}),
					],
				},
			]);
		}

		it('should walk a static submenu from search to execution', () => {
			const setDark = vi.fn();
			registerThemeSubmenu(setDark);

			const { fixture, input } = openPalette();

			typeQuery(fixture, input, 'theme');
			pressKey(fixture, input, 'Enter');

			const chip: HTMLElement | null = fixture.nativeElement.querySelector('.cmd-breadcrumb-chip');
			expect(chip?.textContent?.trim()).toBe('Change theme');
			expect(input.placeholder).toBe('Pick a theme...');

			typeQuery(fixture, input, 'dark');
			pressKey(fixture, input, 'Enter');

			expect(setDark).toHaveBeenCalledOnce();
			expect(service.isOpen()).toBe(false);
		});

		it('should show loading, then loader results, then the page empty message', () => {
			service.register([
				{
					id: 'assign',
					label: 'Assign to...',
					pageEmptyMessage: 'Nobody matches that name.',
					children: () => of([
						makeCommand({
							id: 'assign.jane',
							label: 'Jane',
						}),
					]).pipe(delay(300)),
				},
			]);

			const { fixture, input } = openPalette();

			typeQuery(fixture, input, 'assign');
			pressKey(fixture, input, 'Enter');

			expect(fixture.nativeElement.querySelector('.cmd-loading')).not.toBeNull();

			vi.advanceTimersByTime(300);
			settle(fixture);

			expect(fixture.nativeElement.querySelector('#cmd-item-assign\\.jane')).not.toBeNull();

			typeQuery(fixture, input, 'zzz');

			const empty: HTMLElement | null = fixture.nativeElement.querySelector('.cmd-empty');
			expect(empty?.textContent?.trim()).toBe('Nobody matches that name.');
		});

		it('should walk a two-level flow and Backspace back up one level at a time', () => {
			service.register([
				{
					id: 'move',
					label: 'Move to...',
					children: [
						{
							id: 'move.alpha',
							label: 'Alpha',
							children: [
								makeCommand({
									id: 'move.alpha.todo',
									label: 'Todo',
								}),
							],
						},
					],
				},
			]);

			const { fixture, input } = openPalette();

			typeQuery(fixture, input, 'move');
			pressKey(fixture, input, 'Enter');
			pressKey(fixture, input, 'Enter');

			expect(service.breadcrumbs()).toEqual([
				'Move to',
				'Alpha',
			]);
			expect(fixture.nativeElement.querySelectorAll('.cmd-breadcrumb-chip').length).toBe(2);

			pressKey(fixture, input, 'Backspace');
			expect(service.breadcrumbs()).toEqual(['Move to']);

			pressKey(fixture, input, 'Backspace');
			expect(service.breadcrumbs()).toEqual([]);
			expect(service.isOpen()).toBe(true);
		});

		it('should render a chevron on container items only', () => {
			registerThemeSubmenu();
			service.register([
				makeCommand({
					id: 'leaf',
					label: 'Plain Action',
					category: 'Preferences',
				}),
			]);

			const { fixture } = openPalette();

			const containerItem: HTMLElement = fixture.nativeElement.querySelector('#cmd-item-theme') as HTMLElement;
			const leafItem: HTMLElement = fixture.nativeElement.querySelector('#cmd-item-leaf') as HTMLElement;

			expect(containerItem.querySelector('.cmd-item-chevron')).not.toBeNull();
			expect(leafItem.querySelector('.cmd-item-chevron')).toBeNull();
		});

		it('should reset the selection when clicking into a page from an empty query', () => {
			service.register([
				makeCommand({
					id: 'first',
					label: 'First',
				}),
				makeCommand({
					id: 'second',
					label: 'Second',
				}),
			]);
			registerThemeSubmenu();

			const { fixture, input } = openPalette();

			pressKey(fixture, input, 'ArrowDown');
			pressKey(fixture, input, 'ArrowDown');

			const containerItem: HTMLElement = fixture.nativeElement.querySelector('#cmd-item-theme') as HTMLElement;
			containerItem.click();
			settle(fixture);

			expect(service.currentPage()?.id).toBe('theme');
			expect(input.getAttribute('aria-activedescendant')).toBe('cmd-item-theme.light');
		});

		it('should prevent mousedown default on items so clicks cannot blur the input', () => {
			registerThemeSubmenu();

			const { fixture } = openPalette();

			const containerItem: HTMLElement = fixture.nativeElement.querySelector('#cmd-item-theme') as HTMLElement;
			const mousedownEvent: MouseEvent = new MouseEvent('mousedown', {
				cancelable: true,
				bubbles: true,
			});

			const notPrevented: boolean = containerItem.dispatchEvent(mousedownEvent);
			expect(notPrevented).toBe(false);
		});

		it('should keep keyboard selection alive after clicking into a page', () => {
			const setDark = vi.fn();
			registerThemeSubmenu(setDark);

			const { fixture, input } = openPalette();

			const containerItem: HTMLElement = fixture.nativeElement.querySelector('#cmd-item-theme') as HTMLElement;
			containerItem.click();
			settle(fixture);

			pressKey(fixture, input, 'ArrowDown');
			pressKey(fixture, input, 'Enter');

			expect(setDark).toHaveBeenCalledOnce();
			expect(service.isOpen()).toBe(false);
		});

		it('should show every child at an empty query even beyond config.maxResults', () => {
			const children: Command[] = Array.from({ length: 15 }, (_: unknown, index: number) =>
				makeCommand({
					id: `letter.${index}`,
					label: `Letter ${index}`,
				}),
			);

			service.register([
				{
					id: 'letters',
					label: 'Letters...',
					children,
				},
			]);

			const { fixture, input } = openPalette();

			typeQuery(fixture, input, 'letters');
			pressKey(fixture, input, 'Enter');

			expect(fixture.nativeElement.querySelectorAll('cmd-item').length).toBe(15);
		});

		it('should hide the default group heading inside a page but keep explicit ones', () => {
			registerThemeSubmenu();

			const { fixture, input } = openPalette();

			// Root always shows headings, even for the default bucket.
			expect(fixture.nativeElement.querySelector('.cmd-group-heading')).not.toBeNull();

			typeQuery(fixture, input, 'theme');
			pressKey(fixture, input, 'Enter');

			expect(fixture.nativeElement.querySelector('.cmd-group-heading')).toBeNull();
		});

		it('should slugify group heading ids so aria-labelledby stays a valid id reference', () => {
			service.register([
				makeCommand({
					id: 'report',
					label: 'Open Report',
					category: 'My Files',
				}),
			]);

			const { fixture } = openPalette();

			const heading: HTMLElement = fixture.nativeElement.querySelector('.cmd-group-heading') as HTMLElement;
			const group: HTMLElement = fixture.nativeElement.querySelector('cmd-group') as HTMLElement;

			expect(heading.id).toBe('cmd-group-my-files');
			expect(group.getAttribute('aria-labelledby')).toBe('cmd-group-my-files');
		});

		it('should not resurrect a pending debounced query after a page transition', () => {
			TestBed.resetTestingModule();
			TestBed.configureTestingModule({
				providers: [
					{
						provide: PLATFORM_ID,
						useValue: 'browser',
					},
					{
						provide: COMMAND_PALETTE_CONFIG,
						useValue: {
							...config,
							debounce: 150,
						},
					},
					provideRouter(testRoutes),
				],
			});
			service = TestBed.inject(CommandPaletteService);

			service.register([
				{
					id: 'move',
					label: 'Move to...',
					children: [
						{
							id: 'move.alpha',
							label: 'Alpha',
							children: [
								makeCommand({
									id: 'move.alpha.todo',
									label: 'Todo',
								}),
							],
						},
					],
				},
			]);

			const { fixture, input } = openPalette();

			service.openPage('move');
			settle(fixture);

			// The timer holding 'alp' is still pending on push; it must not fire into the new page.
			input.value = 'alp';
			input.dispatchEvent(new Event('input'));
			pressKey(fixture, input, 'Enter');

			expect(service.currentPage()?.id).toBe('move.alpha');

			vi.advanceTimersByTime(200);
			settle(fixture);

			expect(service.query()).toBe('');
			expect(input.value).toBe('');
			expect(service.currentPage()?.id).toBe('move.alpha');
		});

		it('should swap prefix hints for a back hint in the footer while nested', () => {
			registerThemeSubmenu();
			service.registerProvider({
				id: 'users',
				category: 'People',
				prefix: '@',
				debounce: 0,
				search: () => of([]),
			});

			const { fixture, input } = openPalette();

			const footerText = (): string => (fixture.nativeElement.querySelector('.cmd-footer') as HTMLElement).textContent ?? '';

			expect(footerText()).toContain('@');
			expect(footerText()).not.toContain('⌫');

			typeQuery(fixture, input, 'theme');
			pressKey(fixture, input, 'Enter');

			expect(footerText()).toContain('⌫');
			expect(footerText()).not.toContain('@');
		});

		it('should close the palette on Escape from any depth by default', () => {
			registerThemeSubmenu();

			const { fixture, input } = openPalette();

			typeQuery(fixture, input, 'theme');
			pressKey(fixture, input, 'Enter');
			expect(service.currentPage()?.id).toBe('theme');

			pressKey(fixture, input, 'Escape');

			expect(service.isOpen()).toBe(false);
		});

		it('should walk back one level per Escape when escapeBehavior is pop', () => {
			TestBed.resetTestingModule();
			TestBed.configureTestingModule({
				providers: [
					{
						provide: PLATFORM_ID,
						useValue: 'browser',
					},
					{
						provide: COMMAND_PALETTE_CONFIG,
						useValue: {
							...config,
							escapeBehavior: 'pop',
						},
					},
					provideRouter(testRoutes),
				],
			});
			service = TestBed.inject(CommandPaletteService);

			registerThemeSubmenu();

			const { fixture, input } = openPalette();

			typeQuery(fixture, input, 'theme');
			pressKey(fixture, input, 'Enter');
			expect(service.currentPage()?.id).toBe('theme');

			pressKey(fixture, input, 'Escape');
			expect(service.isOpen()).toBe(true);
			expect(service.currentPage()).toBeNull();

			pressKey(fixture, input, 'Escape');
			expect(service.isOpen()).toBe(false);
		});

		it('should warn in dev mode when a second palette instance is created', () => {
			const warnSpy: MockInstance = vi.spyOn(console, 'warn').mockImplementation(() => {});

			const firstFixture: ComponentFixture<PaletteHostComponent> = TestBed.createComponent(PaletteHostComponent);
			firstFixture.detectChanges();
			expect(warnSpy).not.toHaveBeenCalled();

			const secondFixture: ComponentFixture<PaletteHostComponent> = TestBed.createComponent(PaletteHostComponent);
			secondFixture.detectChanges();

			expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Multiple <cmd-palette>'));

			warnSpy.mockRestore();
		});
	});
});

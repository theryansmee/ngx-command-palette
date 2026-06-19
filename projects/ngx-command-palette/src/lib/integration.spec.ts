import { TestBed } from '@angular/core/testing';
import { Component, DestroyRef, PLATFORM_ID } from '@angular/core';
import { provideRouter, Router, Routes } from '@angular/router';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { of, delay } from 'rxjs';
import { CommandPaletteService } from './services/command-palette.service';
import { ProviderRegistry } from './services/provider-registry';
import { AsyncSearchCoordinator } from './services/async-search';
import { RouterCommandExtractor } from './services/router-extractor';
import { COMMAND_PALETTE_CONFIG } from './provide';
import { Command, CommandPaletteConfig, ScoredCommand } from './models/command';

@Component({
	standalone: true,
	template: '', 
})
class DummyComponent {}

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
});

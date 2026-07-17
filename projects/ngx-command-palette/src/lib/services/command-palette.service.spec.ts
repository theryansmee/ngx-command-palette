import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, DestroyRef } from '@angular/core';
import { describe, it, expect, beforeEach, vi, MockInstance } from 'vitest';
import { of } from 'rxjs';
import { CommandPaletteService } from './command-palette.service';
import { CommandRegistry } from './command-registry';
import { ProviderRegistry } from './provider-registry';
import { RecentCommandsStore } from './recent-store';
import { COMMAND_PALETTE_CONFIG } from '../provide';
import { Command, CommandPaletteConfig, ScoredCommand, SearchProvider } from '../models/command';
import { CommandPage } from '../models/command-page.interface';

function makeCommand(overrides: Partial<Command> = {}): Command {
	return {
		id: overrides.id ?? 'test',
		label: overrides.label ?? 'Test',
		action: overrides.action ?? ((): void => {}),
		...overrides,
	};
}

function makeProvider(overrides: Partial<SearchProvider> = {}): SearchProvider {
	return {
		id: overrides.id ?? 'users',
		category: overrides.category ?? 'People',
		search: overrides.search ?? ((): ReturnType<SearchProvider['search']> => of([])),
		debounce: overrides.debounce ?? 0,
		...overrides,
	};
}

function makeStaticPage(id: string, commands: Command[]): CommandPage {
	return {
		id,
		title: id,
		source: {
			kind: 'static',
			commands,
		},
	};
}

describe('CommandPaletteService', () => {
	let service: CommandPaletteService;
	let registry: CommandRegistry;
	let providerRegistry: ProviderRegistry;
	let recentStore: RecentCommandsStore;

	const config: CommandPaletteConfig = {
		maxResults: 10,
		trackRecent: true,
		recentCount: 5,
	};

	beforeEach(() => {
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
			],
		});

		service = TestBed.inject(CommandPaletteService);
		registry = TestBed.inject(CommandRegistry);
		providerRegistry = TestBed.inject(ProviderRegistry);
		recentStore = TestBed.inject(RecentCommandsStore);
	});

	it('should start with palette closed and empty query', () => {
		expect(service.isOpen()).toBe(false);
		expect(service.query()).toBe('');
	});

	it('should open the palette', () => {
		service.open();

		expect(service.isOpen()).toBe(true);
	});

	it('should open with an initial query', () => {
		service.open('search term');

		expect(service.isOpen()).toBe(true);
		expect(service.query()).toBe('search term');
	});

	it('should close the palette and clear the query', () => {
		service.open('something');
		service.close();

		expect(service.isOpen()).toBe(false);
		expect(service.query()).toBe('');
	});

	it('should toggle between open and closed', () => {
		service.toggle();
		expect(service.isOpen()).toBe(true);

		service.toggle();
		expect(service.isOpen()).toBe(false);
	});

	it('should clear the query when toggling closed', () => {
		service.open('search term');
		service.toggle();

		expect(service.isOpen()).toBe(false);
		expect(service.query()).toBe('');
	});

	it('should update the query', () => {
		service.updateQuery('dashboard');

		expect(service.query()).toBe('dashboard');
	});

	it('should return search results based on current query', () => {
		service.register([
			makeCommand({
				id: 'dashboard',
				label: 'Dashboard', 
			}),
			makeCommand({
				id: 'settings',
				label: 'Settings', 
			}),
		]);

		service.updateQuery('dash');

		const results: ScoredCommand[] = service.results();
		expect(results.length).toBe(1);
		expect(results[0].command.id).toBe('dashboard');
	});

	it('should call the command action, record it as recent, and close on execute', () => {
		const actionSpy = vi.fn();
		const command: Command = makeCommand({
			id: 'test-cmd',
			action: actionSpy, 
		});

		service.open();
		service.execute(command);

		expect(actionSpy).toHaveBeenCalledOnce();
		expect(service.isOpen()).toBe(false);
		expect(recentStore.ids()).toContain('test-cmd');
	});

	it('should register commands into the registry', () => {
		service.register([
			makeCommand({ id: 'custom-1' }),
			makeCommand({ id: 'custom-2' }),
		]);

		const ids: string[] = registry.commands().map((command: Command) => command.id);
		expect(ids).toContain('custom-1');
		expect(ids).toContain('custom-2');
	});

	it('should deregister commands when DestroyRef fires', () => {
		const destroyCallbacks: (() => void)[] = [];
		const mockDestroyRef: DestroyRef = {
			onDestroy: (callback: () => void): void => {
				destroyCallbacks.push(callback);
			},
		} as DestroyRef;

		service.register(
			[
				makeCommand({ id: 'temp-1' }),
				makeCommand({ id: 'temp-2' }),
			],
			mockDestroyRef,
		);

		expect(registry.commands().length).toBe(2);

		destroyCallbacks.forEach((callback: () => void) => callback());

		expect(registry.commands().length).toBe(0);
	});

	it('should push a page instead of executing when a command has children', () => {
		service.open();
		service.execute({
			id: 'theme',
			label: 'Change theme...',
			children: [
				makeCommand({
					id: 'theme.dark',
					label: 'Dark',
				}),
			],
		});

		expect(service.isOpen()).toBe(true);
		expect(service.currentPage()?.id).toBe('theme');
		expect(service.breadcrumbs()).toEqual(['Change theme']);
		expect(recentStore.ids()).not.toContain('theme');
	});

	it('should run the action first and then push the page when a command has both', () => {
		const actionSpy = vi.fn();

		service.execute({
			id: 'analytics',
			label: 'Tracked submenu...',
			action: actionSpy,
			children: [makeCommand({ id: 'analytics.child' })],
		});

		expect(actionSpy).toHaveBeenCalledOnce();
		expect(service.currentPage()?.id).toBe('analytics');
		expect(recentStore.ids()).not.toContain('analytics');
	});

	it('should warn and stay inert when a command has neither action nor children', () => {
		const warnSpy: MockInstance = vi.spyOn(console, 'warn').mockImplementation(() => {});

		service.open();
		service.execute({
			id: 'inert',
			label: 'Inert',
		});

		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"inert"'));
		expect(service.isOpen()).toBe(true);
		expect(recentStore.ids()).not.toContain('inert');

		warnSpy.mockRestore();
	});

	it('should not push the page when a container action throws synchronously', () => {
		const failing: Command = {
			id: 'boom',
			label: 'Boom...',
			action: (): void => {
				throw new Error('boom');
			},
			children: [makeCommand({ id: 'boom.child' })],
		};

		expect(() => service.execute(failing)).toThrowError('boom');
		expect(service.currentPage()).toBeNull();
	});

	it('should record the leaf and its registered ancestor pages on execution', () => {
		const container: Command = {
			id: 'theme',
			label: 'Change theme...',
			children: [
				makeCommand({
					id: 'theme.dark',
					label: 'Dark',
				}),
			],
		};
		registry.register([container]);

		service.open();
		service.execute(container);
		service.execute(makeCommand({
			id: 'theme.dark',
			label: 'Dark',
		}));

		expect(recentStore.ids()).toContain('theme.dark');
		expect(recentStore.ids()).toContain('theme');
	});

	it('should not record ancestor page ids that are not registered commands', () => {
		service.open();
		service.pushPage(makeStaticPage('ad-hoc-page', []));
		service.execute(makeCommand({ id: 'leaf' }));

		expect(recentStore.ids()).toContain('leaf');
		expect(recentStore.ids()).not.toContain('ad-hoc-page');
	});

	it('should warn when pushing a provider page with an unknown provider id', () => {
		const warnSpy: MockInstance = vi.spyOn(console, 'warn').mockImplementation(() => {});

		service.pushPage({
			id: 'assign',
			title: 'Assign to',
			source: {
				kind: 'provider',
				providerId: 'missing-provider',
			},
		});

		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"missing-provider"'));

		warnSpy.mockRestore();
	});

	it('should match the longest prefix when one prefix starts with another', () => {
		providerRegistry.register(makeProvider({
			id: 'commands',
			prefix: '>',
		}));
		providerRegistry.register(makeProvider({
			id: 'admin-commands',
			prefix: '>>',
		}));

		service.open();
		service.updateQuery('>>restart');

		expect(service.currentPage()?.id).toBe('prefix:admin-commands');
		expect(service.breadcrumbs()).toEqual(['>>']);
		expect(service.displayQuery()).toBe('restart');
	});

	it('should clear the query when pushing and popping pages', () => {
		service.updateQuery('theme');
		service.pushPage(makeStaticPage('theme', []));
		expect(service.query()).toBe('');

		service.updateQuery('dark');
		service.popPage();
		expect(service.query()).toBe('');
	});

	it('should reset the page stack on close', () => {
		service.open();
		service.pushPage(makeStaticPage('theme', []));

		service.close();

		expect(service.currentPage()).toBeNull();
		expect(service.breadcrumbs()).toEqual([]);
	});

	it('should pop one page at a time on goBack when nested', () => {
		service.pushPage(makeStaticPage('move', []));
		service.pushPage(makeStaticPage('columns', []));

		service.goBack();
		expect(service.breadcrumbs()).toEqual(['move']);

		service.goBack();
		expect(service.breadcrumbs()).toEqual([]);
	});

	it('should exit prefix mode on goBack at root', () => {
		providerRegistry.register(makeProvider({ prefix: '@' }));

		service.updateQuery('@john');
		expect(service.breadcrumbs()).toEqual(['@']);

		service.goBack();

		expect(service.query()).toBe('');
		expect(service.breadcrumbs()).toEqual([]);
	});

	it('should leave a plain query untouched on goBack at bare root', () => {
		service.updateQuery('hello');

		service.goBack();

		expect(service.query()).toBe('hello');
	});

	it('should open directly onto a page for a registered command id', () => {
		service.register([
			{
				id: 'assign',
				label: 'Assign to...',
				children: [makeCommand({ id: 'assign.jane' })],
			},
		]);

		service.openPage('assign');

		expect(service.isOpen()).toBe(true);
		expect(service.currentPage()?.id).toBe('assign');
	});

	it('should open directly onto a page object', () => {
		service.openPage(makeStaticPage('custom', [makeCommand({ id: 'custom.child' })]));

		expect(service.isOpen()).toBe(true);
		expect(service.currentPage()?.id).toBe('custom');
	});

	it('should warn and not open for an unknown openPage command id', () => {
		const warnSpy: MockInstance = vi.spyOn(console, 'warn').mockImplementation(() => {});

		service.openPage('missing');

		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"missing"'));
		expect(service.isOpen()).toBe(false);
		expect(service.currentPage()).toBeNull();

		warnSpy.mockRestore();
	});

	it('should reset an existing stack before opening a page deep link', () => {
		service.open();
		service.pushPage(makeStaticPage('move', []));
		service.pushPage(makeStaticPage('columns', []));

		service.openPage(makeStaticPage('custom', []));

		expect(service.breadcrumbs()).toEqual(['custom']);
	});

	it('should scope results to the page and keep authored order at an empty query', () => {
		service.register([
			makeCommand({
				id: 'root-dark',
				label: 'Dark Mode Global',
			}),
		]);

		service.pushPage(makeStaticPage('theme', [
			makeCommand({
				id: 'theme.light',
				label: 'Light',
				priority: 0,
			}),
			makeCommand({
				id: 'theme.dark',
				label: 'Dark',
				priority: 10,
			}),
		]));

		const defaultIds: string[] = service.results().map((result: ScoredCommand) => result.command.id);
		expect(defaultIds).toEqual([
			'theme.light',
			'theme.dark',
		]);

		service.updateQuery('dark');

		const typedIds: string[] = service.results().map((result: ScoredCommand) => result.command.id);
		expect(typedIds).toEqual(['theme.dark']);
	});

	it('should show loader page children once the loader emits', () => {
		service.execute({
			id: 'assign',
			label: 'Assign to...',
			children: () => of([
				makeCommand({
					id: 'assign.jane',
					label: 'Jane',
				}),
			]),
		});

		const ids: string[] = service.results().map((result: ScoredCommand) => result.command.id);
		expect(ids).toEqual(['assign.jane']);
	});

	it('should not surface static commands while a prefix provider is active', () => {
		providerRegistry.register(makeProvider({ prefix: '@' }));
		service.register([
			makeCommand({
				id: 'smith-settings',
				label: 'Smith settings',
			}),
		]);

		service.updateQuery('@sm');

		const ids: string[] = service.results().map((result: ScoredCommand) => result.command.id);
		expect(ids).not.toContain('smith-settings');
	});

	it('should reach the same provider results by selection as by typing the prefix', () => {
		vi.useFakeTimers();

		providerRegistry.register(makeProvider({
			prefix: '@',
			search: (query: string) => of([
				makeCommand({
					id: `user-${query}`,
					label: `User ${query}`,
				}),
			]),
		}));

		service.open();
		service.updateQuery('@john');
		TestBed.tick();
		vi.advanceTimersByTime(0);
		const typedIds: string[] = service.results().map((result: ScoredCommand) => result.command.id);

		service.close();

		service.open();
		service.execute({
			id: 'assign',
			label: 'Assign to...',
			children: { provider: 'users' },
		});
		service.updateQuery('john');
		TestBed.tick();
		vi.advanceTimersByTime(0);
		const selectedIds: string[] = service.results().map((result: ScoredCommand) => result.command.id);

		expect(typedIds).toEqual(['user-john']);
		expect(selectedIds).toEqual(typedIds);

		vi.useRealTimers();
	});

	it('should expose the provider for both prefix and selection entry paths', () => {
		providerRegistry.register(makeProvider({ prefix: '@' }));

		service.updateQuery('@john');
		expect(service.activeProvider()?.id).toBe('users');

		service.close();

		service.execute({
			id: 'assign',
			label: 'Assign to...',
			children: { provider: 'users' },
		});
		expect(service.activeProvider()?.id).toBe('users');
	});

	it('should show a hint instead of the empty message below minQueryLength', () => {
		providerRegistry.register(makeProvider({ minQueryLength: 2 }));

		service.execute({
			id: 'assign',
			label: 'Assign to...',
			pagePlaceholder: 'Search teammates...',
			pageEmptyMessage: 'Nobody matches that name.',
			children: { provider: 'users' },
		});

		expect(service.emptyMessage()).toBe('Search teammates...');

		service.updateQuery('jo');
		expect(service.emptyMessage()).toBe('Nobody matches that name.');
	});

	it('should fall back to a generic hint when the page has no placeholder', () => {
		providerRegistry.register(makeProvider({ minQueryLength: 2 }));

		service.execute({
			id: 'assign',
			label: 'Assign to...',
			children: { provider: 'users' },
		});

		expect(service.emptyMessage()).toBe('Type to search...');
	});

	it('should use the page placeholder while a page is active', () => {
		service.execute({
			id: 'theme',
			label: 'Change theme...',
			pagePlaceholder: 'Pick a theme...',
			children: [makeCommand({ id: 'theme.dark' })],
		});

		expect(service.activePlaceholder()).toBe('Pick a theme...');
	});
});

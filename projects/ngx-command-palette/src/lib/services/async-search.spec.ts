import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { of, Subject } from 'rxjs';
import { AsyncSearchCoordinator } from './async-search';
import { ProviderRegistry } from './provider-registry';
import { COMMAND_PALETTE_CONFIG } from '../provide';
import { Command, CommandPaletteConfig, SearchProvider, ScoredCommand } from '../models/command';

function makeProvider(overrides: Partial<SearchProvider> = {}): SearchProvider {
	return {
		id: overrides.id ?? 'test-provider',
		category: overrides.category ?? 'Test',
		search: overrides.search ?? ((): ReturnType<SearchProvider['search']> => of([])),
		debounce: overrides.debounce ?? 0,
		...overrides,
	};
}

function makeCommand(overrides: Partial<Command> = {}): Command {
	return {
		id: overrides.id ?? 'test',
		label: overrides.label ?? 'Test',
		action: (): void => {},
		...overrides,
	};
}

describe('AsyncSearchCoordinator', () => {
	let coordinator: AsyncSearchCoordinator;
	let providerRegistry: ProviderRegistry;

	const config: CommandPaletteConfig = {
		maxResults: 10,
		recentCount: 5,
	};

	beforeEach(() => {
		vi.useFakeTimers();

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

		coordinator = TestBed.inject(AsyncSearchCoordinator);
		providerRegistry = TestBed.inject(ProviderRegistry);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should return no results when no providers are registered', () => {
		coordinator.search('test');
		vi.advanceTimersByTime(0);

		expect(coordinator.results().length).toBe(0);
	});

	it('should return results from an unprefixed provider', () => {
		providerRegistry.register(makeProvider({
			id: 'users',
			category: 'Users',
			debounce: 0,
			search: () => of([
				makeCommand({
					id: 'user-1',
					label: 'John Smith', 
				}),
				makeCommand({
					id: 'user-2',
					label: 'Jane Doe', 
				}),
			]),
		}));

		coordinator.search('john');
		vi.advanceTimersByTime(0);

		const results: ScoredCommand[] = coordinator.results();
		expect(results.length).toBe(2);

		const ids: string[] = results.map((result: ScoredCommand) => result.command.id);
		expect(ids).toContain('user-1');
		expect(ids).toContain('user-2');
	});

	it('should apply provider category to results that lack one', () => {
		providerRegistry.register(makeProvider({
			id: 'users',
			category: 'Users',
			debounce: 0,
			search: () => of([
				makeCommand({
					id: 'user-1',
					label: 'John', 
				}),
			]),
		}));

		coordinator.search('john');
		vi.advanceTimersByTime(0);

		expect(coordinator.results()[0].command.category).toBe('Users');
	});

	it('should only fire a prefixed provider when query starts with that prefix', () => {
		let userSearchCalled: boolean = false;
		let ticketSearchCalled: boolean = false;

		providerRegistry.register(makeProvider({
			id: 'users',
			prefix: '@',
			debounce: 0,
			search: () => {
				userSearchCalled = true;
				return of([
					makeCommand({
						id: 'user-1',
						label: 'John', 
					}),
				]);
			},
		}));

		providerRegistry.register(makeProvider({
			id: 'tickets',
			prefix: '#',
			debounce: 0,
			search: () => {
				ticketSearchCalled = true;
				return of([]);
			},
		}));

		coordinator.search('@john');
		vi.advanceTimersByTime(0);

		expect(userSearchCalled).toBe(true);
		expect(ticketSearchCalled).toBe(false);
	});

	it('should strip the prefix before passing query to the provider', () => {
		let receivedQuery: string = '';

		providerRegistry.register(makeProvider({
			id: 'users',
			prefix: '@',
			debounce: 0,
			search: (query: string) => {
				receivedQuery = query;
				return of([]);
			},
		}));

		coordinator.search('@john smith');
		vi.advanceTimersByTime(0);

		expect(receivedQuery).toBe('john smith');
	});

	it('should not fire a provider when query is shorter than minQueryLength', () => {
		let searchCalled: boolean = false;

		providerRegistry.register(makeProvider({
			id: 'users',
			debounce: 0,
			minQueryLength: 3,
			search: () => {
				searchCalled = true;
				return of([]);
			},
		}));

		coordinator.search('ab');
		vi.advanceTimersByTime(0);

		expect(searchCalled).toBe(false);
	});

	it('should fire a provider when query meets minQueryLength', () => {
		let searchCalled: boolean = false;

		providerRegistry.register(makeProvider({
			id: 'users',
			debounce: 0,
			minQueryLength: 3,
			search: () => {
				searchCalled = true;
				return of([]);
			},
		}));

		coordinator.search('abc');
		vi.advanceTimersByTime(0);

		expect(searchCalled).toBe(true);
	});

	it('should set loading to true while a search is in-flight', () => {
		const responseSubject: Subject<Command[]> = new Subject<Command[]>();

		providerRegistry.register(makeProvider({
			id: 'users',
			debounce: 0,
			search: () => responseSubject.asObservable(),
		}));

		coordinator.search('john');
		vi.advanceTimersByTime(0);

		expect(coordinator.loading()).toBe(true);

		responseSubject.next([
			makeCommand({
				id: 'user-1',
				label: 'John', 
			}),
		]);
		responseSubject.complete();

		expect(coordinator.loading()).toBe(false);
	});

	it('should debounce provider searches', () => {
		let callCount: number = 0;

		providerRegistry.register(makeProvider({
			id: 'users',
			debounce: 200,
			search: () => {
				callCount++;
				return of([]);
			},
		}));

		coordinator.search('j');
		vi.advanceTimersByTime(50);
		coordinator.search('jo');
		vi.advanceTimersByTime(50);
		coordinator.search('joh');
		vi.advanceTimersByTime(50);
		coordinator.search('john');
		vi.advanceTimersByTime(200);

		expect(callCount).toBe(1);
	});

	it('should clear all results when clear() is called', () => {
		providerRegistry.register(makeProvider({
			id: 'users',
			debounce: 0,
			search: () => of([
				makeCommand({
					id: 'user-1',
					label: 'John', 
				}),
			]),
		}));

		coordinator.search('john');
		vi.advanceTimersByTime(0);
		expect(coordinator.results().length).toBe(1);

		coordinator.clear();
		expect(coordinator.results().length).toBe(0);
	});

	it('should clean up when destroyProvider is called', () => {
		providerRegistry.register(makeProvider({
			id: 'users',
			debounce: 0,
			search: () => of([
				makeCommand({
					id: 'user-1',
					label: 'John', 
				}),
			]),
		}));

		coordinator.search('john');
		vi.advanceTimersByTime(0);
		expect(coordinator.results().length).toBe(1);

		coordinator.destroyProvider('users');
		expect(coordinator.results().length).toBe(0);
	});

	it('should not fire unprefixed providers when a prefix query is used', () => {
		let unprefixedCalled: boolean = false;

		providerRegistry.register(makeProvider({
			id: 'global',
			debounce: 0,
			search: () => {
				unprefixedCalled = true;
				return of([]);
			},
		}));

		providerRegistry.register(makeProvider({
			id: 'users',
			prefix: '@',
			debounce: 0,
			search: () => of([]),
		}));

		coordinator.search('@john');
		vi.advanceTimersByTime(0);

		expect(unprefixedCalled).toBe(false);
	});
});

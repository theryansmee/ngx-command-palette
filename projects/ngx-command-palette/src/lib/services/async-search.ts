import { Injectable, inject, signal, computed, DestroyRef, WritableSignal, Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, Subscription, switchMap, debounceTime, catchError, filter, map, of, Observable } from 'rxjs';
import { Command, ScoredCommand, SearchProvider } from '../models/command';
import { ProviderRegistry } from './provider-registry';

interface ProviderState {
	results: ScoredCommand[];
	loading: boolean;
	subscription: Subscription | null;
	querySubject: Subject<string>;
}

interface ProviderSearchResponse {
	query: string;
	commands: Command[];
}

@Injectable({ providedIn: 'root' })
export class AsyncSearchCoordinator {
	readonly #providerRegistry: ProviderRegistry = inject(ProviderRegistry);

	readonly #destroyRef: DestroyRef = inject(DestroyRef);

	readonly #providerStates: WritableSignal<Map<string, ProviderState>> = signal<Map<string, ProviderState>>(new Map());

	// The query each provider was last asked to search, or an empty string once it was cleared.
	readonly #currentQueries: Map<string, string> = new Map<string, string>();

	public readonly loading: Signal<boolean> = computed(() => {
		for (const state of this.#providerStates().values()) {
			if (state.loading) {
				return true;
			}
		}

		return false;
	});

	public readonly results: Signal<ScoredCommand[]> = computed(() => {
		const allResults: ScoredCommand[] = [];

		for (const state of this.#providerStates().values()) {
			allResults.push(...state.results);
		}

		allResults.sort((first: ScoredCommand, second: ScoredCommand) => second.score - first.score);
		return allResults;
	});

	public search(query: string): void {
		const trimmedQuery: string = query.trim();
		const matchedPrefix: string | undefined = this.#detectPrefix(trimmedQuery);

		if (matchedPrefix) {
			const provider: SearchProvider | undefined = this.#providerRegistry.getByPrefix(matchedPrefix);

			if (provider) {
				const strippedQuery: string = trimmedQuery.slice(matchedPrefix.length).trim();
				this.#clearAllExcept(provider.id);
				this.#searchProvider(provider, strippedQuery);
			}

			return;
		}

		const unprefixedProviders: SearchProvider[] = this.#providerRegistry.getUnprefixed();
		const activeProviderIds: Set<string> = new Set(unprefixedProviders.map((provider: SearchProvider) => provider.id));
		this.#clearAllExcept(...activeProviderIds);

		for (const provider of unprefixedProviders) {
			this.#searchProvider(provider, trimmedQuery);
		}
	}

	public clear(): void {
		for (const [
			providerId,
			state,
		] of this.#providerStates()) {
			this.#currentQueries.set(providerId, '');
			state.querySubject.next('');
		}

		this.#providerStates.update((map: Map<string, ProviderState>) => {
			const updated: Map<string, ProviderState> = new Map(map);

			for (const [
				providerId,
				state,
			] of updated) {
				updated.set(providerId, { ...state, results: [], loading: false });
			}

			return updated;
		});
	}

	#searchProvider(provider: SearchProvider, query: string): void {
		const minLength: number = provider.minQueryLength ?? 1;

		if (query.length < minLength) {
			this.#cancelProvider(provider.id);
			return;
		}

		const state: ProviderState = this.#getOrCreateState(provider);
		this.#currentQueries.set(provider.id, query);
		state.querySubject.next(query);
	}

	#getOrCreateState(provider: SearchProvider): ProviderState {
		const existing: ProviderState | undefined = this.#providerStates().get(provider.id);

		if (existing) {
			return existing;
		}

		const querySubject: Subject<string> = new Subject<string>();
		const state: ProviderState = {
			results: [],
			loading: false,
			subscription: null,
			querySubject,
		};

		const providerDebounce: number = provider.debounce ?? 300;

		// A query can go stale mid-debounce or mid-flight, so dispatch and response are both checked.
		const subscription: Subscription = querySubject.pipe(
			debounceTime(providerDebounce),
			filter((query: string) => this.#isCurrentQuery(provider.id, query)),
			switchMap((query: string): Observable<ProviderSearchResponse> => {
				if (!query) {
					return of({
						query,
						commands: [],
					});
				}

				this.#setLoading(provider.id, true);

				return provider.search(query).pipe(
					map((commands: Command[]): ProviderSearchResponse => ({
						query,
						commands,
					})),
					catchError((): Observable<ProviderSearchResponse> => of({
						query,
						commands: [],
					})),
				);
			}),
			takeUntilDestroyed(this.#destroyRef),
		).subscribe((searchResponse: ProviderSearchResponse) => {
			if (!this.#isCurrentQuery(provider.id, searchResponse.query)) {
				this.#setLoading(provider.id, false);
				return;
			}

			const scored: ScoredCommand[] = searchResponse.commands.map((command: Command) => ({
				command: {
					...command,
					category: command.category ?? provider.category,
				},
				score: this.#scoreProviderResult(command),
			}));

			this.#updateProviderResults(provider.id, scored);
		});

		state.subscription = subscription;

		this.#providerStates.update((map: Map<string, ProviderState>) => {
			const updated: Map<string, ProviderState> = new Map(map);
			updated.set(provider.id, state);
			return updated;
		});

		return state;
	}

	#isCurrentQuery(providerId: string, query: string): boolean {
		return (this.#currentQueries.get(providerId) ?? '') === query;
	}

	// Drops any pending or in-flight search for the provider and clears its results.
	#cancelProvider(providerId: string): void {
		const state: ProviderState | undefined = this.#providerStates().get(providerId);

		if (!state) {
			return;
		}

		this.#currentQueries.set(providerId, '');
		state.querySubject.next('');
		this.#updateProviderResults(providerId, []);
	}

	#scoreProviderResult(command: Command): number {
		const priority: number = (command.priority ?? 0) * 10;
		return 50 + priority;
	}

	#setLoading(providerId: string, loading: boolean): void {
		this.#providerStates.update((map: Map<string, ProviderState>) => {
			const state: ProviderState | undefined = map.get(providerId);

			if (!state) {
				return map;
			}

			const updated: Map<string, ProviderState> = new Map(map);
			updated.set(providerId, { ...state, loading });
			return updated;
		});
	}

	#updateProviderResults(providerId: string, results: ScoredCommand[]): void {
		this.#providerStates.update((map: Map<string, ProviderState>) => {
			const state: ProviderState | undefined = map.get(providerId);

			if (!state) {
				return map;
			}

			const updated: Map<string, ProviderState> = new Map(map);
			updated.set(providerId, { ...state, results, loading: false });
			return updated;
		});
	}

	#clearAllExcept(...keepIds: string[]): void {
		const keepSet: Set<string> = new Set(keepIds);

		for (const providerId of this.#providerStates().keys()) {
			if (!keepSet.has(providerId) && this.#currentQueries.get(providerId)) {
				this.#cancelProvider(providerId);
			}
		}
	}

	#detectPrefix(query: string): string | undefined {
		const prefixes: string[] = this.#providerRegistry.getPrefixes();

		for (const prefix of prefixes) {
			if (query.startsWith(prefix)) {
				return prefix;
			}
		}

		return undefined;
	}

	public destroyProvider(providerId: string): void {
		const state: ProviderState | undefined = this.#providerStates().get(providerId);

		if (!state) {
			return;
		}

		state.subscription?.unsubscribe();
		state.querySubject.complete();
		this.#currentQueries.delete(providerId);

		this.#providerStates.update((map: Map<string, ProviderState>) => {
			const updated: Map<string, ProviderState> = new Map(map);
			updated.delete(providerId);
			return updated;
		});
	}
}

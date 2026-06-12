import { Injectable, inject, signal, computed, DestroyRef, WritableSignal, Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, Subscription, switchMap, debounceTime, catchError, of, tap, Observable } from 'rxjs';
import { Command, ScoredCommand, SearchProvider } from '../models/command';
import { ProviderRegistry } from './provider-registry';

interface ProviderState {
	results: ScoredCommand[];
	loading: boolean;
	subscription: Subscription | null;
	querySubject: Subject<string>;
}

@Injectable({ providedIn: 'root' })
export class AsyncSearchCoordinator {
	readonly #providerRegistry: ProviderRegistry = inject(ProviderRegistry);

	readonly #destroyRef: DestroyRef = inject(DestroyRef);

	readonly #providerStates: WritableSignal<Map<string, ProviderState>> = signal<Map<string, ProviderState>>(new Map());

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
		this.#providerStates.update((map: Map<string, ProviderState>) => {
			for (const state of map.values()) {
				state.querySubject.next('');
			}

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
			this.#updateProviderResults(provider.id, []);
			return;
		}

		const state: ProviderState = this.#getOrCreateState(provider);
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

		const subscription: Subscription = querySubject.pipe(
			debounceTime(providerDebounce),
			tap(() => this.#setLoading(provider.id, true)),
			switchMap((query: string): Observable<Command[]> => {
				if (!query) {
					return of([]);
				}

				return provider.search(query).pipe(
					catchError((): Observable<Command[]> => of([])),
				);
			}),
			takeUntilDestroyed(this.#destroyRef),
		).subscribe((commands: Command[]) => {
			const scored: ScoredCommand[] = commands.map((command: Command) => ({
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

		this.#providerStates.update((map: Map<string, ProviderState>) => {
			let changed: boolean = false;
			const updated: Map<string, ProviderState> = new Map(map);

			for (const [
				providerId,
				state,
			] of updated) {
				if (!keepSet.has(providerId) && state.results.length > 0) {
					updated.set(providerId, { ...state, results: [], loading: false });
					changed = true;
				}
			}

			return changed ? updated : map;
		});
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

		if (state) {
			state.subscription?.unsubscribe();
			state.querySubject.complete();
		}

		this.#providerStates.update((map: Map<string, ProviderState>) => {
			const updated: Map<string, ProviderState> = new Map(map);
			updated.delete(providerId);
			return updated;
		});
	}
}

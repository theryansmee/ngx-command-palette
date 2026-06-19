import { Injectable, inject, signal, computed, effect, untracked, DestroyRef, Signal, WritableSignal } from '@angular/core';
import { Command, ScoredCommand, SearchProvider, CommandPaletteConfig } from '../models/command';
import { CommandRegistry } from './command-registry';
import { SearchEngine } from './search-engine';
import { RecentCommandsStore } from './recent-store';
import { ProviderRegistry } from './provider-registry';
import { AsyncSearchCoordinator } from './async-search';
import { COMMAND_PALETTE_CONFIG } from '../provide';

@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
	readonly #registry: CommandRegistry = inject(CommandRegistry);

	readonly #searchEngine: SearchEngine = inject(SearchEngine);

	readonly #recentStore: RecentCommandsStore = inject(RecentCommandsStore);

	readonly #providerRegistry: ProviderRegistry = inject(ProviderRegistry);

	readonly #asyncSearch: AsyncSearchCoordinator = inject(AsyncSearchCoordinator);

	readonly #config: CommandPaletteConfig = inject(COMMAND_PALETTE_CONFIG);

	readonly #isOpen: WritableSignal<boolean> = signal<boolean>(false);

	readonly #query: WritableSignal<string> = signal<string>('');

	public readonly isOpen: Signal<boolean> = this.#isOpen.asReadonly();

	public readonly query: Signal<string> = this.#query.asReadonly();

	public readonly loading: Signal<boolean> = this.#asyncSearch.loading;

	public readonly activeProvider: Signal<SearchProvider | null> = computed(() => {
		const query: string = this.#query().trim();

		if (!query) {
			return null;
		}

		const prefixes: string[] = this.#providerRegistry.getPrefixes();

		for (const prefix of prefixes) {
			if (query.startsWith(prefix)) {
				return this.#providerRegistry.getByPrefix(prefix) ?? null;
			}
		}

		return null;
	});

	public readonly displayQuery: Signal<string> = computed(() => {
		const provider: SearchProvider | null = this.activeProvider();
		const query: string = this.#query();

		if (provider?.prefix && query.startsWith(provider.prefix)) {
			return query.slice(provider.prefix.length);
		}

		return query;
	});

	public readonly activePlaceholder: Signal<string> = computed(() => {
		const provider: SearchProvider | null = this.activeProvider();
		return provider?.placeholder ?? this.#config.placeholder ?? 'Search or type a command...';
	});

	public readonly emptyMessage: Signal<string> = computed(() => {
		const provider: SearchProvider | null = this.activeProvider();
		return provider?.emptyMessage ?? 'No results found.';
	});

	public readonly debounceMs: number = this.#config.debounce ?? 0;

	public readonly results: Signal<ScoredCommand[]> = computed<ScoredCommand[]>(() => {
		const query: string = this.#query();
		const staticResults: ScoredCommand[] = this.#searchEngine.search(query);
		const asyncResults: ScoredCommand[] = this.#asyncSearch.results();

		if (asyncResults.length === 0) {
			return staticResults;
		}

		const merged: ScoredCommand[] = [
			...staticResults,
			...asyncResults,
		];
		merged.sort((first: ScoredCommand, second: ScoredCommand) => second.score - first.score);
		return merged;
	});

	constructor() {
		this.#dispatchAsyncSearchOnQueryChange();
	}

	public open(initialQuery: string = ''): void {
		this.#query.set(initialQuery);
		this.#isOpen.set(true);
	}

	public close(): void {
		this.#isOpen.set(false);
		this.#query.set('');
		this.#asyncSearch.clear();
	}

	public toggle(): void {
		if (this.#isOpen()) {
			this.close();
		} else {
			this.open();
		}
	}

	public updateQuery(query: string): void {
		this.#query.set(query);
	}

	public execute(command: Command): void {
		this.#recentStore.record(command.id);
		this.close();
		command.action();
	}

	public register(commands: Command[], destroyRef?: DestroyRef): void {
		const ids: string[] = commands.map((command: Command) => command.id);
		this.#registry.register(commands);

		if (!destroyRef) {
			return;
		}

		destroyRef.onDestroy(() => {
			this.#registry.deregister(ids);
		});
	}

	public registerProvider(provider: SearchProvider, destroyRef?: DestroyRef): void {
		this.#providerRegistry.register(provider);

		if (!destroyRef) {
			return;
		}

		destroyRef.onDestroy(() => {
			this.#asyncSearch.destroyProvider(provider.id);
			this.#providerRegistry.deregister(provider.id);
		});
	}

	#dispatchAsyncSearchOnQueryChange(): void {
		effect(() => {
			const query: string = this.#query();
			untracked(() => this.#asyncSearch.search(query));
		});
	}
}

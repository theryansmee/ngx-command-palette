import { Injectable, inject, isDevMode, signal, computed, effect, untracked, DestroyRef, Signal, WritableSignal } from '@angular/core';
import { Command, ScoredCommand, SearchProvider, CommandPaletteConfig } from '../models/command';
import { CommandChildren } from '../models/command-children.type';
import { CommandPage } from '../models/command-page.interface';
import { CommandPageSource } from '../models/command-page-source.type';
import { CommandRegistry } from './command-registry';
import { SearchEngine } from './search-engine';
import { RecentCommandsStore } from './recent-store';
import { ProviderRegistry } from './provider-registry';
import { AsyncSearchCoordinator } from './async-search';
import { PageStack } from './page-stack';
import { COMMAND_PALETTE_CONFIG } from '../provide';

@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
	readonly #registry: CommandRegistry = inject(CommandRegistry);

	readonly #searchEngine: SearchEngine = inject(SearchEngine);

	readonly #recentStore: RecentCommandsStore = inject(RecentCommandsStore);

	readonly #providerRegistry: ProviderRegistry = inject(ProviderRegistry);

	readonly #asyncSearch: AsyncSearchCoordinator = inject(AsyncSearchCoordinator);

	readonly #pageStack: PageStack = inject(PageStack);

	readonly #config: CommandPaletteConfig = inject(COMMAND_PALETTE_CONFIG);

	readonly #isOpen: WritableSignal<boolean> = signal<boolean>(false);

	readonly #query: WritableSignal<string> = signal<string>('');

	public readonly isOpen: Signal<boolean> = this.#isOpen.asReadonly();

	public readonly query: Signal<string> = this.#query.asReadonly();

	public readonly loading: Signal<boolean> = computed(() => {
		return this.#asyncSearch.loading()
			|| this.#pageStack.loading();
	});

	// Typed-prefix detection only applies at the root of the page stack.
	readonly #prefixProvider: Signal<SearchProvider | null> = computed(() => {
		if (this.#pageStack.depth() > 0) {
			return null;
		}

		const query: string = this.#query().trim();

		if (!query) {
			return null;
		}

		for (const prefix of this.#providerRegistry.getPrefixes()) {
			if (query.startsWith(prefix)) {
				return this.#providerRegistry.getByPrefix(prefix) ?? null;
			}
		}

		return null;
	});

	public readonly currentPage: Signal<CommandPage | null> = computed(() => {
		const pushedPage: CommandPage | null = this.#pageStack.currentPage();

		if (pushedPage) {
			return pushedPage;
		}

		const provider: SearchProvider | null = this.#prefixProvider();

		if (!provider) {
			return null;
		}

		// A typed prefix derives a provider page instead of pushing one, which keeps
		// query() and displayQuery() behaving exactly as they did before pages existed.
		return {
			id: `prefix:${provider.id}`,
			title: provider.prefix!,
			placeholder: provider.placeholder,
			emptyMessage: provider.emptyMessage,
			source: {
				kind: 'provider',
				providerId: provider.id,
			},
		};
	});

	public readonly breadcrumbs: Signal<string[]> = computed(() => {
		const pushedTitles: string[] = this.#pageStack.titles();

		if (pushedTitles.length > 0) {
			return pushedTitles;
		}

		const provider: SearchProvider | null = this.#prefixProvider();
		return provider?.prefix ? [provider.prefix] : [];
	});

	public readonly activeProvider: Signal<SearchProvider | null> = computed(() => {
		const page: CommandPage | null = this.currentPage();

		if (page?.source.kind !== 'provider') {
			return null;
		}

		return this.#providerRegistry.getById(page.source.providerId) ?? null;
	});

	public readonly displayQuery: Signal<string> = computed(() => {
		const provider: SearchProvider | null = this.#prefixProvider();
		const query: string = this.#query();

		if (provider?.prefix && query.startsWith(provider.prefix)) {
			return query.slice(provider.prefix.length);
		}

		return query;
	});

	public readonly activePlaceholder: Signal<string> = computed(() => {
		const page: CommandPage | null = this.currentPage();
		return page?.placeholder ?? this.#config.placeholder ?? 'Search or type a command...';
	});

	public readonly emptyMessage: Signal<string> = computed(() => {
		const page: CommandPage | null = this.currentPage();

		// A provider page below its minQueryLength has not searched yet, so the empty
		// message would read like a failure the moment the user lands on the page.
		if (page?.source.kind === 'provider') {
			const provider: SearchProvider | null = this.activeProvider();
			const minQueryLength: number = provider?.minQueryLength ?? 1;

			if (this.displayQuery().trim().length < minQueryLength) {
				return page.placeholder ?? 'Type to search...';
			}
		}

		return page?.emptyMessage ?? 'No results found.';
	});

	public readonly inputAriaLabel: Signal<string> = computed(() => {
		return this.currentPage()?.title ?? 'Search commands';
	});

	public readonly debounceMs: number = this.#config.debounce ?? 0;

	public readonly results: Signal<ScoredCommand[]> = computed<ScoredCommand[]>(() => {
		const page: CommandPage | null = this.currentPage();

		if (!page) {
			return this.#rootResults();
		}

		if (page.source.kind === 'provider') {
			return this.#asyncSearch.results();
		}

		const pageCommands: Command[] = this.#pageStack.current()?.loadedCommands ?? [];

		// Pages are menus: authored order at an empty query, unlimited unless capped.
		return this.#searchEngine.search(this.displayQuery(), {
			commands: pageCommands,
			maxResults: page.maxResults ?? null,
			rankDefaults: false,
		});
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
		this.#pageStack.reset();
	}

	public toggle(): void {
		if (this.#isOpen()) {
			this.close();
			return;
		}

		this.open();
	}

	public updateQuery(query: string): void {
		this.#query.set(query);
	}

	public updateDisplayQuery(displayValue: string): void {
		const provider: SearchProvider | null = this.#prefixProvider();

		if (provider?.prefix) {
			this.#query.set(provider.prefix + displayValue);
			return;
		}

		this.#query.set(displayValue);
	}

	public execute(command: Command): void {
		if (command.children) {
			void command.action?.();
			this.pushPage(this.#pageFromCommand(command));
			return;
		}

		if (!command.action) {
			if (isDevMode()) {
				console.warn(`[ngx-command-palette] Command "${command.id}" has neither an action nor children.`);
			}

			return;
		}

		this.#recordExecution(command);
		this.close();
		command.action();
	}

	public pushPage(page: CommandPage): void {
		if (isDevMode()) {
			this.#warnOnStaticChildIdCollisions(page);
			this.#warnOnUnknownProvider(page);
		}

		this.#asyncSearch.clear();
		this.#pageStack.push(page);
		this.#query.set('');
	}

	public popPage(): void {
		this.#asyncSearch.clear();
		this.#pageStack.pop();
		this.#query.set('');
	}

	public goBack(): void {
		if (this.#pageStack.depth() > 0) {
			this.popPage();
			return;
		}

		if (this.#prefixProvider()) {
			this.#query.set('');
		}
	}

	public handleEscape(): void {
		// Breadcrumbs cover both pushed pages and typed-prefix mode, so 'pop' walks
		// the same trail the chips show and only closes once it is empty.
		if (this.#config.escapeBehavior === 'pop' && this.breadcrumbs().length > 0) {
			this.goBack();
			return;
		}

		this.close();
	}

	public openPage(commandIdOrPage: string | CommandPage): void {
		const page: CommandPage | null = typeof commandIdOrPage === 'string'
			? this.#pageFromCommandId(commandIdOrPage)
			: commandIdOrPage;

		if (!page) {
			if (isDevMode()) {
				console.warn(`[ngx-command-palette] openPage: no command with children found for "${commandIdOrPage}".`);
			}

			return;
		}

		this.open();
		// A deep link must land on its page, not stack on top of wherever the user was.
		this.#pageStack.reset();
		this.pushPage(page);
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
			const page: CommandPage | null = this.currentPage();
			const query: string = this.#query();

			untracked(() => {
				// Static and loader pages never search providers; pushPage already cleared them.
				if (page && page.source.kind !== 'provider') {
					return;
				}

				if (page?.source.kind === 'provider' && this.#pageStack.depth() > 0) {
					this.#asyncSearch.searchOnly(page.source.providerId, query.trim());
					return;
				}

				this.#asyncSearch.search(query);
			});
		});
	}

	#rootResults(): ScoredCommand[] {
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
	}

	#pageFromCommand(command: Command): CommandPage {
		const hasEmptyChildren: boolean = Array.isArray(command.children) && command.children.length === 0;

		if (isDevMode() && hasEmptyChildren) {
			console.warn(`[ngx-command-palette] Command "${command.id}" has an empty children array.`);
		}

		return {
			id: command.id,
			title: command.label.replace(/(\.\.\.|…)\s*$/, '').trim(),
			placeholder: command.pagePlaceholder,
			emptyMessage: command.pageEmptyMessage,
			source: this.#sourceFromChildren(command.children!),
		};
	}

	#pageFromCommandId(commandId: string): CommandPage | null {
		const command: Command | undefined = this.#registry.getById(commandId);
		return command?.children ? this.#pageFromCommand(command) : null;
	}

	#sourceFromChildren(children: CommandChildren): CommandPageSource {
		if (Array.isArray(children)) {
			return {
				kind: 'static',
				commands: children,
			};
		}

		if (typeof children === 'function') {
			return {
				kind: 'loader',
				load: children,
			};
		}

		return {
			kind: 'provider',
			providerId: children.provider,
		};
	}

	#recordExecution(command: Command): void {
		this.#recentStore.record(command.id);

		// Ancestor pages that map to registered commands count too, so a frequently
		// used submenu rises at root even though opening it is not an execution.
		for (const pageId of this.#pageStack.pageIds()) {
			if (this.#registry.getById(pageId)) {
				this.#recentStore.record(pageId);
			}
		}
	}

	#warnOnUnknownProvider(page: CommandPage): void {
		if (page.source.kind !== 'provider') {
			return;
		}

		if (!this.#providerRegistry.getById(page.source.providerId)) {
			console.warn(`[ngx-command-palette] Page "${page.id}" references unknown provider "${page.source.providerId}".`);
		}
	}

	#warnOnStaticChildIdCollisions(page: CommandPage): void {
		if (page.source.kind !== 'static') {
			return;
		}

		for (const child of page.source.commands) {
			if (this.#registry.getById(child.id)) {
				console.warn(`[ngx-command-palette] Child command id "${child.id}" collides with a registered command id.`);
			}
		}
	}
}

import { Injectable, inject, signal, computed, DestroyRef, Signal, WritableSignal } from '@angular/core';
import { Command, ScoredCommand } from '../models/command';
import { CommandRegistry } from './command-registry';
import { SearchEngine } from './search-engine';
import { RecentCommandsStore } from './recent-store';

@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
	readonly #registry: CommandRegistry = inject(CommandRegistry);

	readonly #searchEngine: SearchEngine = inject(SearchEngine);

	readonly #recentStore: RecentCommandsStore = inject(RecentCommandsStore);

	readonly #isOpen: WritableSignal<boolean> = signal<boolean>(false);

	readonly #query: WritableSignal<string> = signal<string>('');

	public readonly isOpen: Signal<boolean> = this.#isOpen.asReadonly();

	public readonly query: Signal<string> = this.#query.asReadonly();

	public readonly results: Signal<ScoredCommand[]> = computed<ScoredCommand[]>(() => {
		return this.#searchEngine.search(this.#query());
	});

	public open(initialQuery: string = ''): void {
		this.#query.set(initialQuery);
		this.#isOpen.set(true);
	}

	public close(): void {
		this.#isOpen.set(false);
		this.#query.set('');
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

		if (destroyRef) {
			destroyRef.onDestroy(() => {
				this.#registry.deregister(ids);
			});
		}
	}
}

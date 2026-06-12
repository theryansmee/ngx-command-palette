import { Injectable, inject, signal, computed, DestroyRef, Signal, WritableSignal } from '@angular/core';
import { Command, ScoredCommand } from '../models/command';
import { CommandRegistry } from './command-registry';
import { SearchEngine } from './search-engine';
import { RecentCommandsStore } from './recent-store';

@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
	private readonly registry: CommandRegistry = inject(CommandRegistry);
	private readonly searchEngine: SearchEngine = inject(SearchEngine);
	private readonly recentStore: RecentCommandsStore = inject(RecentCommandsStore);

	private readonly _isOpen: WritableSignal<boolean> = signal<boolean>(false);
	private readonly _query: WritableSignal<string> = signal<string>('');

	public readonly isOpen: Signal<boolean> = this._isOpen.asReadonly();
	public readonly query: Signal<string> = this._query.asReadonly();

	public readonly results: Signal<ScoredCommand[]> = computed<ScoredCommand[]>(() => {
		return this.searchEngine.search(this._query());
	});

	public open(initialQuery: string = ''): void {
		this._query.set(initialQuery);
		this._isOpen.set(true);
	}

	public close(): void {
		this._isOpen.set(false);
		this._query.set('');
	}

	public toggle(): void {
		if (this._isOpen()) {
			this.close();
		} else {
			this.open();
		}
	}

	public updateQuery(query: string): void {
		this._query.set(query);
	}

	public execute(command: Command): void {
		this.recentStore.record(command.id);
		this.close();
		command.action();
	}

	public register(commands: Command[], destroyRef?: DestroyRef): void {
		const ids: string[] = commands.map((c: Command) => c.id);
		this.registry.register(commands);

		if (destroyRef) {
			destroyRef.onDestroy(() => {
				this.registry.deregister(ids);
			});
		}
	}
}

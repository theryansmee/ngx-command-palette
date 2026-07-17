import { Injectable, isDevMode, signal, computed, Signal, WritableSignal } from '@angular/core';
import { Subscription, catchError, of, Observable } from 'rxjs';
import { Command } from '../models/command';
import { CommandPage } from '../models/command-page.interface';
import { PageStackEntry } from './page-stack-entry.interface';

@Injectable({ providedIn: 'root' })
export class PageStack {
	readonly #entries: WritableSignal<PageStackEntry[]> = signal<PageStackEntry[]>([]);

	// Entries are keyed by a counter rather than page.id so duplicate ids on the stack stay independent.
	#nextEntryKey: number = 0;

	readonly #loaderSubscriptions: Map<number, Subscription> = new Map<number, Subscription>();

	// Keyed by the loader function: re-entering the same loader in a session skips the
	// refetch, while pages that share an id but have different loaders stay separate.
	readonly #loaderCache: Map<() => Observable<Command[]>, Command[]> = new Map<() => Observable<Command[]>, Command[]>();

	public readonly current: Signal<PageStackEntry | null> = computed(() => this.#entries().at(-1) ?? null);

	public readonly currentPage: Signal<CommandPage | null> = computed(() => this.current()?.page ?? null);

	public readonly depth: Signal<number> = computed(() => this.#entries().length);

	public readonly titles: Signal<string[]> = computed(() => {
		return this.#entries().map((entry: PageStackEntry) => entry.page.title);
	});

	public readonly pageIds: Signal<string[]> = computed(() => {
		return this.#entries().map((entry: PageStackEntry) => entry.page.id);
	});

	public readonly loading: Signal<boolean> = computed(() => this.current()?.loading ?? false);

	public push(page: CommandPage): void {
		const isDuplicateId: boolean = this.#entries()
			.some((existingEntry: PageStackEntry) => existingEntry.page.id === page.id);

		if (isDevMode() && isDuplicateId) {
			console.warn(`[ngx-command-palette] Page id "${page.id}" is already on the stack.`);
		}

		const entryKey: number = this.#nextEntryKey++;
		const entry: PageStackEntry = {
			entryKey,
			page,
			loadedCommands: page.source.kind === 'static' ? page.source.commands : null,
			loading: false,
			loadFailed: false,
		};

		this.#entries.update((entries: PageStackEntry[]) => [
			...entries,
			entry,
		]);

		if (page.source.kind === 'loader') {
			this.#load(entryKey, page.source.load);
		}
	}

	public pop(): void {
		const currentEntry: PageStackEntry | null = this.current();

		if (!currentEntry) {
			return;
		}

		this.#cancelLoad(currentEntry.entryKey);
		this.#entries.update((entries: PageStackEntry[]) => entries.slice(0, -1));
	}

	public reset(): void {
		for (const subscription of this.#loaderSubscriptions.values()) {
			subscription.unsubscribe();
		}

		this.#loaderSubscriptions.clear();
		this.#loaderCache.clear();
		this.#entries.set([]);
	}

	#load(entryKey: number, load: () => Observable<Command[]>): void {
		const cached: Command[] | undefined = this.#loaderCache.get(load);

		if (cached) {
			this.#patchEntry(entryKey, { loadedCommands: cached });
			return;
		}

		this.#patchEntry(entryKey, { loading: true });

		let failed: boolean = false;

		const subscription: Subscription = load().pipe(
			catchError((): Observable<Command[]> => {
				failed = true;
				this.#patchEntry(entryKey, { loadFailed: true });
				return of([]);
			}),
		).subscribe((commands: Command[]) => {
			if (!failed) {
				this.#loaderCache.set(load, commands);
			}

			this.#patchEntry(entryKey, {
				loadedCommands: commands,
				loading: false,
			});
			this.#loaderSubscriptions.delete(entryKey);
		});

		this.#loaderSubscriptions.set(entryKey, subscription);
	}

	#cancelLoad(entryKey: number): void {
		this.#loaderSubscriptions.get(entryKey)?.unsubscribe();
		this.#loaderSubscriptions.delete(entryKey);
	}

	#patchEntry(entryKey: number, patch: Partial<PageStackEntry>): void {
		this.#entries.update((entries: PageStackEntry[]) => {
			return entries.map((entry: PageStackEntry) => {
				if (entry.entryKey !== entryKey) {
					return entry;
				}

				return {
					...entry,
					...patch,
				};
			});
		});
	}
}

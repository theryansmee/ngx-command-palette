import { Injectable, signal, computed, WritableSignal, Signal } from '@angular/core';
import { Command } from '../models/command';

@Injectable({ providedIn: 'root' })
export class CommandRegistry {
	readonly #commandMap: WritableSignal<Map<string, Command>> = signal<Map<string, Command>>(new Map());

	readonly #sourceMap: WritableSignal<Map<string, Set<string>>> = signal<Map<string, Set<string>>>(new Map());

	public readonly commands: Signal<Command[]> = computed(() => [...this.#commandMap().values()]);

	public register(commands: Command[], source: string = 'manual'): void {
		this.#commandMap.update((map: Map<string, Command>) => {
			const updated: Map<string, Command> = new Map(map);

			for (const command of commands) {
				updated.set(command.id, command);
			}

			return updated;
		});

		this.#sourceMap.update((map: Map<string, Set<string>>) => {
			const updated: Map<string, Set<string>> = new Map(map);
			const ids: Set<string> = updated.get(source) ?? new Set();

			for (const command of commands) {
				ids.add(command.id);
			}

			updated.set(source, ids);
			return updated;
		});
	}

	public deregister(commandIds: string[], source: string = 'manual'): void {
		this.#commandMap.update((map: Map<string, Command>) => {
			const updated: Map<string, Command> = new Map(map);

			for (const id of commandIds) {
				updated.delete(id);
			}

			return updated;
		});

		this.#sourceMap.update((map: Map<string, Set<string>>) => {
			const updated: Map<string, Set<string>> = new Map(map);
			const existing: Set<string> | undefined = updated.get(source);

			if (existing) {
				const filtered: Set<string> = new Set(existing);

				for (const id of commandIds) {
					filtered.delete(id);
				}

				updated.set(source, filtered);
			}

			return updated;
		});
	}

	public registerBatch(source: string, commands: Command[]): void {
		const existingIds: Set<string> | undefined = this.#sourceMap().get(source);

		if (existingIds) {
			this.deregister([...existingIds], source);
		}

		this.register(commands, source);
	}

	public getById(id: string): Command | undefined {
		return this.#commandMap().get(id);
	}
}

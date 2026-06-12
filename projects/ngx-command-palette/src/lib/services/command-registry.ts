import { Injectable, signal, computed } from '@angular/core';
import { Command } from '../models/command';

@Injectable({ providedIn: 'root' })
export class CommandRegistry {
	private readonly commandMap = signal<Map<string, Command>>(new Map());
	private readonly sourceMap = signal<Map<string, Set<string>>>(new Map());

	public readonly commands = computed(() => [...this.commandMap().values()]);

	public register(commands: Command[], source: string = 'manual'): void {
		this.commandMap.update((map: Map<string, Command>) => {
			const updated: Map<string, Command> = new Map(map);

			for (const cmd of commands) {
				updated.set(cmd.id, cmd);
			}

			return updated;
		});

		this.sourceMap.update((map: Map<string, Set<string>>) => {
			const updated: Map<string, Set<string>> = new Map(map);
			const ids: Set<string> = updated.get(source) ?? new Set();

			for (const cmd of commands) {
				ids.add(cmd.id);
			}

			updated.set(source, ids);
			return updated;
		});
	}

	public deregister(commandIds: string[], source: string = 'manual'): void {
		this.commandMap.update((map: Map<string, Command>) => {
			const updated: Map<string, Command> = new Map(map);

			for (const id of commandIds) {
				updated.delete(id);
			}

			return updated;
		});

		this.sourceMap.update((map: Map<string, Set<string>>) => {
			const updated: Map<string, Set<string>> = new Map(map);
			const ids: Set<string> | undefined = updated.get(source);

			if (ids) {
				for (const id of commandIds) {
					ids.delete(id);
				}
			}

			return updated;
		});
	}

	public registerBatch(source: string, commands: Command[]): void {
		const existingIds: Set<string> | undefined = this.sourceMap().get(source);

		if (existingIds) {
			this.deregister([...existingIds], source);
		}

		this.register(commands, source);
	}

	public getById(id: string): Command | undefined {
		return this.commandMap().get(id);
	}
}

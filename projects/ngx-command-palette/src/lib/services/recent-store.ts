import { Injectable, inject, PLATFORM_ID, signal, computed, WritableSignal, Signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommandPaletteConfig } from '../models/command';
import { COMMAND_PALETTE_CONFIG } from '../provide';

const storageKey: string = 'ngx-command-palette-recent';

// Storage holds more ids than the boost window so ids outside the current view
// (e.g. page children while at root) cannot evict the rest of the history.
const storedIdsMultiplier: number = 4;

@Injectable({ providedIn: 'root' })
export class RecentCommandsStore {
	readonly #platformId: object = inject(PLATFORM_ID);

	readonly #config: CommandPaletteConfig = inject(COMMAND_PALETTE_CONFIG);

	readonly #enabled: boolean = this.#config.trackRecent ?? false;

	readonly #recentCount: number = this.#config.recentCount ?? 5;

	readonly #recentIds: WritableSignal<string[]> = signal<string[]>(this.#enabled ? this.#load() : []);

	public readonly ids: Signal<string[]> = computed(() => this.#recentIds().slice(0, this.#recentCount));

	public record(commandId: string): void {
		if (!this.#enabled) {
			return;
		}

		this.#recentIds.update((ids: string[]) => {
			const filtered: string[] = ids.filter((id: string) => id !== commandId);
			const updated: string[] = [
				commandId,
				...filtered,
			].slice(0, this.#recentCount * storedIdsMultiplier);

			this.#save(updated);
			return updated;
		});
	}

	public getBoost(commandId: string): number {
		if (!this.#enabled) {
			return 0;
		}

		const index: number = this.#recentIds().indexOf(commandId);

		if (index === -1) {
			return 0;
		}

		return Math.max(0, (this.#recentCount - index) * 4);
	}

	// Boost slots go only to ids present in the candidate set, so recorded ids that
	// are not being scored (e.g. page children while at root) cannot dilute the rest.
	public getBoostsFor(candidateIds: readonly string[]): Map<string, number> {
		const boosts: Map<string, number> = new Map<string, number>();

		if (!this.#enabled) {
			return boosts;
		}

		const candidateSet: Set<string> = new Set(candidateIds);
		let assignedCount: number = 0;

		for (const recentId of this.#recentIds()) {
			if (assignedCount >= this.#recentCount) {
				break;
			}

			if (!candidateSet.has(recentId)) {
				continue;
			}

			boosts.set(recentId, (this.#recentCount - assignedCount) * 4);
			assignedCount++;
		}

		return boosts;
	}

	#load(): string[] {
		if (!isPlatformBrowser(this.#platformId)) {
			return [];
		}

		try {
			const stored: string | null = localStorage.getItem(storageKey);
			return stored ? JSON.parse(stored) as string[] : [];
		} catch {
			return [];
		}
	}

	#save(ids: string[]): void {
		if (!isPlatformBrowser(this.#platformId)) {
			return;
		}

		try {
			localStorage.setItem(storageKey, JSON.stringify(ids));
		} catch {
			// localStorage may be full or unavailable
		}
	}
}

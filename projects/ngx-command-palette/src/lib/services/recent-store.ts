import { Injectable, inject, PLATFORM_ID, signal, computed, WritableSignal, Signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommandPaletteConfig } from '../models/command';
import { COMMAND_PALETTE_CONFIG } from '../provide';

const STORAGE_KEY: string = 'ngx-command-palette-recent';

@Injectable({ providedIn: 'root' })
export class RecentCommandsStore {
	private readonly platformId: object = inject(PLATFORM_ID);
	private readonly config: CommandPaletteConfig = inject(COMMAND_PALETTE_CONFIG);
	private readonly recentIds: WritableSignal<string[]> = signal<string[]>(this.load());

	public readonly ids: Signal<string[]> = computed(() => this.recentIds());

	public record(commandId: string): void {
		this.recentIds.update((ids: string[]) => {
			const filtered: string[] = ids.filter((id: string) => id !== commandId);
			const updated: string[] = [
				commandId,
				...filtered,
			].slice(0, this.config.recentCount);

			this.save(updated);
			return updated;
		});
	}

	public getBoost(commandId: string): number {
		const index: number = this.recentIds().indexOf(commandId);

		if (index === -1) {
			return 0;
		}

		return ((this.config.recentCount ?? 5) - index) * 4;
	}

	private load(): string[] {
		if (!isPlatformBrowser(this.platformId)) {
			return [];
		}

		try {
			const stored: string | null = localStorage.getItem(STORAGE_KEY);
			return stored ? JSON.parse(stored) as string[] : [];
		} catch {
			return [];
		}
	}

	private save(ids: string[]): void {
		if (!isPlatformBrowser(this.platformId)) {
			return;
		}

		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
		} catch {
			// localStorage may be full or unavailable
		}
	}
}

import { Component, ChangeDetectionStrategy, inject, signal, computed, Signal, WritableSignal, effect } from '@angular/core';
import { CommandPaletteService } from '../../services/command-palette.service';
import { ScoredCommand, Command } from '../../models/command';
import { CmdGroupComponent } from '../group/group.component';
import { CmdItemComponent } from '../item/item.component';
import { CmdEmptyComponent } from '../empty/empty.component';

interface CommandGroup {
	category: string;
	items: ScoredCommand[];
}

@Component({
	selector: 'cmd-list',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		CmdGroupComponent,
		CmdItemComponent,
		CmdEmptyComponent,
	],
	host: {
		'id': 'cmd-listbox',
		'role': 'listbox',
	},
	templateUrl: './list.component.html',
	styleUrl: './list.component.scss',
})
export class CmdListComponent {
	private readonly palette: CommandPaletteService = inject(CommandPaletteService);

	private readonly _activeIndex: WritableSignal<number> = signal<number>(0);

	constructor() {
		effect(() => {
			this.palette.query();
			this._activeIndex.set(0);
		});
	}

	public readonly groups: Signal<CommandGroup[]> = computed<CommandGroup[]>(() => {
		const results: ScoredCommand[] = this.palette.results();
		const groupMap: Map<string, ScoredCommand[]> = new Map();

		for (const scored of results) {
			const category: string = scored.command.category ?? 'Commands';
			const existing: ScoredCommand[] = groupMap.get(category) ?? [];
			existing.push(scored);
			groupMap.set(category, existing);
		}

		return [...groupMap.entries()].map(([
			category,
			items,
		]: [string, ScoredCommand[]
]) => ({ category, items }));
	});

	public readonly flatItems: Signal<ScoredCommand[]> = computed<ScoredCommand[]>(() => {
		return this.groups().flatMap((g: CommandGroup) => g.items);
	});

	public readonly activeCommandId: Signal<string | null> = computed<string | null>(() => {
		const items: ScoredCommand[] = this.flatItems();
		const index: number = this._activeIndex();

		if (items.length === 0 || index < 0 || index >= items.length) {
			return null;
		}

		return items[index].command.id;
	});

	public moveSelection(delta: number): void {
		const length: number = this.flatItems().length;

		if (length === 0) {
			return;
		}

		this._activeIndex.update((current: number) => {
			const next: number = current + delta;

			if (next < 0) {
				return length - 1;
			}

			if (next >= length) {
				return 0;
			}

			return next;
		});
	}

	public selectActive(): void {
		const items: ScoredCommand[] = this.flatItems();
		const index: number = this._activeIndex();

		if (items.length > 0 && index >= 0 && index < items.length) {
			this.palette.execute(items[index].command);
		}
	}

	public resetSelection(): void {
		this._activeIndex.set(0);
	}

	public onSelect(command: Command): void {
		this.palette.execute(command);
	}
}

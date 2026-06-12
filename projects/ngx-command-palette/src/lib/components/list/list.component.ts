import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
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
	template: `
		@if (groups().length === 0) {
			<cmd-empty />
		} @else {
			@for (group of groups(); track group.category) {
				<cmd-group [heading]="group.category">
					@for (item of group.items; track item.command.id) {
						<cmd-item
							[command]="item.command"
							[isActive]="item.command.id === activeCommandId()"
							(selected)="onSelect($event)"
						/>
					}
				</cmd-group>
			}
		}
	`,
	styles: [`
		:host {
			display: block;
			max-height: var(--cmd-max-height, 400px);
			overflow-y: auto;
			overscroll-behavior: contain;
		}
	`],
})
export class CmdListComponent {
	private readonly palette: CommandPaletteService = inject(CommandPaletteService);

	private readonly _activeIndex = signal<number>(0);

	public readonly flatItems = computed<ScoredCommand[]>(() => this.palette.results());

	public readonly groups = computed<CommandGroup[]>(() => {
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
		]: [string, ScoredCommand[]]) => ({ category, items }));
	});

	public readonly activeCommandId = computed<string | null>(() => {
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

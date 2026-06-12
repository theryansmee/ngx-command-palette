import { Component, ChangeDetectionStrategy, inject, Signal, viewChild, computed, HostListener } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { A11yModule } from '@angular/cdk/a11y';
import { CommandPaletteService } from '../../services/command-palette.service';
import { COMMAND_PALETTE_CONFIG } from '../../provide';
import { CommandPaletteConfig } from '../../models/command';
import { CmdInputComponent } from '../input/input.component';
import { CmdListComponent } from '../list/list.component';
import { CmdFooterComponent } from '../footer/footer.component';

interface ParsedShortcut {
	key: string;
	meta: boolean;
	ctrl: boolean;
	shift: boolean;
	alt: boolean;
}

@Component({
	selector: 'cmd-palette',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		OverlayModule,
		PortalModule,
		A11yModule,
		CmdInputComponent,
		CmdListComponent,
		CmdFooterComponent,
	],
	templateUrl: './palette.component.html',
	styleUrl: './palette.component.scss',
})
export class CmdPaletteComponent {
	public readonly palette: CommandPaletteService = inject(CommandPaletteService);

	public readonly listComponent: Signal<CmdListComponent | undefined> = viewChild(CmdListComponent);

	readonly #parsedShortcut: ParsedShortcut;

	public readonly activeDescendantId: Signal<string | null> = computed(() => {
		const list: CmdListComponent | undefined = this.listComponent();
		const id: string | null = list?.activeCommandId() ?? null;
		return id ? `cmd-item-${id}` : null;
	});

	constructor() {
		const config: CommandPaletteConfig = inject(COMMAND_PALETTE_CONFIG);
		const parts: string[] = (config.shortcut ?? 'meta.k').split('.');

		this.#parsedShortcut = {
			key: parts[parts.length - 1],
			meta: parts.includes('meta'),
			ctrl: parts.includes('ctrl'),
			shift: parts.includes('shift'),
			alt: parts.includes('alt'),
		};
	}

	@HostListener('document:keydown', ['$event'])
	public onGlobalKeydown(event: KeyboardEvent): void {
		const shortcut: ParsedShortcut = this.#parsedShortcut;

		if (
			event.key.toLowerCase() === shortcut.key.toLowerCase()
			&& (!shortcut.meta || event.metaKey)
			&& (!shortcut.ctrl || event.ctrlKey)
			&& (!shortcut.shift || event.shiftKey)
			&& (!shortcut.alt || event.altKey)
		) {
			event.preventDefault();
			this.palette.toggle();
		}
	}

	public onKeydown(event: KeyboardEvent): void {
		const list: CmdListComponent | undefined = this.listComponent();

		switch (event.key) {
			case 'ArrowDown':
			case 'Tab':
				event.preventDefault();
				list?.moveSelection(1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				list?.moveSelection(-1);
				break;
			case 'Enter':
				event.preventDefault();
				list?.selectActive();
				break;
			case 'Escape':
				event.preventDefault();
				this.palette.close();
				break;
		}
	}
}

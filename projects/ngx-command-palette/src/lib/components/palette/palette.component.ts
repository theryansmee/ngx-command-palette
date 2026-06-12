import { Component, ChangeDetectionStrategy, inject, Signal, PLATFORM_ID, viewChild, OnDestroy, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { A11yModule } from '@angular/cdk/a11y';
import { CommandPaletteService } from '../../services/command-palette.service';
import { COMMAND_PALETTE_CONFIG } from '../../provide';
import { CommandPaletteConfig } from '../../models/command';
import { CmdInputComponent } from '../input/input.component';
import { CmdListComponent } from '../list/list.component';
import { CmdFooterComponent } from '../footer/footer.component';

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
export class CmdPaletteComponent implements OnDestroy {
	public readonly palette: CommandPaletteService = inject(CommandPaletteService);
	private readonly config: CommandPaletteConfig = inject(COMMAND_PALETTE_CONFIG);
	private readonly platformId: object = inject(PLATFORM_ID);

	private readonly listComponent: Signal<CmdListComponent | undefined> = viewChild(CmdListComponent);

	public readonly activeDescendantId: Signal<string | null> = computed(() => {
		const list: CmdListComponent | undefined = this.listComponent();
		const id: string | null = list?.activeCommandId() ?? null;
		return id ? `cmd-item-${id}` : null;
	});

	private keydownListener: ((e: KeyboardEvent) => void) | null = null;

	constructor() {
		if (isPlatformBrowser(this.platformId)) {
			this.keydownListener = (e: KeyboardEvent): void => this.onGlobalKeydown(e);
			document.addEventListener('keydown', this.keydownListener);
		}
	}

	public ngOnDestroy(): void {
		if (this.keydownListener) {
			document.removeEventListener('keydown', this.keydownListener);
		}
	}

	private onGlobalKeydown(event: KeyboardEvent): void {
		const shortcut: string = this.config.shortcut ?? 'meta.k';
		const parts: string[] = shortcut.split('.');
		const key: string = parts[parts.length - 1];
		const requiresMeta: boolean = parts.includes('meta');
		const requiresCtrl: boolean = parts.includes('ctrl');
		const requiresShift: boolean = parts.includes('shift');
		const requiresAlt: boolean = parts.includes('alt');

		if (
			event.key.toLowerCase() === key.toLowerCase() &&
			(!requiresMeta || event.metaKey) &&
			(!requiresCtrl || event.ctrlKey) &&
			(!requiresShift || event.shiftKey) &&
			(!requiresAlt || event.altKey)
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

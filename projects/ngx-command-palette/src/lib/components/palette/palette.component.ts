import { Component, ChangeDetectionStrategy, inject, effect, PLATFORM_ID, HostListener, viewChild, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Overlay, OverlayRef, OverlayModule } from '@angular/cdk/overlay';
import { ComponentPortal, PortalModule } from '@angular/cdk/portal';
import { A11yModule } from '@angular/cdk/a11y';
import { CommandPaletteService } from '../../services/command-palette.service';
import { COMMAND_PALETTE_CONFIG } from '../../provide';
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
	template: `
		@if (palette.isOpen()) {
			<div class="cmd-backdrop" (click)="palette.close()"></div>
			<div class="cmd-dialog" role="dialog" aria-label="Command palette" cdkTrapFocus>
				<cmd-input (keydown)="onKeydown($event)" />
				<div class="cmd-divider"></div>
				<cmd-list />
				<cmd-footer />
			</div>
		}
	`,
	styles: [`
		:host {
			position: fixed;
			z-index: 9999;
			top: 0;
			left: 0;
		}
		.cmd-backdrop {
			position: fixed;
			inset: 0;
			background: var(--cmd-backdrop, rgba(0, 0, 0, 0.5));
			z-index: 9999;
		}
		.cmd-dialog {
			position: fixed;
			top: 20%;
			left: 50%;
			transform: translateX(-50%);
			z-index: 10000;
			width: var(--cmd-width, 640px);
			max-width: calc(100vw - 32px);
			background: var(--cmd-bg, #ffffff);
			border: 1px solid var(--cmd-border, #e2e8f0);
			border-radius: var(--cmd-border-radius, 12px);
			box-shadow: var(--cmd-shadow, 0 16px 70px rgba(0, 0, 0, 0.2));
			overflow: hidden;
		}
		.cmd-divider {
			height: 1px;
			background: var(--cmd-border, #e2e8f0);
		}
	`],
})
export class CmdPaletteComponent implements OnDestroy {
	public readonly palette: CommandPaletteService = inject(CommandPaletteService);
	private readonly config = inject(COMMAND_PALETTE_CONFIG);
	private readonly platformId: object = inject(PLATFORM_ID);

	private readonly listComponent = viewChild(CmdListComponent);

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

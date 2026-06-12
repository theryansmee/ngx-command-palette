import { Component, ChangeDetectionStrategy, inject, input, output, ElementRef, Signal, viewChild, effect, InputSignal, OutputEmitterRef } from '@angular/core';
import { CommandPaletteService } from '../../services/command-palette.service';
import { CommandPaletteConfig } from '../../models/command';
import { COMMAND_PALETTE_CONFIG } from '../../provide';

@Component({
	selector: 'cmd-input',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './input.component.html',
	styleUrl: './input.component.scss',
})
export class CmdInputComponent {
	public readonly inputKeydown: OutputEmitterRef<KeyboardEvent> = output<KeyboardEvent>();

	public readonly activeDescendantId: InputSignal<string | null> = input<string | null>(null);

	public readonly palette: CommandPaletteService = inject(CommandPaletteService);

	public readonly config: CommandPaletteConfig = inject(COMMAND_PALETTE_CONFIG);

	public readonly inputEl: Signal<ElementRef<HTMLInputElement>> = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');

	constructor() {
		this.#focusInputOnOpen();
	}

	public onInput(event: Event): void {
		const value: string = (event.target as HTMLInputElement).value;
		this.palette.updateQuery(value);
	}

	#focusInputOnOpen(): void {
		let wasOpen: boolean = false;

		effect(() => {
			const isOpen: boolean = this.palette.isOpen();

			if (isOpen && !wasOpen) {
				requestAnimationFrame(() => this.inputEl().nativeElement.focus());
			}

			wasOpen = isOpen;
		});
	}
}

import { Component, ChangeDetectionStrategy, inject, input, output, ElementRef, viewChild, effect } from '@angular/core';
import { CommandPaletteService } from '../../services/command-palette.service';
import { COMMAND_PALETTE_CONFIG } from '../../provide';

@Component({
	selector: 'cmd-input',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<input
			#inputEl
			type="text"
			role="combobox"
			aria-expanded="true"
			aria-controls="cmd-listbox"
			aria-autocomplete="list"
			[attr.aria-activedescendant]="activeDescendantId()"
			[placeholder]="config.placeholder"
			[value]="palette.query()"
			(input)="onInput($event)"
			(keydown)="keydown.emit($event)"
		/>
	`,
	styles: [`
		:host {
			display: block;
		}
		input {
			width: 100%;
			height: var(--cmd-input-height, 56px);
			padding: 0 16px;
			border: none;
			outline: none;
			font-size: var(--cmd-input-font-size, 16px);
			color: var(--cmd-input-color, #1a1a1a);
			background: transparent;
			box-sizing: border-box;
		}
		input::placeholder {
			color: var(--cmd-input-placeholder, #94a3b8);
		}
	`],
})
export class CmdInputComponent {
	public readonly keydown = output<KeyboardEvent>();
	public readonly activeDescendantId = input<string | null>(null);
	public readonly palette: CommandPaletteService = inject(CommandPaletteService);
	public readonly config = inject(COMMAND_PALETTE_CONFIG);

	private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');

	constructor() {
		effect(() => {
			if (this.palette.isOpen()) {
				setTimeout(() => this.inputEl().nativeElement.focus(), 0);
			}
		});
	}

	public onInput(event: Event): void {
		const value: string = (event.target as HTMLInputElement).value;
		this.palette.updateQuery(value);
	}

	public focus(): void {
		this.inputEl().nativeElement.focus();
	}
}

import { Component, ChangeDetectionStrategy, inject, input, output, ElementRef, Signal, viewChild, effect, InputSignal, OutputEmitterRef } from '@angular/core';
import { CommandPaletteService } from '../../services/command-palette.service';

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

	public readonly inputEl: Signal<ElementRef<HTMLInputElement>> = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');

	#debounceTimer: ReturnType<typeof setTimeout> | null = null;

	readonly #debounceMs: number = this.palette.debounceMs;

	constructor() {
		this.#focusInputOnOpen();
		this.#syncDisplayQuery();
	}

	public onInput(event: Event): void {
		const nativeInput: HTMLInputElement = event.target as HTMLInputElement;
		let inputValue: string = nativeInput.value;
		const activePrefix: string | undefined = this.palette.activeProvider()?.prefix;

		if (activePrefix && inputValue.startsWith(activePrefix)) {
			inputValue = inputValue.slice(activePrefix.length);
		}

		const value: string = activePrefix ? activePrefix + inputValue : inputValue;

		if (this.#debounceMs <= 0) {
			this.palette.updateQuery(value);
			this.#syncNativeInput(nativeInput);
			return;
		}

		if (this.#debounceTimer !== null) {
			clearTimeout(this.#debounceTimer);
		}

		this.#debounceTimer = setTimeout(() => {
			this.palette.updateQuery(value);
			this.#syncNativeInput(nativeInput);
			this.#debounceTimer = null;
		}, this.#debounceMs);
	}

	#syncNativeInput(nativeInput: HTMLInputElement): void {
		const displayQuery: string = this.palette.displayQuery();

		if (nativeInput.value !== displayQuery) {
			nativeInput.value = displayQuery;
		}
	}

	public onKeydown(event: KeyboardEvent): void {
		if (
			event.key === 'Backspace'
			&& this.inputEl().nativeElement.value === ''
			&& this.palette.activeProvider()
		) {
			event.preventDefault();
			this.palette.updateQuery('');
		}

		this.inputKeydown.emit(event);
	}

	#syncDisplayQuery(): void {
		effect(() => {
			const displayQuery: string = this.palette.displayQuery();
			const nativeInput: HTMLInputElement = this.inputEl().nativeElement;

			if (nativeInput.value !== displayQuery) {
				nativeInput.value = displayQuery;
			}
		});
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

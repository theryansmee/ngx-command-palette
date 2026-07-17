import { Component, ChangeDetectionStrategy, inject, input, output, ElementRef, Signal, viewChild, effect, computed, InputSignal, OutputEmitterRef } from '@angular/core';
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

	// Deep stacks collapse to first and last chip so they never crowd out the input.
	public readonly displayBreadcrumbs: Signal<string[]> = computed(() => {
		const breadcrumbs: string[] = this.palette.breadcrumbs();

		if (breadcrumbs.length <= 3) {
			return breadcrumbs;
		}

		return [
			breadcrumbs[0],
			'…',
			breadcrumbs.at(-1)!,
		];
	});

	constructor() {
		this.#focusInputOnOpen();
		this.#syncDisplayQuery();
	}

	public onInput(event: Event): void {
		const nativeInput: HTMLInputElement = event.target as HTMLInputElement;
		const inputValue: string = nativeInput.value;

		if (this.#debounceMs <= 0) {
			this.palette.updateDisplayQuery(inputValue);
			this.#syncNativeInput(nativeInput);
			return;
		}

		if (this.#debounceTimer !== null) {
			clearTimeout(this.#debounceTimer);
		}

		this.#debounceTimer = setTimeout(() => {
			this.palette.updateDisplayQuery(inputValue);
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
			&& this.palette.breadcrumbs().length > 0
		) {
			event.preventDefault();
			this.palette.goBack();
		}

		this.inputKeydown.emit(event);
	}

	#syncDisplayQuery(): void {
		effect(() => {
			// Reading the page cancels pending debounce timers on push and pop, so a
			// stale callback cannot inject the previous page's query into the new one.
			this.palette.currentPage();
			const displayQuery: string = this.palette.displayQuery();
			const nativeInput: HTMLInputElement = this.inputEl().nativeElement;

			if (this.#debounceTimer !== null) {
				clearTimeout(this.#debounceTimer);
				this.#debounceTimer = null;
			}

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

import { Component, ChangeDetectionStrategy, input, output, InputSignal, OutputEmitterRef, ElementRef, inject, effect, computed, Signal, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Command, CmdItemTemplateContext } from '../../models/command';

@Component({
	selector: 'cmd-item',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgTemplateOutlet],
	host: {
		'role': 'option',
		'[id]': '"cmd-item-" + command().id',
		'[attr.aria-selected]': 'isActive()',
		'[class.active]': 'isActive()',
		'(click)': 'selected.emit(command())',
	},
	templateUrl: './item.component.html',
	styleUrl: './item.component.scss',
})
export class CmdItemComponent {
	readonly #elementRef: ElementRef<HTMLElement> = inject(ElementRef);

	public readonly command: InputSignal<Command> = input.required<Command>();
	public readonly isActive: InputSignal<boolean> = input<boolean>(false);
	public readonly customTemplate: InputSignal<TemplateRef<CmdItemTemplateContext> | null> = input<TemplateRef<CmdItemTemplateContext> | null>(null);
	public readonly selected: OutputEmitterRef<Command> = output<Command>();

	public readonly templateContext: Signal<CmdItemTemplateContext> = computed(() => ({
		$implicit: this.command(),
		active: this.isActive(),
	}));

	constructor() {
		this.#scrollActiveItemIntoView();
	}

	#scrollActiveItemIntoView(): void {
		effect(() => {
			if (this.isActive()) {
				this.#elementRef.nativeElement.scrollIntoView({ block: 'nearest' });
			}
		});
	}
}

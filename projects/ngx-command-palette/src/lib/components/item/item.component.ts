import { Component, ChangeDetectionStrategy, input, output, InputSignal, OutputEmitterRef } from '@angular/core';
import { Command } from '../../models/command';

@Component({
	selector: 'cmd-item',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
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
	public readonly command: InputSignal<Command> = input.required<Command>();
	public readonly isActive: InputSignal<boolean> = input<boolean>(false);
	public readonly selected: OutputEmitterRef<Command> = output<Command>();
}

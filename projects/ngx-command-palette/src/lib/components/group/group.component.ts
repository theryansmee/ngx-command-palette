import { Component, ChangeDetectionStrategy, input, InputSignal } from '@angular/core';

@Component({
	selector: 'cmd-group',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'role': 'group',
		'[attr.aria-labelledby]': '"cmd-group-" + heading()',
	},
	templateUrl: './group.component.html',
	styleUrl: './group.component.scss',
})
export class CmdGroupComponent {
	public readonly heading: InputSignal<string> = input.required<string>();
}

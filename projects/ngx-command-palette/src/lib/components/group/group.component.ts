import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
	selector: 'cmd-group',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'role': 'group',
		'[attr.aria-labelledby]': '"cmd-group-" + heading()',
	},
	template: `
		<div class="cmd-group-heading" [id]="'cmd-group-' + heading()" role="presentation">
			{{ heading() }}
		</div>
		<ng-content />
	`,
	styles: [`
		:host {
			display: block;
		}
		.cmd-group-heading {
			padding: 8px 16px 4px;
			font-size: var(--cmd-group-heading-size, 12px);
			font-weight: 500;
			color: var(--cmd-group-heading-color, #64748b);
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}
	`],
})
export class CmdGroupComponent {
	public readonly heading = input.required<string>();
}

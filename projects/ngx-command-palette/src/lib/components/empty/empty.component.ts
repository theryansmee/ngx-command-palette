import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'cmd-empty',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="cmd-empty">No results found.</div>
	`,
	styles: [`
		.cmd-empty {
			padding: 24px 16px;
			text-align: center;
			color: var(--cmd-empty-color, #94a3b8);
			font-size: 14px;
		}
	`],
})
export class CmdEmptyComponent {}

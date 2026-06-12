import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'cmd-footer',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="cmd-footer">
			<span class="cmd-footer-hint"><kbd>↑↓</kbd> Navigate</span>
			<span class="cmd-footer-hint"><kbd>↵</kbd> Select</span>
			<span class="cmd-footer-hint"><kbd>Esc</kbd> Close</span>
		</div>
	`,
	styles: [`
		.cmd-footer {
			display: flex;
			gap: 16px;
			padding: 8px 16px;
			border-top: 1px solid var(--cmd-border, #e2e8f0);
			font-size: 12px;
			color: var(--cmd-group-heading-color, #64748b);
		}
		.cmd-footer-hint {
			display: flex;
			align-items: center;
			gap: 4px;
		}
		kbd {
			padding: 2px 4px;
			font-size: 11px;
			font-family: inherit;
			background: var(--cmd-shortcut-bg, #f1f5f9);
			border: 1px solid var(--cmd-shortcut-border, #e2e8f0);
			border-radius: 3px;
		}
	`],
})
export class CmdFooterComponent {}

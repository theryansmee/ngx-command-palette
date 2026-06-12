import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
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
	template: `
		@if (command().icon) {
			<span class="cmd-item-icon">{{ command().icon }}</span>
		}
		<span class="cmd-item-label">{{ command().label }}</span>
		@if (command().shortcut) {
			<span class="cmd-item-shortcut">{{ command().shortcut }}</span>
		}
	`,
	styles: [`
		:host {
			display: flex;
			align-items: center;
			gap: 8px;
			height: var(--cmd-item-height, 44px);
			padding: 0 16px;
			color: var(--cmd-item-color, #334155);
			cursor: pointer;
			user-select: none;
		}
		:host(:hover) {
			background: var(--cmd-item-hover-bg, #f1f5f9);
		}
		:host(.active) {
			background: var(--cmd-item-active-bg, #e2e8f0);
		}
		.cmd-item-icon {
			flex-shrink: 0;
			width: 20px;
			text-align: center;
			opacity: 0.7;
		}
		.cmd-item-label {
			flex: 1;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.cmd-item-shortcut {
			flex-shrink: 0;
			padding: 2px 6px;
			font-size: 12px;
			background: var(--cmd-shortcut-bg, #f1f5f9);
			color: var(--cmd-shortcut-color, #64748b);
			border: 1px solid var(--cmd-shortcut-border, #e2e8f0);
			border-radius: 4px;
		}
	`],
})
export class CmdItemComponent {
	public readonly command = input.required<Command>();
	public readonly isActive = input<boolean>(false);
	public readonly selected = output<Command>();
}

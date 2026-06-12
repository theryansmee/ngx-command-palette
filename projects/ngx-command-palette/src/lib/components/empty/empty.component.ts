import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'cmd-empty',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './empty.component.html',
	styleUrl: './empty.component.scss',
})
export class CmdEmptyComponent {}

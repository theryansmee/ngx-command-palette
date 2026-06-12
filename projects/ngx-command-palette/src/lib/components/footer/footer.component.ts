import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'cmd-footer',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './footer.component.html',
	styleUrl: './footer.component.scss',
})
export class CmdFooterComponent {}

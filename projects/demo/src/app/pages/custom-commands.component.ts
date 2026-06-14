import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'app-custom-commands',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './custom-commands.component.html',
	styleUrl: './custom-commands.component.scss',
})
export class CustomCommandsComponent {}

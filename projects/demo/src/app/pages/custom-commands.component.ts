import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
	selector: 'app-custom-commands',
	standalone: true,
	imports: [RouterLink],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './custom-commands.component.html',
	styleUrl: './custom-commands.component.scss',
})
export class CustomCommandsComponent {}

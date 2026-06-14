import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'app-theming',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './theming.component.html',
	styleUrl: './theming.component.scss',
})
export class ThemingComponent {}

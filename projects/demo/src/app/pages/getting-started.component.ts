import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'app-getting-started',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './getting-started.component.html',
	styleUrl: './getting-started.component.scss',
})
export class GettingStartedComponent {}

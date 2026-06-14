import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'app-async-providers',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './async-providers.component.html',
	styleUrl: './async-providers.component.scss',
})
export class AsyncProvidersComponent {}

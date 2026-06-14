import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'app-configuration',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './configuration.component.html',
	styleUrl: './configuration.component.scss',
})
export class ConfigurationComponent {}

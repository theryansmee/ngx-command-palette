import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'app-custom-templates',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './custom-templates.component.html',
	styleUrl: './custom-templates.component.scss',
})
export class CustomTemplatesComponent {}

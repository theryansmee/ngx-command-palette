import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
	selector: 'app-nested-pages',
	standalone: true,
	imports: [RouterLink],
	templateUrl: './nested-pages.component.html',
	styleUrl: './nested-pages.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NestedPagesComponent {}

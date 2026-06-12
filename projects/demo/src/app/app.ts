import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CmdPaletteComponent } from 'ngx-command-palette';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [
		RouterOutlet,
		CmdPaletteComponent,
	],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss',
})
export class AppComponent {}

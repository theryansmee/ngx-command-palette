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
	template: `
		<cmd-palette />
		<nav>
			<h1>ngx-command-palette demo</h1>
			<p>Press <kbd>Cmd+K</kbd> (or <kbd>Ctrl+K</kbd>) to open the command palette.</p>
		</nav>
		<main>
			<router-outlet />
		</main>
	`,
	styles: [`
		:host {
			display: block;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			padding: 24px;
		}
		nav {
			margin-bottom: 24px;
		}
		h1 {
			font-size: 24px;
			margin: 0 0 8px;
		}
		p {
			margin: 0;
			color: #64748b;
		}
		kbd {
			padding: 2px 6px;
			font-size: 13px;
			background: #f1f5f9;
			border: 1px solid #e2e8f0;
			border-radius: 4px;
		}
	`],
})
export class AppComponent {}

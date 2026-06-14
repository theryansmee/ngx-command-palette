import { Component, DestroyRef, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CmdPaletteComponent, CommandPaletteService } from 'ngx-command-palette';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [
		RouterOutlet,
		RouterLink,
		RouterLinkActive,
		CmdPaletteComponent,
	],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss',
})
export class AppComponent {
	readonly #palette: CommandPaletteService = inject(CommandPaletteService);

	readonly #destroyRef: DestroyRef = inject(DestroyRef);

	constructor() {
		this.#palette.register([
			{
				id: 'toggle-dark-mode',
				label: 'Toggle Dark Mode',
				category: 'Actions',
				keywords: [
					'theme',
					'light',
					'dark',
					'appearance',
				],
				action: (): void => {
					document.documentElement.classList.toggle('dark');
				},
			},
			{
				id: 'copy-install',
				label: 'Copy Install Command',
				category: 'Actions',
				keywords: [
					'npm',
					'yarn',
					'pnpm',
					'install',
					'clipboard',
				],
				action: (): void => {
					navigator.clipboard.writeText('ng add @theryansmee/ngx-command-palette');
				},
			},
			{
				id: 'open-github',
				label: 'Open GitHub Repository',
				category: 'Actions',
				keywords: [
					'source',
					'code',
					'repo',
					'github',
				],
				action: (): void => {
					window.open('https://github.com/theryansmee/ngx-command-palette', '_blank');
				},
			},
		], this.#destroyRef);
	}
}

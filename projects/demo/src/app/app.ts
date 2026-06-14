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
					const root: HTMLElement = document.documentElement;
					const isDark: boolean = root.classList.contains('dark')
						|| (!root.classList.contains('light')
						&& window.matchMedia('(prefers-color-scheme: dark)').matches);

					root.classList.toggle('dark', !isDark);
					root.classList.toggle('light', isDark);
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

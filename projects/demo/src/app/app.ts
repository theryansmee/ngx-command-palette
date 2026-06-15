import { Component, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
	CmdPaletteComponent,
	CommandPaletteService,
	CommandPaletteTheme,
	CommandPaletteAnimation,
} from 'ngx-command-palette';

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
	public static readonly themeLabels: Record<CommandPaletteTheme, string> = {
		default: 'Default (Light)',
		dark: 'Dark',
		github: 'GitHub',
		linear: 'Linear',
	};

	public static readonly animationLabels: Record<CommandPaletteAnimation, string> = {
		scale: 'Scale',
		slide: 'Slide',
		none: 'None',
	};

	readonly #palette: CommandPaletteService = inject(CommandPaletteService);

	readonly #destroyRef: DestroyRef = inject(DestroyRef);

	public menuOpen: boolean = false;

	public readonly activeTheme: WritableSignal<CommandPaletteTheme> = signal<CommandPaletteTheme>('default');

	public readonly activeAnimation: WritableSignal<CommandPaletteAnimation> = signal<CommandPaletteAnimation>('scale');

	public closeMenu(): void {
		this.menuOpen = false;
	}

	constructor() {
		this.#palette.register([
			...(Object.keys(AppComponent.themeLabels) as CommandPaletteTheme[]).map((theme: CommandPaletteTheme) => ({
				id: `theme-${theme}`,
				label: `Theme: ${AppComponent.themeLabels[theme]}`,
				category: 'Palette Appearance',
				keywords: [
					'theme',
					'colour',
					'color',
					'style',
					theme,
				],
				action: (): void => this.activeTheme.set(theme),
			})),
			...(Object.keys(AppComponent.animationLabels) as CommandPaletteAnimation[]).map((animation: CommandPaletteAnimation) => ({
				id: `animation-${animation}`,
				label: `Animation: ${AppComponent.animationLabels[animation]}`,
				category: 'Palette Appearance',
				keywords: [
					'animation',
					'transition',
					'motion',
					animation,
				],
				action: (): void => this.activeAnimation.set(animation),
			})),
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

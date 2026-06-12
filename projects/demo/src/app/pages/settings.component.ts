import { Component, DestroyRef, inject } from '@angular/core';
import { CommandPaletteService } from 'ngx-command-palette';

@Component({
	selector: 'app-settings',
	standalone: true,
	template: `
		<h2>Settings</h2>
		<p>Application settings page.</p>
		<p class="hint">Try the palette here - "Reset Settings to Defaults" only appears on settings pages.</p>
	`,
	styles: `.hint { color: #64748b; font-size: 14px; margin-top: 12px; }`,
})
export class SettingsComponent {
	readonly #palette: CommandPaletteService = inject(CommandPaletteService);

	readonly #destroyRef: DestroyRef = inject(DestroyRef);

	constructor() {
		this.#palette.register([
			{
				id: 'reset-settings',
				label: 'Reset Settings to Defaults',
				category: 'Settings',
				keywords: [
					'restore',
					'factory',
					'clear',
				],
				context: { routes: ['/settings/**'] },
				action: () => alert('Settings have been reset to defaults.'),
			},
		], this.#destroyRef);
	}
}

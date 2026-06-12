import { Component, DestroyRef, inject } from '@angular/core';
import { CommandPaletteService } from 'ngx-command-palette';

@Component({
	selector: 'app-dashboard',
	standalone: true,
	template: `
		<h2>Dashboard</h2>
		<p>Welcome to the dashboard.</p>
		<p class="hint">Try the palette here - "Export Dashboard Data" and "Refresh Widgets" only appear on this page.</p>
	`,
	styles: `.hint { color: #64748b; font-size: 14px; margin-top: 12px; }`,
})
export class DashboardComponent {
	readonly #palette: CommandPaletteService = inject(CommandPaletteService);

	readonly #destroyRef: DestroyRef = inject(DestroyRef);

	constructor() {
		this.#palette.register([
			{
				id: 'export-dashboard',
				label: 'Export Dashboard Data',
				category: 'Dashboard',
				keywords: [
					'csv',
					'download',
					'report',
				],
				context: { routes: ['/dashboard'] },
				action: () => alert('Exporting dashboard data...'),
			},
			{
				id: 'refresh-widgets',
				label: 'Refresh Widgets',
				category: 'Dashboard',
				keywords: [
					'reload',
					'update',
				],
				context: { routes: ['/dashboard'] },
				action: () => alert('Refreshing dashboard widgets...'),
			},
		], this.#destroyRef);
	}
}

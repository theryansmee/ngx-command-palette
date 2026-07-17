import { Component, ChangeDetectionStrategy, inject, Signal, computed } from '@angular/core';
import { SearchProvider } from '../../models/command';
import { ProviderRegistry } from '../../services/provider-registry';
import { CommandPaletteService } from '../../services/command-palette.service';

interface PrefixHint {
	prefix: string;
	category: string;
}

@Component({
	selector: 'cmd-footer',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './footer.component.html',
	styleUrl: './footer.component.scss',
})
export class CmdFooterComponent {
	readonly #providerRegistry: ProviderRegistry = inject(ProviderRegistry);

	public readonly palette: CommandPaletteService = inject(CommandPaletteService);

	public readonly prefixHints: Signal<PrefixHint[]> = computed(() => {
		// Typing a sigil inside a page is literal text, so the hints would mislead.
		if (this.palette.breadcrumbs().length > 0) {
			return [];
		}

		return this.#providerRegistry.providers()
			.filter((provider: SearchProvider) => !!provider.prefix)
			.map((provider: SearchProvider) => ({
				prefix: provider.prefix!,
				category: provider.category.toLowerCase(),
			}));
	});
}

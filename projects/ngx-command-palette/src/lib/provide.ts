import { InjectionToken, Provider, EnvironmentProviders, makeEnvironmentProviders, APP_INITIALIZER, inject } from '@angular/core';
import { CommandPaletteConfig } from './models/command';
import { RouterCommandExtractor } from './services/router-extractor';

const defaultConfig: CommandPaletteConfig = {
	shortcut: 'mod.k',
	placeholder: 'Search or type a command...',
	autoRegisterRoutes: true,
	maxResults: 10,
	trackRecent: false,
	recentCount: 5,
	animation: 'scale',
};

export const COMMAND_PALETTE_CONFIG: InjectionToken<CommandPaletteConfig> = new InjectionToken<CommandPaletteConfig>('COMMAND_PALETTE_CONFIG');

function initRouterExtractor(): () => void {
	const extractor: RouterCommandExtractor = inject(RouterCommandExtractor);
	return (): void => extractor.init();
}

export function provideCommandPalette(config: Partial<CommandPaletteConfig> = {}): EnvironmentProviders {
	const mergedConfig: CommandPaletteConfig = { ...defaultConfig, ...config };

	const providers: Provider[] = [
		{
			provide: COMMAND_PALETTE_CONFIG,
			useValue: mergedConfig,
		},
	];

	if (mergedConfig.autoRegisterRoutes) {
		providers.push({
			provide: APP_INITIALIZER,
			useFactory: initRouterExtractor,
			multi: true,
		});
	}

	return makeEnvironmentProviders(providers);
}

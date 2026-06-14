import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		redirectTo: 'home',
		pathMatch: 'full',
	},
	{
		path: 'home',
		title: 'Home',
		loadComponent: () => import('./pages/home.component').then(
			(m: typeof import('./pages/home.component')) => m.HomeComponent,
		),
	},
	{
		path: 'getting-started',
		title: 'Getting Started',
		loadComponent: () => import('./pages/getting-started.component').then(
			(m: typeof import('./pages/getting-started.component')) => m.GettingStartedComponent,
		),
	},
	{
		path: 'configuration',
		title: 'Configuration',
		loadComponent: () => import('./pages/configuration.component').then(
			(m: typeof import('./pages/configuration.component')) => m.ConfigurationComponent,
		),
	},
	{
		path: 'custom-commands',
		title: 'Custom Commands',
		loadComponent: () => import('./pages/custom-commands.component').then(
			(m: typeof import('./pages/custom-commands.component')) => m.CustomCommandsComponent,
		),
	},
	{
		path: 'async-providers',
		title: 'Async Providers',
		loadComponent: () => import('./pages/async-providers.component').then(
			(m: typeof import('./pages/async-providers.component')) => m.AsyncProvidersComponent,
		),
	},
	{
		path: 'theming',
		title: 'Theming',
		loadComponent: () => import('./pages/theming.component').then(
			(m: typeof import('./pages/theming.component')) => m.ThemingComponent,
		),
	},
];

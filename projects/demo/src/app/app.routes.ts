import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		redirectTo: 'dashboard',
		pathMatch: 'full',
	},
	{
		path: 'dashboard',
		title: 'Dashboard',
		loadComponent: () => import('./pages/dashboard.component').then((m: typeof import('./pages/dashboard.component')) => m.DashboardComponent),
	},
	{
		path: 'settings',
		title: 'Settings',
		loadComponent: () => import('./pages/settings.component').then((m: typeof import('./pages/settings.component')) => m.SettingsComponent),
	},
	{
		path: 'settings/billing',
		title: 'Billing',
		loadComponent: () => import('./pages/billing.component').then((m: typeof import('./pages/billing.component')) => m.BillingComponent),
		data: {
			commandPalette: {
				label: 'Billing & Payments',
				keywords: [
					'invoice',
					'payment',
					'subscription',
				],
				category: 'Settings',
			},
		},
	},
	{
		path: 'profile',
		title: 'Profile',
		loadComponent: () => import('./pages/profile.component').then((m: typeof import('./pages/profile.component')) => m.ProfileComponent),
	},
	{
		path: 'users/:id',
		title: 'User Detail',
		loadComponent: () => import('./pages/user-detail.component').then((m: typeof import('./pages/user-detail.component')) => m.UserDetailComponent),
		data: {
			commandPalette: false,
		},
	},
];

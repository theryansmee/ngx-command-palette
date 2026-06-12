import { Component, DestroyRef, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { delay, Observable, of } from 'rxjs';
import { CmdPaletteComponent, Command, CommandPaletteService } from 'ngx-command-palette';

const FAKE_USERS: Command[] = [
	{ id: 'user-alice', label: 'Alice Johnson', category: 'Users', action: () => alert('Navigating to Alice Johnson') },
	{ id: 'user-bob', label: 'Bob Smith', category: 'Users', action: () => alert('Navigating to Bob Smith') },
	{ id: 'user-carol', label: 'Carol Williams', category: 'Users', action: () => alert('Navigating to Carol Williams') },
	{ id: 'user-dave', label: 'Dave Brown', category: 'Users', action: () => alert('Navigating to Dave Brown') },
	{ id: 'user-eve', label: 'Eve Davis', category: 'Users', action: () => alert('Navigating to Eve Davis') },
];

const FAKE_HELP_ARTICLES: Command[] = [
	{ id: 'help-getting-started', label: 'Getting Started Guide', category: 'Help', action: () => alert('Opening: Getting Started Guide') },
	{ id: 'help-keyboard-shortcuts', label: 'Keyboard Shortcuts Reference', category: 'Help', action: () => alert('Opening: Keyboard Shortcuts') },
	{ id: 'help-billing-faq', label: 'Billing FAQ', category: 'Help', action: () => alert('Opening: Billing FAQ') },
	{ id: 'help-api-docs', label: 'API Documentation', category: 'Help', action: () => alert('Opening: API Documentation') },
	{ id: 'help-troubleshooting', label: 'Troubleshooting Common Issues', category: 'Help', action: () => alert('Opening: Troubleshooting') },
];

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [
		RouterOutlet,
		RouterLink,
		CmdPaletteComponent,
	],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss',
})
export class AppComponent {
	readonly #palette: CommandPaletteService = inject(CommandPaletteService);

	readonly #destroyRef: DestroyRef = inject(DestroyRef);

	constructor() {
		this.#registerGlobalCommands();
		this.#registerAsyncProviders();
	}

	#registerGlobalCommands(): void {
		this.#palette.register([
			{
				id: 'show-notification',
				label: 'Show Notification',
				category: 'Actions',
				keywords: [
					'alert',
					'message',
					'toast',
				],
				priority: 2,
				action: () => alert('This is a custom action triggered from the command palette!'),
			},
			{
				id: 'copy-url',
				label: 'Copy Current URL',
				category: 'Actions',
				keywords: [
					'clipboard',
					'link',
					'share',
				],
				action: () => navigator.clipboard.writeText(window.location.href),
			},
		], this.#destroyRef);
	}

	#registerAsyncProviders(): void {
		this.#palette.registerProvider({
			id: 'user-search',
			category: 'Users',
			prefix: '@',
			debounce: 300,
			minQueryLength: 1,
			search: (query: string): Observable<Command[]> => {
				const lowerQuery: string = query.toLowerCase();
				const matched: Command[] = FAKE_USERS.filter(
					(user: Command) => user.label.toLowerCase().includes(lowerQuery),
				);
				return of(matched).pipe(delay(400));
			},
		}, this.#destroyRef);

		this.#palette.registerProvider({
			id: 'help-search',
			category: 'Help',
			prefix: '#',
			debounce: 200,
			minQueryLength: 2,
			search: (query: string): Observable<Command[]> => {
				const lowerQuery: string = query.toLowerCase();
				const matched: Command[] = FAKE_HELP_ARTICLES.filter(
					(article: Command) => article.label.toLowerCase().includes(lowerQuery),
				);
				return of(matched).pipe(delay(300));
			},
		}, this.#destroyRef);
	}
}

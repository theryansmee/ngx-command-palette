import { Component, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import {
	CmdPaletteComponent,
	Command,
	CommandPaletteService,
	CommandPaletteTheme,
	CommandPaletteAnimation,
} from 'ngx-command-palette';

interface DemoProject {
	id: string;
	name: string;
	columns: string[];
}

const demoPeople: string[] = [
	'Ada Lovelace',
	'Grace Hopper',
	'Alan Turing',
	'Margaret Hamilton',
	'Katherine Johnson',
];

const demoProjects: DemoProject[] = [
	{
		id: 'website',
		name: 'Website Redesign',
		columns: [
			'Backlog',
			'In Progress',
			'Review',
			'Done',
		],
	},
	{
		id: 'mobile',
		name: 'Mobile App',
		columns: [
			'Todo',
			'Doing',
			'Done',
		],
	},
];

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
		this.#registerPeopleProvider();

		this.#palette.register([
			{
				id: 'change-theme',
				label: 'Change theme…',
				category: 'Palette Appearance',
				keywords: [
					'theme',
					'colour',
					'color',
					'style',
				],
				pagePlaceholder: 'Pick a theme…',
				children: (Object.keys(AppComponent.themeLabels) as CommandPaletteTheme[]).map((theme: CommandPaletteTheme) => ({
					id: `theme-${theme}`,
					label: AppComponent.themeLabels[theme],
					action: (): void => this.activeTheme.set(theme),
				})),
			},
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
				id: 'assign-demo-issue',
				label: 'Assign demo issue to…',
				category: 'Actions',
				keywords: [
					'assign',
					'people',
					'user',
				],
				children: { provider: 'people' },
			},
			{
				id: 'move-demo-task',
				label: 'Move demo task to…',
				category: 'Actions',
				keywords: [
					'move',
					'project',
					'column',
				],
				pagePlaceholder: 'Which project?',
				children: (): Observable<Command[]> => this.#loadProjectPages(),
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

	// One provider serves both entry paths: typing "@" and selecting "Assign demo issue to…".
	#registerPeopleProvider(): void {
		this.#palette.registerProvider({
			id: 'people',
			category: 'People',
			prefix: '@',
			placeholder: 'Search people…',
			emptyMessage: 'Nobody matches that name.',
			debounce: 200,
			search: (query: string): Observable<Command[]> => of(demoPeople).pipe(
				delay(300),
				map((people: string[]) => people
					.filter((person: string) => person.toLowerCase().includes(query.toLowerCase()))
					.map((person: string) => ({
						id: `person-${person.toLowerCase().replace(/\s+/g, '-')}`,
						label: person,
						action: (): void => window.alert(`Assigned demo issue to ${person}`),
					}))),
			),
		}, this.#destroyRef);
	}

	#loadProjectPages(): Observable<Command[]> {
		return of(demoProjects).pipe(
			delay(500),
			map((projects: DemoProject[]) => projects.map((project: DemoProject) => ({
				id: `move-${project.id}`,
				label: project.name,
				pagePlaceholder: `Which column in ${project.name}?`,
				children: (): Observable<Command[]> => this.#loadColumnPages(project),
			}))),
		);
	}

	#loadColumnPages(project: DemoProject): Observable<Command[]> {
		return of(project.columns).pipe(
			delay(500),
			map((columns: string[]) => columns.map((column: string) => ({
				id: `move-${project.id}-${column.toLowerCase().replace(/\s+/g, '-')}`,
				label: column,
				action: (): void => window.alert(`Moved demo task to ${project.name} / ${column}`),
			}))),
		);
	}
}

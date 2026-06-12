import { Observable } from 'rxjs';

export interface Command {
	id: string;
	label: string;
	category?: string;
	icon?: string;
	keywords?: string[];
	shortcut?: string;
	action: () => void | Promise<void>;
	priority?: number;
	context?: CommandContext;
	children?: Command[] | (() => Observable<Command[]>);
}

export interface CommandContext {
	routes?: string[];
	when?: () => boolean;
}

export interface SearchProvider {
	id: string;
	category: string;
	search: (query: string) => Observable<Command[]>;
	prefix?: string;
	debounce?: number;
	minQueryLength?: number;
	order?: number;
}

export interface CommandPaletteConfig {
	shortcut?: string;
	placeholder?: string;
	autoRegisterRoutes?: boolean;
	maxResults?: number;
	recentCount?: number;
	debounce?: number;
	animation?: 'scale' | 'slide' | 'none';
}

export interface ScoredCommand {
	command: Command;
	score: number;
}

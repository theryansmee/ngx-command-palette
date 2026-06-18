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
	data?: Record<string, unknown>;
}

export interface CmdItemTemplateContext {
	$implicit: Command;
	active: boolean;
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

export type CommandPaletteTheme = 'default' | 'dark' | 'github' | 'linear';

export type CommandPaletteAnimation = 'scale' | 'slide' | 'none';

export interface CommandPaletteConfig {
	shortcut?: string;
	placeholder?: string;
	autoRegisterRoutes?: boolean;
	maxResults?: number;
	trackRecent?: boolean;
	recentCount?: number;
	debounce?: number;
	animation?: CommandPaletteAnimation;
	theme?: CommandPaletteTheme;
}

export interface ScoredCommand {
	command: Command;
	score: number;
}

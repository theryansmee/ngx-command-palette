import { CommandPageSource } from './command-page-source.type';

export interface CommandPage {
	id: string;
	title: string;
	source: CommandPageSource;
	placeholder?: string;
	emptyMessage?: string;
	maxResults?: number;
}

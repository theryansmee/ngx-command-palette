import { Command } from '../models/command';
import { CommandPage } from '../models/command-page.interface';

export interface PageStackEntry {
	entryKey: number;
	page: CommandPage;
	loadedCommands: Command[] | null;
	loading: boolean;
	loadFailed: boolean;
}

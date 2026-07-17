import { Observable } from 'rxjs';
import { Command } from './command';

export type CommandPageSource =
	| {
		kind: 'static';
		commands: Command[];
	}
	| {
		kind: 'loader';
		load: () => Observable<Command[]>;
	}
	| {
		kind: 'provider';
		providerId: string;
	};

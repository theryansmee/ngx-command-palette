import { Observable } from 'rxjs';
import { Command } from './command';

export type CommandChildren =
	| Command[]
	| (() => Observable<Command[]>)
	| { provider: string };

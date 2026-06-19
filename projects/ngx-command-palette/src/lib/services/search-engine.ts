import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Command, CommandContext, ScoredCommand, CommandPaletteConfig } from '../models/command';
import { CommandRegistry } from './command-registry';
import { RecentCommandsStore } from './recent-store';
import { COMMAND_PALETTE_CONFIG } from '../provide';
import { fuzzyMatch, FuzzyMatchResult } from '../utils/fuzzy-match';

@Injectable({ providedIn: 'root' })
export class SearchEngine {
	readonly #registry: CommandRegistry = inject(CommandRegistry);

	readonly #recentStore: RecentCommandsStore = inject(RecentCommandsStore);

	readonly #config: CommandPaletteConfig = inject(COMMAND_PALETTE_CONFIG);

	readonly #router: Router = inject(Router);

	public search(query: string): ScoredCommand[] {
		const commands: Command[] = this.#getVisibleCommands();

		if (!query.trim()) {
			return this.#getDefaultResults(commands);
		}

		const scored: ScoredCommand[] = [];

		for (const command of commands) {
			const score: number = this.#scoreCommand(command, query);

			if (score > 0) {
				scored.push({
					command,
					score,
				});
			}
		}

		scored.sort((first: ScoredCommand, second: ScoredCommand) => second.score - first.score);
		return scored.slice(0, this.#config.maxResults);
	}

	#getVisibleCommands(): Command[] {
		const allCommands: Command[] = this.#registry.commands();
		const currentUrl: string = this.#router.url;

		return allCommands.filter((command: Command) => this.#isCommandVisible(command, currentUrl));
	}

	#isCommandVisible(command: Command, currentUrl: string): boolean {
		const context: CommandContext | undefined = command.context;

		if (!context) {
			return true;
		}

		if (context.routes && context.routes.length > 0) {
			const matchesRoute: boolean = context.routes.some(
				(pattern: string) => this.#matchRoutePattern(currentUrl, pattern),
			);

			if (!matchesRoute) {
				return false;
			}
		}

		if (context.when && !context.when()) {
			return false;
		}

		return true;
	}

	#matchRoutePattern(url: string, pattern: string): boolean {
		const normalizedUrl: string = url.split('?')[0].split('#')[0];

		if (pattern === '*' || pattern === '**') {
			return true;
		}

		const regexPattern: string = pattern
			.replace(/\*\*/g, '<<<GLOBSTAR>>>')
			.replace(/\*/g, '[^/]*')
			.replace(/<<<GLOBSTAR>>>/g, '.*');

		const regex: RegExp = new RegExp(`^${regexPattern}$`);
		return regex.test(normalizedUrl);
	}

	#scoreCommand(command: Command, query: string): number {
		const labelResult: FuzzyMatchResult = fuzzyMatch(query, command.label);
		let bestScore: number = labelResult.match ? labelResult.score : 0;

		if (command.keywords) {
			for (const keyword of command.keywords) {
				const keywordResult: FuzzyMatchResult = fuzzyMatch(query, keyword);

				if (keywordResult.match && keywordResult.score > 0) {
					bestScore = Math.max(bestScore, Math.min(keywordResult.score, 30));
				}
			}
		}

		if (bestScore === 0) {
			return 0;
		}

		const recencyBoost: number = this.#recentStore.getBoost(command.id);
		const priorityBoost: number = (command.priority ?? 0) * 10;

		return bestScore + recencyBoost + priorityBoost;
	}

	#getDefaultResults(commands: Command[]): ScoredCommand[] {
		const scored: ScoredCommand[] = [];

		for (const command of commands) {
			const recencyBoost: number = this.#recentStore.getBoost(command.id);
			const priorityBoost: number = (command.priority ?? 0) * 10;
			scored.push({
				command,
				score: recencyBoost + priorityBoost,
			});
		}

		scored.sort((first: ScoredCommand, second: ScoredCommand) => second.score - first.score);
		return scored.slice(0, this.#config.maxResults);
	}
}

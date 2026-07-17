import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Command, CommandContext, ScoredCommand, CommandPaletteConfig } from '../models/command';
import { SearchEngineOptions } from './search-engine-options.interface';
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

	public search(query: string, options?: SearchEngineOptions): ScoredCommand[] {
		const sourceCommands: Command[] = options?.commands ?? this.#registry.commands();
		const commands: Command[] = this.#filterVisible(sourceCommands);
		const maxResults: number | null = this.#resolveMaxResults(options);

		if (!query.trim()) {
			if (options?.rankDefaults === false) {
				return this.#getAuthoredOrderResults(commands, maxResults);
			}

			return this.#getDefaultResults(commands, maxResults);
		}

		const scored: ScoredCommand[] = [];
		const recencyBoosts: Map<string, number> = this.#recencyBoostsFor(commands);

		for (const command of commands) {
			const score: number = this.#scoreCommand(command, query, recencyBoosts.get(command.id) ?? 0);

			if (score > 0) {
				scored.push({
					command,
					score,
				});
			}
		}

		scored.sort((first: ScoredCommand, second: ScoredCommand) => second.score - first.score);
		return this.#applyLimit(scored, maxResults);
	}

	#filterVisible(commands: Command[]): Command[] {
		const currentUrl: string = this.#router.url;

		return commands.filter((command: Command) => this.#isCommandVisible(command, currentUrl));
	}

	#resolveMaxResults(options?: SearchEngineOptions): number | null {
		if (options?.maxResults !== undefined) {
			return options.maxResults;
		}

		return this.#config.maxResults ?? null;
	}

	#applyLimit(scored: ScoredCommand[], maxResults: number | null): ScoredCommand[] {
		if (maxResults === null) {
			return scored;
		}

		return scored.slice(0, maxResults);
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

		// Escape regex metacharacters so only * and ** act as wildcards.
		const escapedPattern: string = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

		const regexPattern: string = escapedPattern
			.replace(/\*\*/g, '<<<GLOBSTAR>>>')
			.replace(/\*/g, '[^/]*')
			.replace(/<<<GLOBSTAR>>>/g, '.*');

		const regex: RegExp = new RegExp(`^${regexPattern}$`);
		return regex.test(normalizedUrl);
	}

	#recencyBoostsFor(commands: Command[]): Map<string, number> {
		return this.#recentStore.getBoostsFor(commands.map((command: Command) => command.id));
	}

	#scoreCommand(command: Command, query: string, recencyBoost: number): number {
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

		const priorityBoost: number = (command.priority ?? 0) * 10;

		return bestScore + recencyBoost + priorityBoost;
	}

	#getDefaultResults(commands: Command[], maxResults: number | null): ScoredCommand[] {
		const scored: ScoredCommand[] = [];
		const recencyBoosts: Map<string, number> = this.#recencyBoostsFor(commands);

		for (const command of commands) {
			const recencyBoost: number = recencyBoosts.get(command.id) ?? 0;
			const priorityBoost: number = (command.priority ?? 0) * 10;
			scored.push({
				command,
				score: recencyBoost + priorityBoost,
			});
		}

		scored.sort((first: ScoredCommand, second: ScoredCommand) => second.score - first.score);
		return this.#applyLimit(scored, maxResults);
	}

	#getAuthoredOrderResults(commands: Command[], maxResults: number | null): ScoredCommand[] {
		const scored: ScoredCommand[] = commands.map((command: Command) => ({
			command,
			score: 0,
		}));

		return this.#applyLimit(scored, maxResults);
	}
}

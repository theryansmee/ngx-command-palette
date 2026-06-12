import { Injectable, inject } from '@angular/core';
import { Command, ScoredCommand } from '../models/command';
import { CommandRegistry } from './command-registry';
import { RecentCommandsStore } from './recent-store';
import { COMMAND_PALETTE_CONFIG } from '../provide';
import { fuzzyMatch } from '../utils/fuzzy-match';

@Injectable({ providedIn: 'root' })
export class SearchEngine {
	private readonly registry = inject(CommandRegistry);
	private readonly recentStore = inject(RecentCommandsStore);
	private readonly config = inject(COMMAND_PALETTE_CONFIG);

	public search(query: string): ScoredCommand[] {
		const commands: Command[] = this.registry.commands();

		if (!query.trim()) {
			return this.getDefaultResults(commands);
		}

		const scored: ScoredCommand[] = [];

		for (const command of commands) {
			const score: number = this.scoreCommand(command, query);

			if (score > 0) {
				scored.push({ command, score });
			}
		}

		scored.sort((a: ScoredCommand, b: ScoredCommand) => b.score - a.score);
		return scored.slice(0, this.config.maxResults);
	}

	private scoreCommand(command: Command, query: string): number {
		const labelResult = fuzzyMatch(query, command.label);
		let bestScore: number = labelResult.match ? labelResult.score : 0;

		if (command.keywords) {
			for (const keyword of command.keywords) {
				const keywordResult = fuzzyMatch(query, keyword);

				if (keywordResult.match && keywordResult.score > 0) {
					bestScore = Math.max(bestScore, Math.min(keywordResult.score, 30));
				}
			}
		}

		if (bestScore === 0) {
			return 0;
		}

		const recencyBoost: number = this.recentStore.getBoost(command.id);
		const priorityBoost: number = (command.priority ?? 0) * 10;

		return bestScore + recencyBoost + priorityBoost;
	}

	private getDefaultResults(commands: Command[]): ScoredCommand[] {
		const recentIds: string[] = this.recentStore.ids();
		const scored: ScoredCommand[] = [];

		for (const command of commands) {
			const recencyBoost: number = this.recentStore.getBoost(command.id);
			const priorityBoost: number = (command.priority ?? 0) * 10;
			scored.push({ command, score: recencyBoost + priorityBoost });
		}

		scored.sort((a: ScoredCommand, b: ScoredCommand) => b.score - a.score);
		return scored.slice(0, this.config.maxResults);
	}
}

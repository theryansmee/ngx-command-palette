import { Command } from '../models/command';

export interface SearchEngineOptions {
	// Explicit command source instead of the registry.
	commands?: Command[];
	// null means unlimited; leaving it undefined falls back to config.maxResults.
	maxResults?: number | null;
	// false keeps authored order at an empty query instead of recency and priority ranking.
	rankDefaults?: boolean;
}

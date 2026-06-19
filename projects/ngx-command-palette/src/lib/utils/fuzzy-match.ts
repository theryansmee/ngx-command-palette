export interface FuzzyMatchResult {
	match: boolean;
	score: number;
}

export function fuzzyMatch(query: string, target: string): FuzzyMatchResult {
	const normalizedQuery: string = query.toLowerCase();
	const normalizedTarget: string = target.toLowerCase();

	// Exact match gets highest score
	if (normalizedTarget === normalizedQuery) {
		return {
			match: true,
			score: 100,
		};
	}

	// Substring match, score by position: start (80) > word boundary (60) > middle (40)
	if (normalizedTarget.includes(normalizedQuery)) {
		let bestScore: number = 0;
		let searchFrom: number = 0;

		// Find all occurrences, keep the best-positioned one
		while (true) {
			const index: number = normalizedTarget.indexOf(normalizedQuery, searchFrom);

			if (index === -1) {
				break;
			}

			let positionScore: number = 40;

			if (index === 0) {
				positionScore = 80;
			} else if (normalizedTarget[index - 1] === ' ' || normalizedTarget[index - 1] === '/') {
				positionScore = 60;
			}

			if (positionScore > bestScore) {
				bestScore = positionScore;
			}

			// 80 is the max, no need to keep searching
			if (bestScore === 80) {
				break;
			}

			searchFrom = index + 1;
		}

		return {
			match: true,
			score: bestScore,
		};
	}

	// Fuzzy match: walk both strings, reward consecutive matches and word boundary hits
	let queryIndex: number = 0;
	let score: number = 0;
	let consecutive: number = 0;

	for (let targetIndex: number = 0; targetIndex < normalizedTarget.length && queryIndex < normalizedQuery.length; targetIndex++) {
		if (normalizedTarget[targetIndex] === normalizedQuery[queryIndex]) {
			queryIndex++;
			consecutive++;
			// longer streaks score exponentially higher
			score += consecutive * 2;

			// bonus for matching at word boundaries
			if (targetIndex === 0 || normalizedTarget[targetIndex - 1] === ' ' || normalizedTarget[targetIndex - 1] === '/') {
				score += 5;
			}
		} else {
			consecutive = 0;
		}
	}

	// All query chars matched, cap score below substring matches
	if (queryIndex === normalizedQuery.length) {
		return {
			match: true,
			score: Math.min(score, 35),
		};
	}

	return {
		match: false,
		score: 0,
	};
}

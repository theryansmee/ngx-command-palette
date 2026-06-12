export interface FuzzyMatchResult {
	match: boolean;
	score: number;
}

export function fuzzyMatch(query: string, target: string): FuzzyMatchResult {
	const normalizedQuery: string = query.toLowerCase();
	const normalizedTarget: string = target.toLowerCase();

	if (normalizedTarget === normalizedQuery) {
		return { match: true, score: 100 };
	}

	if (normalizedTarget.includes(normalizedQuery)) {
		const index: number = normalizedTarget.indexOf(normalizedQuery);

		if (index === 0) {
			return { match: true, score: 80 };
		}

		if (normalizedTarget[index - 1] === ' ') {
			return { match: true, score: 60 };
		}

		return { match: true, score: 40 };
	}

	let queryIndex: number = 0;
	let score: number = 0;
	let consecutive: number = 0;

	for (let targetIndex: number = 0; targetIndex < normalizedTarget.length && queryIndex < normalizedQuery.length; targetIndex++) {
		if (normalizedTarget[targetIndex] === normalizedQuery[queryIndex]) {
			queryIndex++;
			consecutive++;
			score += consecutive * 2;

			if (targetIndex === 0 || normalizedTarget[targetIndex - 1] === ' ' || normalizedTarget[targetIndex - 1] === '/') {
				score += 5;
			}
		} else {
			consecutive = 0;
		}
	}

	if (queryIndex === normalizedQuery.length) {
		return { match: true, score: Math.min(score, 35) };
	}

	return { match: false, score: 0 };
}

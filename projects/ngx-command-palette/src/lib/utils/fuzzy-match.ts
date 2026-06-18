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
		let bestScore: number = 0;
		let searchFrom: number = 0;

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

			if (bestScore === 80) {
				break;
			}

			searchFrom = index + 1;
		}

		return { match: true, score: bestScore };
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

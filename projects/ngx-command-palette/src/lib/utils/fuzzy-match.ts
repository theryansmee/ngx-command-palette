export interface FuzzyMatchResult {
	match: boolean;
	score: number;
}

export function fuzzyMatch(query: string, target: string): FuzzyMatchResult {
	const q: string = query.toLowerCase();
	const t: string = target.toLowerCase();

	if (t === q) {
		return { match: true, score: 100 };
	}

	if (t.includes(q)) {
		const index: number = t.indexOf(q);

		if (index === 0) {
			return { match: true, score: 80 };
		}

		if (t[index - 1] === ' ') {
			return { match: true, score: 60 };
		}

		return { match: true, score: 40 };
	}

	let qi: number = 0;
	let score: number = 0;
	let consecutive: number = 0;

	for (let ti: number = 0; ti < t.length && qi < q.length; ti++) {
		if (t[ti] === q[qi]) {
			qi++;
			consecutive++;
			score += consecutive * 2;

			if (ti === 0 || t[ti - 1] === ' ' || t[ti - 1] === '/') {
				score += 5;
			}
		} else {
			consecutive = 0;
		}
	}

	if (qi === q.length) {
		return { match: true, score: Math.min(score, 35) };
	}

	return { match: false, score: 0 };
}

import { describe, it, expect } from 'vitest';
import { fuzzyMatch, FuzzyMatchResult } from './fuzzy-match';

describe('fuzzyMatch', () => {
	it('should return exact match with score 100', () => {
		const result: FuzzyMatchResult = fuzzyMatch('dashboard', 'Dashboard');
		expect(result.match).toBe(true);
		expect(result.score).toBe(100);
	});

	it('should return starts-with match with score 80', () => {
		const result: FuzzyMatchResult = fuzzyMatch('dash', 'Dashboard');
		expect(result.match).toBe(true);
		expect(result.score).toBe(80);
	});

	it('should return word boundary match with score 60', () => {
		const result: FuzzyMatchResult = fuzzyMatch('billing', 'Settings Billing');
		expect(result.match).toBe(true);
		expect(result.score).toBe(60);
	});

	it('should return substring match with score 40', () => {
		const result: FuzzyMatchResult = fuzzyMatch('etti', 'Settings');
		expect(result.match).toBe(true);
		expect(result.score).toBe(40);
	});

	it('should return fuzzy character match capped at 35', () => {
		const result: FuzzyMatchResult = fuzzyMatch('dbd', 'Dashboard Board');
		expect(result.match).toBe(true);
		expect(result.score).toBeLessThanOrEqual(35);
	});

	it('should return no match for unrelated strings', () => {
		const result: FuzzyMatchResult = fuzzyMatch('xyz', 'Dashboard');
		expect(result.match).toBe(false);
		expect(result.score).toBe(0);
	});

	it('should return no match when query is longer than target', () => {
		const result: FuzzyMatchResult = fuzzyMatch('dashboard settings', 'Dash');
		expect(result.match).toBe(false);
		expect(result.score).toBe(0);
	});

	it('should be case insensitive', () => {
		const result: FuzzyMatchResult = fuzzyMatch('DASH', 'dashboard');
		expect(result.match).toBe(true);
		expect(result.score).toBe(80);
	});

	it('should match empty query against any target', () => {
		const result: FuzzyMatchResult = fuzzyMatch('', 'Dashboard');
		expect(result.match).toBe(true);
		expect(result.score).toBe(80);
	});

	it('should give word boundary bonus in fuzzy mode', () => {
		const withBoundary: FuzzyMatchResult = fuzzyMatch('sb', 'Settings Billing');
		const withoutBoundary: FuzzyMatchResult = fuzzyMatch('sb', 'xsxbx');
		expect(withBoundary.score).toBeGreaterThan(withoutBoundary.score);
	});
});

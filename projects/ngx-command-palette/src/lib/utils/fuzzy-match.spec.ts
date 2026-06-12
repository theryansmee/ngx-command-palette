import { describe, it, expect } from 'vitest';
import { fuzzyMatch } from './fuzzy-match';

describe('fuzzyMatch', () => {
	it('should return exact match with score 100', () => {
		const result = fuzzyMatch('dashboard', 'Dashboard');
		expect(result.match).toBe(true);
		expect(result.score).toBe(100);
	});

	it('should return starts-with match with score 80', () => {
		const result = fuzzyMatch('dash', 'Dashboard');
		expect(result.match).toBe(true);
		expect(result.score).toBe(80);
	});

	it('should return word boundary match with score 60', () => {
		const result = fuzzyMatch('billing', 'Settings Billing');
		expect(result.match).toBe(true);
		expect(result.score).toBe(60);
	});

	it('should return substring match with score 40', () => {
		const result = fuzzyMatch('etti', 'Settings');
		expect(result.match).toBe(true);
		expect(result.score).toBe(40);
	});

	it('should return fuzzy character match capped at 35', () => {
		const result = fuzzyMatch('dbd', 'Dashboard Board');
		expect(result.match).toBe(true);
		expect(result.score).toBeLessThanOrEqual(35);
	});

	it('should return no match for unrelated strings', () => {
		const result = fuzzyMatch('xyz', 'Dashboard');
		expect(result.match).toBe(false);
		expect(result.score).toBe(0);
	});

	it('should be case insensitive', () => {
		const result = fuzzyMatch('DASH', 'dashboard');
		expect(result.match).toBe(true);
		expect(result.score).toBe(80);
	});

	it('should handle empty query', () => {
		const result = fuzzyMatch('', 'Dashboard');
		expect(result.match).toBe(true);
	});

	it('should give word boundary bonus in fuzzy mode', () => {
		const withBoundary = fuzzyMatch('sb', 'Settings Billing');
		const withoutBoundary = fuzzyMatch('sb', 'xsxbx');
		expect(withBoundary.score).toBeGreaterThan(withoutBoundary.score);
	});
});

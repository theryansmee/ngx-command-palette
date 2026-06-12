import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { SearchEngine } from './search-engine';
import { CommandRegistry } from './command-registry';
import { RecentCommandsStore } from './recent-store';
import { COMMAND_PALETTE_CONFIG } from '../provide';
import { Command, CommandPaletteConfig, ScoredCommand } from '../models/command';

function makeCommand(overrides: Partial<Command> = {}): Command {
	return {
		id: overrides.id ?? 'test',
		label: overrides.label ?? 'Test',
		action: (): void => {},
		...overrides,
	};
}

describe('SearchEngine', () => {
	let engine: SearchEngine;
	let registry: CommandRegistry;
	let recentStore: RecentCommandsStore;
	let router: Router;

	const config: CommandPaletteConfig = {
		maxResults: 5,
		recentCount: 5,
	};

	beforeEach(() => {
		localStorage.clear();

		TestBed.configureTestingModule({
			providers: [
				{ provide: PLATFORM_ID, useValue: 'browser' },
				{ provide: COMMAND_PALETTE_CONFIG, useValue: config },
				provideRouter([]),
			],
		});

		engine = TestBed.inject(SearchEngine);
		registry = TestBed.inject(CommandRegistry);
		recentStore = TestBed.inject(RecentCommandsStore);
		router = TestBed.inject(Router);
	});

	it('should return all commands for an empty query', () => {
		registry.register([
			makeCommand({ id: 'a', label: 'Alpha' }),
			makeCommand({ id: 'b', label: 'Beta' }),
		]);

		const results: ScoredCommand[] = engine.search('');
		expect(results.length).toBe(2);
	});

	it('should rank an exact match higher than a partial match', () => {
		registry.register([
			makeCommand({ id: 'settings', label: 'Settings' }),
			makeCommand({ id: 'settings-billing', label: 'Settings Billing' }),
		]);

		const results: ScoredCommand[] = engine.search('settings');
		expect(results[0].command.id).toBe('settings');
		expect(results[0].score).toBeGreaterThan(results[1].score);
	});

	it('should respect the maxResults limit', () => {
		const commands: Command[] = Array.from({ length: 20 }, (_: unknown, index: number) =>
			makeCommand({ id: `cmd-${index}`, label: `Command ${index}` }),
		);
		registry.register(commands);

		const results: ScoredCommand[] = engine.search('command');
		expect(results.length).toBe(config.maxResults);
	});

	it('should return no results when query matches nothing', () => {
		registry.register([makeCommand({ id: 'a', label: 'Dashboard' })]);

		const results: ScoredCommand[] = engine.search('zzzzzzz');
		expect(results.length).toBe(0);
	});

	it('should cap keyword match scores below label match scores', () => {
		registry.register([
			makeCommand({ id: 'by-label', label: 'Billing' }),
			makeCommand({ id: 'by-keyword', label: 'Payments', keywords: ['billing'] }),
		]);

		const results: ScoredCommand[] = engine.search('billing');
		const labelMatch: ScoredCommand | undefined = results.find(
			(result: ScoredCommand) => result.command.id === 'by-label',
		);
		const keywordMatch: ScoredCommand | undefined = results.find(
			(result: ScoredCommand) => result.command.id === 'by-keyword',
		);

		expect(labelMatch).toBeDefined();
		expect(keywordMatch).toBeDefined();
		expect(labelMatch!.score).toBeGreaterThan(keywordMatch!.score);
	});

	it('should boost commands with higher priority', () => {
		registry.register([
			makeCommand({ id: 'low', label: 'Settings Menu', priority: 0 }),
			makeCommand({ id: 'high', label: 'Settings Panel', priority: 5 }),
		]);

		const results: ScoredCommand[] = engine.search('settings');
		const highPriority: ScoredCommand | undefined = results.find(
			(result: ScoredCommand) => result.command.id === 'high',
		);
		const lowPriority: ScoredCommand | undefined = results.find(
			(result: ScoredCommand) => result.command.id === 'low',
		);

		expect(highPriority).toBeDefined();
		expect(lowPriority).toBeDefined();
		expect(highPriority!.score).toBeGreaterThan(lowPriority!.score);
	});

	it('should boost recently used commands in search results', () => {
		registry.register([
			makeCommand({ id: 'dashboard', label: 'Dashboard' }),
			makeCommand({ id: 'downloads', label: 'Downloads' }),
		]);

		recentStore.record('downloads');

		const results: ScoredCommand[] = engine.search('d');
		const dashboard: ScoredCommand | undefined = results.find(
			(result: ScoredCommand) => result.command.id === 'dashboard',
		);
		const downloads: ScoredCommand | undefined = results.find(
			(result: ScoredCommand) => result.command.id === 'downloads',
		);

		expect(dashboard).toBeDefined();
		expect(downloads).toBeDefined();
		expect(downloads!.score).toBeGreaterThan(dashboard!.score);
	});

	it('should match case-insensitively', () => {
		registry.register([makeCommand({ id: 'dashboard', label: 'Dashboard' })]);

		const results: ScoredCommand[] = engine.search('DASHBOARD');
		expect(results.length).toBe(1);
		expect(results[0].command.id).toBe('dashboard');
	});

	it('should treat a whitespace-only query as empty', () => {
		registry.register([
			makeCommand({ id: 'dashboard', label: 'Dashboard' }),
			makeCommand({ id: 'settings', label: 'Settings' }),
		]);

		const results: ScoredCommand[] = engine.search('   ');
		expect(results.length).toBe(2);
	});

	it('should sort default results by priority when query is empty', () => {
		registry.register([
			makeCommand({ id: 'low', label: 'Low', priority: 1 }),
			makeCommand({ id: 'high', label: 'High', priority: 10 }),
			makeCommand({ id: 'mid', label: 'Mid', priority: 5 }),
		]);

		const results: ScoredCommand[] = engine.search('');

		expect(results[0].command.id).toBe('high');
		expect(results[1].command.id).toBe('mid');
		expect(results[2].command.id).toBe('low');
	});

	it('should respect maxResults for empty query', () => {
		const commands: Command[] = Array.from({ length: 20 }, (_: unknown, index: number) =>
			makeCommand({ id: `cmd-${index}`, label: `Command ${index}` }),
		);
		registry.register(commands);

		const results: ScoredCommand[] = engine.search('');
		expect(results.length).toBe(config.maxResults);
	});

	it('should show commands without a context on any route', () => {
		registry.register([makeCommand({ id: 'global', label: 'Global Action' })]);

		const results: ScoredCommand[] = engine.search('global');
		expect(results.length).toBe(1);
	});

	it('should hide commands whose context.routes do not match the current URL', () => {
		Object.defineProperty(router, 'url', { get: () => '/settings' });

		registry.register([
			makeCommand({
				id: 'admin-only',
				label: 'Admin Action',
				context: { routes: ['/admin/*'] },
			}),
			makeCommand({ id: 'global', label: 'Global Action' }),
		]);

		const results: ScoredCommand[] = engine.search('action');
		const ids: string[] = results.map((result: ScoredCommand) => result.command.id);
		expect(ids).toContain('global');
		expect(ids).not.toContain('admin-only');
	});

	it('should show commands whose context.routes match the current URL', () => {
		Object.defineProperty(router, 'url', { get: () => '/admin/users' });

		registry.register([
			makeCommand({
				id: 'admin-only',
				label: 'Admin Action',
				context: { routes: ['/admin/*'] },
			}),
		]);

		const results: ScoredCommand[] = engine.search('admin');
		expect(results.length).toBe(1);
		expect(results[0].command.id).toBe('admin-only');
	});

	it('should match double-star glob patterns across multiple segments', () => {
		Object.defineProperty(router, 'url', { get: () => '/admin/users/edit/42' });

		registry.register([
			makeCommand({
				id: 'deep-admin',
				label: 'Deep Admin Action',
				context: { routes: ['/admin/**'] },
			}),
			makeCommand({
				id: 'shallow-admin',
				label: 'Shallow Admin Action',
				context: { routes: ['/admin/*'] },
			}),
		]);

		const results: ScoredCommand[] = engine.search('admin');
		const ids: string[] = results.map((result: ScoredCommand) => result.command.id);
		expect(ids).toContain('deep-admin');
		expect(ids).not.toContain('shallow-admin');
	});

	it('should hide commands when context.when() returns false', () => {
		registry.register([
			makeCommand({
				id: 'conditional',
				label: 'Conditional Action',
				context: { when: () => false },
			}),
			makeCommand({ id: 'always', label: 'Always Visible' }),
		]);

		const results: ScoredCommand[] = engine.search('');
		const ids: string[] = results.map((result: ScoredCommand) => result.command.id);
		expect(ids).toContain('always');
		expect(ids).not.toContain('conditional');
	});

	it('should show commands when context.when() returns true', () => {
		registry.register([
			makeCommand({
				id: 'conditional',
				label: 'Conditional Action',
				context: { when: () => true },
			}),
		]);

		const results: ScoredCommand[] = engine.search('conditional');
		expect(results.length).toBe(1);
	});

	it('should require both context.routes and context.when to pass', () => {
		Object.defineProperty(router, 'url', { get: () => '/admin/dashboard' });

		registry.register([
			makeCommand({
				id: 'both-pass',
				label: 'Both Pass',
				context: { routes: ['/admin/*'], when: () => true },
			}),
			makeCommand({
				id: 'route-pass-when-fail',
				label: 'Route Pass When Fail',
				context: { routes: ['/admin/*'], when: () => false },
			}),
			makeCommand({
				id: 'route-fail-when-pass',
				label: 'Route Fail When Pass',
				context: { routes: ['/settings/*'], when: () => true },
			}),
		]);

		const results: ScoredCommand[] = engine.search('');
		const ids: string[] = results.map((result: ScoredCommand) => result.command.id);
		expect(ids).toContain('both-pass');
		expect(ids).not.toContain('route-pass-when-fail');
		expect(ids).not.toContain('route-fail-when-pass');
	});
});

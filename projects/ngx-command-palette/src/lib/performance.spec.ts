import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { SearchEngine } from './services/search-engine';
import { CommandRegistry } from './services/command-registry';
import { COMMAND_PALETTE_CONFIG } from './provide';
import { Command, CommandPaletteConfig, ScoredCommand } from './models/command';

const categories: string[] = [
	'Navigation',
	'Settings',
	'User Management',
	'Reporting',
	'Analytics',
	'Development',
	'Administration',
	'Communication',
	'File Management',
	'Integrations',
];

const labelPrefixes: string[] = [
	'Open',
	'Navigate to',
	'Toggle',
	'Configure',
	'Export',
	'Import',
	'Delete',
	'Create',
	'Edit',
	'View',
	'Search',
	'Filter',
	'Sort',
	'Refresh',
	'Download',
];

const labelSubjects: string[] = [
	'Dashboard',
	'User Profile',
	'Settings Panel',
	'Analytics Report',
	'Team Members',
	'Billing Information',
	'API Keys',
	'Notifications',
	'Activity Log',
	'Security Settings',
	'Data Export',
	'Integration Config',
	'Webhook Setup',
	'Role Permissions',
	'Audit Trail',
	'Performance Metrics',
	'Error Logs',
	'Deployment History',
	'Feature Flags',
	'Environment Variables',
];

const keywordPool: string[] = [
	'admin',
	'config',
	'monitor',
	'deploy',
	'build',
	'test',
	'debug',
	'profile',
	'account',
	'billing',
	'payment',
	'invoice',
	'report',
	'chart',
	'graph',
	'table',
	'list',
	'grid',
	'form',
	'modal',
	'dialog',
	'panel',
	'sidebar',
	'toolbar',
	'menu',
	'dropdown',
	'search',
	'filter',
	'sort',
	'export',
];

function makeCommand(overrides: Partial<Command> = {}): Command {
	return {
		id: overrides.id ?? 'test',
		label: overrides.label ?? 'Test',
		action: (): void => {},
		...overrides,
	};
}

function generateRealisticCommands(count: number): Command[] {
	const commands: Command[] = [];

	for (let index: number = 0; index < count; index++) {
		const prefixIndex: number = index % labelPrefixes.length;
		const subjectIndex: number = index % labelSubjects.length;
		const categoryIndex: number = index % categories.length;

		const label: string = `${labelPrefixes[prefixIndex]} ${labelSubjects[subjectIndex]} ${index}`;
		const category: string = categories[categoryIndex];

		const keywordStartIndex: number = index % keywordPool.length;
		const keywords: string[] = [
			keywordPool[keywordStartIndex],
			keywordPool[(keywordStartIndex + 7) % keywordPool.length],
			keywordPool[(keywordStartIndex + 13) % keywordPool.length],
		];

		const priority: number = index % 10;

		commands.push(
			makeCommand({
				id: `command-${index}`,
				label,
				category,
				keywords,
				priority,
			}),
		);
	}

	return commands;
}

describe('Performance', () => {
	let engine: SearchEngine;
	let registry: CommandRegistry;

	const config: CommandPaletteConfig = {
		maxResults: 10,
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
	});

	it('should register 500 commands in under 50ms', () => {
		const commands: Command[] = generateRealisticCommands(500);

		const startTime: number = performance.now();
		registry.register(commands);
		const endTime: number = performance.now();
		const duration: number = endTime - startTime;

		console.log(`Registering 500 commands took ${duration.toFixed(2)}ms`);
		expect(duration).toBeLessThan(50);
		expect(registry.commands().length).toBe(500);
	});

	it('should search 500 commands with a short query in under 20ms', () => {
		const commands: Command[] = generateRealisticCommands(500);
		registry.register(commands);

		const startTime: number = performance.now();
		const results: ScoredCommand[] = engine.search('dash');
		const endTime: number = performance.now();
		const duration: number = endTime - startTime;

		console.log(`Searching 500 commands with short query "dash" took ${duration.toFixed(2)}ms (found ${results.length} results)`);
		expect(duration).toBeLessThan(20);
		expect(results.length).toBeGreaterThan(0);
	});

	it('should search 500 commands with a long query in under 20ms', () => {
		const commands: Command[] = generateRealisticCommands(500);
		registry.register(commands);

		const startTime: number = performance.now();
		const results: ScoredCommand[] = engine.search('configure security settings panel');
		const endTime: number = performance.now();
		const duration: number = endTime - startTime;

		console.log(`Searching 500 commands with long query "configure security settings panel" took ${duration.toFixed(2)}ms (found ${results.length} results)`);
		expect(duration).toBeLessThan(20);
	});

	it('should return maxResults for an empty query with 500 commands and complete quickly', () => {
		const commands: Command[] = generateRealisticCommands(500);
		registry.register(commands);

		const startTime: number = performance.now();
		const results: ScoredCommand[] = engine.search('');
		const endTime: number = performance.now();
		const duration: number = endTime - startTime;

		console.log(`Empty query across 500 commands took ${duration.toFixed(2)}ms (returned ${results.length} results)`);
		expect(duration).toBeLessThan(20);
		expect(results.length).toBe(config.maxResults);
	});

	it('should handle fuzzy matching across 500 commands in under 20ms', () => {
		const commands: Command[] = generateRealisticCommands(500);
		registry.register(commands);

		const startTime: number = performance.now();
		const results: ScoredCommand[] = engine.search('opndshbrd');
		const endTime: number = performance.now();
		const duration: number = endTime - startTime;

		console.log(`Fuzzy search "opndshbrd" across 500 commands took ${duration.toFixed(2)}ms (found ${results.length} results)`);
		expect(duration).toBeLessThan(20);
	});

	it('should search 1000 commands in under 50ms', () => {
		const commands: Command[] = generateRealisticCommands(1000);
		registry.register(commands);

		const startTime: number = performance.now();
		const results: ScoredCommand[] = engine.search('settings');
		const endTime: number = performance.now();
		const duration: number = endTime - startTime;

		console.log(`Searching 1000 commands with query "settings" took ${duration.toFixed(2)}ms (found ${results.length} results)`);
		expect(duration).toBeLessThan(50);
		expect(results.length).toBeGreaterThan(0);
	});

	it('should rank an exact match first even among 500 commands', () => {
		const commands: Command[] = generateRealisticCommands(500);
		const needleCommand: Command = makeCommand({
			id: 'exact-needle',
			label: 'Xylophone Controls',
			category: 'Finances',
			keywords: ['instrument'],
			priority: 0,
		});
		commands.push(needleCommand);
		registry.register(commands);

		const results: ScoredCommand[] = engine.search('Xylophone Controls');

		expect(results.length).toBeGreaterThan(0);
		expect(results[0].command.id).toBe('exact-needle');
		console.log(
			`Exact match "Xylophone Controls" ranked first with score ${results[0].score} among ${commands.length} commands`,
		);
	});
});

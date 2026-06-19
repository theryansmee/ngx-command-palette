import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, DestroyRef } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommandPaletteService } from './command-palette.service';
import { CommandRegistry } from './command-registry';
import { RecentCommandsStore } from './recent-store';
import { COMMAND_PALETTE_CONFIG } from '../provide';
import { Command, CommandPaletteConfig, ScoredCommand } from '../models/command';

function makeCommand(overrides: Partial<Command> = {}): Command {
	return {
		id: overrides.id ?? 'test',
		label: overrides.label ?? 'Test',
		action: overrides.action ?? ((): void => {}),
		...overrides,
	};
}

describe('CommandPaletteService', () => {
	let service: CommandPaletteService;
	let registry: CommandRegistry;
	let recentStore: RecentCommandsStore;

	const config: CommandPaletteConfig = {
		maxResults: 10,
		trackRecent: true,
		recentCount: 5,
	};

	beforeEach(() => {
		localStorage.clear();

		TestBed.configureTestingModule({
			providers: [
				{
					provide: PLATFORM_ID,
					useValue: 'browser', 
				},
				{
					provide: COMMAND_PALETTE_CONFIG,
					useValue: config, 
				},
			],
		});

		service = TestBed.inject(CommandPaletteService);
		registry = TestBed.inject(CommandRegistry);
		recentStore = TestBed.inject(RecentCommandsStore);
	});

	it('should start with palette closed and empty query', () => {
		expect(service.isOpen()).toBe(false);
		expect(service.query()).toBe('');
	});

	it('should open the palette', () => {
		service.open();

		expect(service.isOpen()).toBe(true);
	});

	it('should open with an initial query', () => {
		service.open('search term');

		expect(service.isOpen()).toBe(true);
		expect(service.query()).toBe('search term');
	});

	it('should close the palette and clear the query', () => {
		service.open('something');
		service.close();

		expect(service.isOpen()).toBe(false);
		expect(service.query()).toBe('');
	});

	it('should toggle between open and closed', () => {
		service.toggle();
		expect(service.isOpen()).toBe(true);

		service.toggle();
		expect(service.isOpen()).toBe(false);
	});

	it('should clear the query when toggling closed', () => {
		service.open('search term');
		service.toggle();

		expect(service.isOpen()).toBe(false);
		expect(service.query()).toBe('');
	});

	it('should update the query', () => {
		service.updateQuery('dashboard');

		expect(service.query()).toBe('dashboard');
	});

	it('should return search results based on current query', () => {
		service.register([
			makeCommand({
				id: 'dashboard',
				label: 'Dashboard', 
			}),
			makeCommand({
				id: 'settings',
				label: 'Settings', 
			}),
		]);

		service.updateQuery('dash');

		const results: ScoredCommand[] = service.results();
		expect(results.length).toBe(1);
		expect(results[0].command.id).toBe('dashboard');
	});

	it('should call the command action, record it as recent, and close on execute', () => {
		const actionSpy = vi.fn();
		const command: Command = makeCommand({
			id: 'test-cmd',
			action: actionSpy, 
		});

		service.open();
		service.execute(command);

		expect(actionSpy).toHaveBeenCalledOnce();
		expect(service.isOpen()).toBe(false);
		expect(recentStore.ids()).toContain('test-cmd');
	});

	it('should register commands into the registry', () => {
		service.register([
			makeCommand({ id: 'custom-1' }),
			makeCommand({ id: 'custom-2' }),
		]);

		const ids: string[] = registry.commands().map((command: Command) => command.id);
		expect(ids).toContain('custom-1');
		expect(ids).toContain('custom-2');
	});

	it('should deregister commands when DestroyRef fires', () => {
		const destroyCallbacks: (() => void)[] = [];
		const mockDestroyRef: DestroyRef = {
			onDestroy: (callback: () => void): void => {
				destroyCallbacks.push(callback);
			},
		} as DestroyRef;

		service.register(
			[
				makeCommand({ id: 'temp-1' }),
				makeCommand({ id: 'temp-2' }),
			],
			mockDestroyRef,
		);

		expect(registry.commands().length).toBe(2);

		destroyCallbacks.forEach((callback: () => void) => callback());

		expect(registry.commands().length).toBe(0);
	});
});

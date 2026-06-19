import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { CommandRegistry } from './command-registry';
import { Command } from '../models/command';

function makeCommand(overrides: Partial<Command> = {}): Command {
	return {
		id: overrides.id ?? 'test',
		label: overrides.label ?? 'Test',
		action: (): void => {},
		...overrides,
	};
}

describe('CommandRegistry', () => {
	let registry: CommandRegistry;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		registry = TestBed.inject(CommandRegistry);
	});

	it('should register commands and expose them via commands()', () => {
		registry.register([
			makeCommand({ id: 'dashboard' }),
			makeCommand({ id: 'settings' }),
		]);

		const ids: string[] = registry.commands().map((command: Command) => command.id);
		expect(ids).toEqual([
			'dashboard',
			'settings',
		]);
	});

	it('should overwrite a command when registering with the same id', () => {
		registry.register([
			makeCommand({
				id: 'dashboard',
				label: 'Original', 
			}),
		]);
		registry.register([
			makeCommand({
				id: 'dashboard',
				label: 'Updated', 
			}),
		]);

		expect(registry.commands().length).toBe(1);
		expect(registry.commands()[0].label).toBe('Updated');
	});

	it('should deregister specific commands by id', () => {
		registry.register([
			makeCommand({ id: 'dashboard' }),
			makeCommand({ id: 'settings' }),
			makeCommand({ id: 'profile' }),
		]);

		registry.deregister(['settings']);

		const ids: string[] = registry.commands().map((command: Command) => command.id);
		expect(ids).toEqual([
			'dashboard',
			'profile',
		]);
	});

	it('should not affect commands from other sources when deregistering', () => {
		registry.register([makeCommand({ id: 'manual-action' })], 'manual');
		registry.register([makeCommand({ id: 'route-dashboard' })], 'router');

		registry.deregister(['manual-action'], 'manual');

		expect(registry.commands().length).toBe(1);
		expect(registry.commands()[0].id).toBe('route-dashboard');
	});

	it('should replace all commands from a source when using registerBatch', () => {
		registry.register([
			makeCommand({ id: 'route-dashboard' }),
			makeCommand({ id: 'route-settings' }),
		], 'router');

		registry.registerBatch('router', [
			makeCommand({ id: 'route-profile' }),
			makeCommand({ id: 'route-billing' }),
		]);

		const ids: string[] = registry.commands().map((command: Command) => command.id);
		expect(ids).toEqual([
			'route-profile',
			'route-billing',
		]);
	});

	it('should preserve commands from other sources during registerBatch', () => {
		registry.register([makeCommand({ id: 'manual-action' })], 'manual');
		registry.register([makeCommand({ id: 'route-dashboard' })], 'router');

		registry.registerBatch('router', [makeCommand({ id: 'route-settings' })]);

		const ids: string[] = registry.commands().map((command: Command) => command.id);
		expect(ids).toContain('manual-action');
		expect(ids).toContain('route-settings');
		expect(ids).not.toContain('route-dashboard');
	});

	it('should return the correct command from getById', () => {
		registry.register([
			makeCommand({
				id: 'target',
				label: 'Target Label', 
			}),
		]);

		const result: Command | undefined = registry.getById('target');
		expect(result).toBeDefined();
		expect(result!.label).toBe('Target Label');
	});

	it('should return undefined from getById for unknown id', () => {
		expect(registry.getById('nonexistent')).toBeUndefined();
	});
});

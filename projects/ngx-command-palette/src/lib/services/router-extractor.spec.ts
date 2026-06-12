import { TestBed } from '@angular/core/testing';
import { provideRouter, Routes } from '@angular/router';
import { Component } from '@angular/core';
import { describe, it, expect } from 'vitest';
import { RouterCommandExtractor } from './router-extractor';
import { CommandRegistry } from './command-registry';
import { Command } from '../models/command';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('RouterCommandExtractor', () => {
	let extractor: RouterCommandExtractor;
	let registry: CommandRegistry;

	function setup(routes: Routes): void {
		TestBed.configureTestingModule({
			providers: [provideRouter(routes)],
		});

		extractor = TestBed.inject(RouterCommandExtractor);
		registry = TestBed.inject(CommandRegistry);
		extractor.init();
	}

	it('should extract commands from routes with titles', () => {
		setup([
			{ path: 'dashboard', component: DummyComponent, title: 'Dashboard' },
			{ path: 'settings', component: DummyComponent, title: 'Settings' },
		]);

		const commands: Command[] = registry.commands();
		expect(commands.length).toBe(2);

		const ids: string[] = commands.map((command: Command) => command.id);
		expect(ids).toContain('route:dashboard');
		expect(ids).toContain('route:settings');
	});

	it('should skip routes with redirectTo', () => {
		setup([
			{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
			{ path: 'dashboard', component: DummyComponent, title: 'Dashboard' },
		]);

		const commands: Command[] = registry.commands();
		expect(commands.length).toBe(1);
		expect(commands[0].id).toBe('route:dashboard');
	});

	it('should skip wildcard routes', () => {
		setup([
			{ path: 'home', component: DummyComponent, title: 'Home' },
			{ path: '**', component: DummyComponent, title: 'Not Found' },
		]);

		const commands: Command[] = registry.commands();
		expect(commands.length).toBe(1);
		expect(commands[0].id).toBe('route:home');
	});

	it('should skip parameterized routes without explicit commandPalette config', () => {
		setup([
			{ path: 'users/:id', component: DummyComponent, title: 'User Detail' },
			{ path: 'about', component: DummyComponent, title: 'About' },
		]);

		const commands: Command[] = registry.commands();
		expect(commands.length).toBe(1);
		expect(commands[0].id).toBe('route:about');
	});

	it('should skip routes with commandPalette set to false', () => {
		setup([
			{
				path: 'hidden',
				component: DummyComponent,
				title: 'Hidden',
				data: { commandPalette: false },
			},
			{ path: 'visible', component: DummyComponent, title: 'Visible' },
		]);

		const commands: Command[] = registry.commands();
		expect(commands.length).toBe(1);
		expect(commands[0].id).toBe('route:visible');
	});

	it('should use commandPalette.label over route.title', () => {
		setup([
			{
				path: 'billing',
				component: DummyComponent,
				title: 'Billing',
				data: {
					commandPalette: { label: 'Billing & Payments' },
				},
			},
		]);

		const commands: Command[] = registry.commands();
		expect(commands[0].label).toBe('Billing & Payments');
	});

	it('should generate a label from the path when no title is provided', () => {
		setup([{ path: 'user-settings', component: DummyComponent }]);

		const commands: Command[] = registry.commands();
		expect(commands[0].label).toBe('User Settings');
	});

	it('should walk child routes and build full paths', () => {
		setup([
			{
				path: 'admin',
				component: DummyComponent,
				title: 'Admin',
				children: [
					{ path: 'users', component: DummyComponent, title: 'Users' },
					{ path: 'roles', component: DummyComponent, title: 'Roles' },
				],
			},
		]);

		const ids: string[] = registry.commands().map((command: Command) => command.id);
		expect(ids).toContain('route:admin');
		expect(ids).toContain('route:admin/users');
		expect(ids).toContain('route:admin/roles');
	});

	it('should apply category and keywords from commandPalette data', () => {
		setup([
			{
				path: 'billing',
				component: DummyComponent,
				title: 'Billing',
				data: {
					commandPalette: {
						category: 'Settings',
						keywords: [
							'invoice',
							'payment',
						],
					},
				},
			},
		]);

		const command: Command = registry.commands()[0];
		expect(command.category).toBe('Settings');
		expect(command.keywords).toEqual([
			'invoice',
			'payment',
		]);
	});

	it('should default category to Pages when not specified', () => {
		setup([{ path: 'home', component: DummyComponent, title: 'Home' }]);

		expect(registry.commands()[0].category).toBe('Pages');
	});
});

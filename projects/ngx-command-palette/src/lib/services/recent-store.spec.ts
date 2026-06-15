import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { RecentCommandsStore } from './recent-store';
import { COMMAND_PALETTE_CONFIG } from '../provide';
import { CommandPaletteConfig } from '../models/command';

describe('RecentCommandsStore', () => {
	let store: RecentCommandsStore;

	const defaultConfig: CommandPaletteConfig = {
		trackRecent: true,
		recentCount: 3,
		maxResults: 10,
	};

	beforeEach(() => {
		localStorage.clear();

		TestBed.configureTestingModule({
			providers: [
				{ provide: PLATFORM_ID, useValue: 'browser' },
				{ provide: COMMAND_PALETTE_CONFIG, useValue: defaultConfig },
			],
		});

		store = TestBed.inject(RecentCommandsStore);
	});

	it('should add a command to the recent list', () => {
		store.record('cmd-1');

		expect(store.ids()).toEqual(['cmd-1']);
	});

	it('should move an existing id to the front when re-recorded', () => {
		store.record('cmd-1');
		store.record('cmd-2');
		store.record('cmd-1');

		expect(store.ids()).toEqual([
			'cmd-1',
			'cmd-2',
		]);
	});

	it('should trim the list to recentCount', () => {
		store.record('cmd-1');
		store.record('cmd-2');
		store.record('cmd-3');
		store.record('cmd-4');

		expect(store.ids().length).toBe(3);
		expect(store.ids()).toEqual([
			'cmd-4',
			'cmd-3',
			'cmd-2',
		]);
	});

	it('should return a higher boost for more recently used commands', () => {
		store.record('cmd-1');
		store.record('cmd-2');
		store.record('cmd-3');

		const boostForMostRecent: number = store.getBoost('cmd-3');
		const boostForOldest: number = store.getBoost('cmd-1');

		expect(boostForMostRecent).toBeGreaterThan(boostForOldest);
		expect(boostForMostRecent).toBeGreaterThan(0);
		expect(boostForOldest).toBeGreaterThan(0);
	});

	it('should calculate boost as (recentCount - index) * 4', () => {
		store.record('cmd-1');
		store.record('cmd-2');
		store.record('cmd-3');

		expect(store.getBoost('cmd-3')).toBe(12);
		expect(store.getBoost('cmd-2')).toBe(8);
		expect(store.getBoost('cmd-1')).toBe(4);
	});

	it('should return 0 boost for unknown command ids', () => {
		expect(store.getBoost('never-used')).toBe(0);
	});

	it('should persist recent ids to localStorage', () => {
		store.record('cmd-1');
		store.record('cmd-2');

		const stored: string | null = localStorage.getItem('ngx-command-palette-recent');
		expect(stored).not.toBeNull();

		const parsed: string[] = JSON.parse(stored!);
		expect(parsed).toEqual([
			'cmd-2',
			'cmd-1',
		]);
	});

	it('should load existing recent ids from localStorage on creation', () => {
		localStorage.setItem('ngx-command-palette-recent', JSON.stringify([
			'existing-1',
			'existing-2',
		]));

		TestBed.resetTestingModule();
		TestBed.configureTestingModule({
			providers: [
				{ provide: PLATFORM_ID, useValue: 'browser' },
				{ provide: COMMAND_PALETTE_CONFIG, useValue: defaultConfig },
			],
		});

		const freshStore: RecentCommandsStore = TestBed.inject(RecentCommandsStore);
		expect(freshStore.ids()).toEqual([
			'existing-1',
			'existing-2',
		]);
	});
});

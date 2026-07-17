import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, MockInstance } from 'vitest';
import { Observable, Subject, of, throwError } from 'rxjs';
import { PageStack } from './page-stack';
import { PageStackEntry } from './page-stack-entry.interface';
import { Command } from '../models/command';
import { CommandPage } from '../models/command-page.interface';

function makeCommand(overrides: Partial<Command> = {}): Command {
	return {
		id: overrides.id ?? 'test',
		label: overrides.label ?? 'Test',
		action: (): void => {},
		...overrides,
	};
}

function makeStaticPage(id: string, commands: Command[] = []): CommandPage {
	return {
		id,
		title: id,
		source: {
			kind: 'static',
			commands,
		},
	};
}

function makeLoaderPage(id: string, load: () => Observable<Command[]>): CommandPage {
	return {
		id,
		title: id,
		source: {
			kind: 'loader',
			load,
		},
	};
}

describe('PageStack', () => {
	let pageStack: PageStack;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		pageStack = TestBed.inject(PageStack);
	});

	it('should start empty', () => {
		expect(pageStack.current()).toBeNull();
		expect(pageStack.currentPage()).toBeNull();
		expect(pageStack.depth()).toBe(0);
		expect(pageStack.titles()).toEqual([]);
		expect(pageStack.loading()).toBe(false);
	});

	it('should expose a pushed page as current', () => {
		pageStack.push(makeStaticPage('theme'));

		expect(pageStack.depth()).toBe(1);
		expect(pageStack.currentPage()?.id).toBe('theme');
	});

	it('should populate loadedCommands immediately for a static source', () => {
		const commands: Command[] = [
			makeCommand({ id: 'theme.dark' }),
			makeCommand({ id: 'theme.light' }),
		];

		pageStack.push(makeStaticPage('theme', commands));

		expect(pageStack.current()?.loadedCommands).toEqual(commands);
		expect(pageStack.loading()).toBe(false);
	});

	it('should track titles in stack order and pop the top entry', () => {
		pageStack.push(makeStaticPage('move'));
		pageStack.push(makeStaticPage('columns'));

		expect(pageStack.titles()).toEqual([
			'move',
			'columns',
		]);

		pageStack.pop();

		expect(pageStack.titles()).toEqual(['move']);
		expect(pageStack.currentPage()?.id).toBe('move');
	});

	it('should do nothing when popping an empty stack', () => {
		pageStack.pop();

		expect(pageStack.depth()).toBe(0);
	});

	it('should clear the stack on reset', () => {
		pageStack.push(makeStaticPage('move'));
		pageStack.push(makeStaticPage('columns'));

		pageStack.reset();

		expect(pageStack.depth()).toBe(0);
		expect(pageStack.current()).toBeNull();
	});

	it('should set loading while a loader is in-flight and store its results on completion', () => {
		const responseSubject: Subject<Command[]> = new Subject<Command[]>();
		const commands: Command[] = [makeCommand({ id: 'assign.jane' })];

		pageStack.push(makeLoaderPage('assign', () => responseSubject.asObservable()));

		expect(pageStack.loading()).toBe(true);
		expect(pageStack.current()?.loadedCommands).toBeNull();

		responseSubject.next(commands);
		responseSubject.complete();

		expect(pageStack.loading()).toBe(false);
		expect(pageStack.current()?.loadedCommands).toEqual(commands);
	});

	it('should mark a failed loader entry and fall back to no commands', () => {
		pageStack.push(makeLoaderPage('assign', () => throwError(() => new Error('network'))));

		const entry: PageStackEntry | null = pageStack.current();
		expect(entry?.loadFailed).toBe(true);
		expect(entry?.loadedCommands).toEqual([]);
		expect(pageStack.loading()).toBe(false);
	});

	it('should load a page only once per session and reuse the cache on re-push', () => {
		const load: () => Observable<Command[]> = vi.fn(() => of([makeCommand({ id: 'assign.jane' })]));

		pageStack.push(makeLoaderPage('assign', load));
		pageStack.pop();
		pageStack.push(makeLoaderPage('assign', load));

		expect(load).toHaveBeenCalledTimes(1);
		expect(pageStack.current()?.loadedCommands?.length).toBe(1);
	});

	it('should not share the cache between pages with the same id but different loaders', () => {
		const firstCommands: Command[] = [makeCommand({ id: 'assign.jane' })];
		const secondCommands: Command[] = [makeCommand({ id: 'assign.john' })];
		const firstLoad: () => Observable<Command[]> = vi.fn(() => of(firstCommands));
		const secondLoad: () => Observable<Command[]> = vi.fn(() => of(secondCommands));

		pageStack.push(makeLoaderPage('assign', firstLoad));
		pageStack.pop();
		pageStack.push(makeLoaderPage('assign', secondLoad));

		expect(secondLoad).toHaveBeenCalledTimes(1);
		expect(pageStack.current()?.loadedCommands).toEqual(secondCommands);
	});

	it('should clear the loader cache on reset', () => {
		const load: () => Observable<Command[]> = vi.fn(() => of([makeCommand({ id: 'assign.jane' })]));

		pageStack.push(makeLoaderPage('assign', load));
		pageStack.reset();
		pageStack.push(makeLoaderPage('assign', load));

		expect(load).toHaveBeenCalledTimes(2);
	});

	it('should not cache a failed load, so re-entering retries', () => {
		let callCount: number = 0;

		const load: () => Observable<Command[]> = () => {
			callCount++;

			if (callCount === 1) {
				return throwError(() => new Error('network'));
			}

			return of([makeCommand({ id: 'assign.jane' })]);
		};

		pageStack.push(makeLoaderPage('assign', load));
		pageStack.pop();
		pageStack.push(makeLoaderPage('assign', load));

		expect(callCount).toBe(2);
		expect(pageStack.current()?.loadFailed).toBe(false);
		expect(pageStack.current()?.loadedCommands?.length).toBe(1);
	});

	it('should cancel an in-flight load when its page is popped', () => {
		const teardown: () => void = vi.fn();

		const load: () => Observable<Command[]> = () => {
			return new Observable<Command[]>(() => teardown);
		};

		pageStack.push(makeLoaderPage('assign', load));
		pageStack.pop();

		expect(teardown).toHaveBeenCalledTimes(1);
	});

	it('should cancel all in-flight loads on reset', () => {
		const teardown: () => void = vi.fn();

		const load: () => Observable<Command[]> = () => {
			return new Observable<Command[]>(() => teardown);
		};

		pageStack.push(makeLoaderPage('assign', load));
		pageStack.push(makeLoaderPage('move', load));
		pageStack.reset();

		expect(teardown).toHaveBeenCalledTimes(2);
	});

	it('should warn in dev mode when the same page id is pushed twice', () => {
		const warnSpy: MockInstance = vi.spyOn(console, 'warn').mockImplementation(() => {});

		pageStack.push(makeStaticPage('theme'));
		pageStack.push(makeStaticPage('theme'));

		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"theme"'));

		warnSpy.mockRestore();
	});

	it('should patch entries by entry key, so duplicate page ids stay independent', () => {
		const firstResponse: Subject<Command[]> = new Subject<Command[]>();
		const secondResponse: Subject<Command[]> = new Subject<Command[]>();
		const responses: Subject<Command[]>[] = [
			firstResponse,
			secondResponse,
		];
		let callIndex: number = 0;

		const warnSpy: MockInstance = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const load: () => Observable<Command[]> = () => responses[callIndex++].asObservable();

		pageStack.push(makeLoaderPage('assign', load));
		pageStack.push(makeLoaderPage('assign', load));

		const commands: Command[] = [makeCommand({ id: 'assign.jane' })];
		firstResponse.next(commands);
		firstResponse.complete();

		expect(pageStack.current()?.loading).toBe(true);
		expect(pageStack.current()?.loadedCommands).toBeNull();

		pageStack.pop();

		expect(pageStack.current()?.loading).toBe(false);
		expect(pageStack.current()?.loadedCommands).toEqual(commands);

		warnSpy.mockRestore();
	});
});

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { ProviderRegistry } from './provider-registry';
import { SearchProvider } from '../models/command';

function makeProvider(overrides: Partial<SearchProvider> = {}): SearchProvider {
	return {
		id: overrides.id ?? 'test-provider',
		category: overrides.category ?? 'Test',
		search: overrides.search ?? ((): ReturnType<SearchProvider['search']> => of([])),
		...overrides,
	};
}

describe('ProviderRegistry', () => {
	let registry: ProviderRegistry;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		registry = TestBed.inject(ProviderRegistry);
	});

	it('should register a provider and expose it via providers()', () => {
		registry.register(makeProvider({ id: 'users' }));

		expect(registry.providers().length).toBe(1);
		expect(registry.providers()[0].id).toBe('users');
	});

	it('should overwrite a provider when registering with the same id', () => {
		registry.register(makeProvider({
			id: 'users',
			category: 'Original', 
		}));
		registry.register(makeProvider({
			id: 'users',
			category: 'Updated', 
		}));

		expect(registry.providers().length).toBe(1);
		expect(registry.providers()[0].category).toBe('Updated');
	});

	it('should deregister a provider by id', () => {
		registry.register(makeProvider({ id: 'users' }));
		registry.register(makeProvider({ id: 'tickets' }));

		registry.deregister('users');

		expect(registry.providers().length).toBe(1);
		expect(registry.providers()[0].id).toBe('tickets');
	});

	it('should return a provider by its prefix', () => {
		registry.register(makeProvider({
			id: 'users',
			prefix: '@', 
		}));
		registry.register(makeProvider({
			id: 'tickets',
			prefix: '#', 
		}));

		const result: SearchProvider | undefined = registry.getByPrefix('@');
		expect(result).toBeDefined();
		expect(result!.id).toBe('users');
	});

	it('should return undefined for an unregistered prefix', () => {
		expect(registry.getByPrefix('!')).toBeUndefined();
	});

	it('should return only unprefixed providers', () => {
		registry.register(makeProvider({
			id: 'users',
			prefix: '@', 
		}));
		registry.register(makeProvider({ id: 'global-search' }));
		registry.register(makeProvider({ id: 'docs' }));

		const unprefixed: SearchProvider[] = registry.getUnprefixed();
		expect(unprefixed.length).toBe(2);

		const ids: string[] = unprefixed.map((provider: SearchProvider) => provider.id);
		expect(ids).toContain('global-search');
		expect(ids).toContain('docs');
	});

	it('should return all registered prefixes', () => {
		registry.register(makeProvider({
			id: 'users',
			prefix: '@', 
		}));
		registry.register(makeProvider({
			id: 'tickets',
			prefix: '#', 
		}));
		registry.register(makeProvider({ id: 'global-search' }));

		const prefixes: string[] = registry.getPrefixes();
		expect(prefixes).toContain('@');
		expect(prefixes).toContain('#');
		expect(prefixes.length).toBe(2);
	});
});

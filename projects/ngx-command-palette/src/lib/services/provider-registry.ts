import { Injectable, signal, computed, WritableSignal, Signal } from '@angular/core';
import { SearchProvider } from '../models/command';

@Injectable({ providedIn: 'root' })
export class ProviderRegistry {
	readonly #providers: WritableSignal<Map<string, SearchProvider>> = signal<Map<string, SearchProvider>>(new Map());

	public readonly providers: Signal<SearchProvider[]> = computed(() => [...this.#providers().values()]);

	public register(provider: SearchProvider): void {
		this.#providers.update((map: Map<string, SearchProvider>) => {
			const updated: Map<string, SearchProvider> = new Map(map);
			updated.set(provider.id, provider);
			return updated;
		});
	}

	public deregister(providerId: string): void {
		this.#providers.update((map: Map<string, SearchProvider>) => {
			const updated: Map<string, SearchProvider> = new Map(map);
			updated.delete(providerId);
			return updated;
		});
	}

	public getById(providerId: string): SearchProvider | undefined {
		return this.#providers().get(providerId);
	}

	public getByPrefix(prefix: string): SearchProvider | undefined {
		for (const provider of this.#providers().values()) {
			if (provider.prefix === prefix) {
				return provider;
			}
		}

		return undefined;
	}

	public getUnprefixed(): SearchProvider[] {
		return this.providers().filter((provider: SearchProvider) => !provider.prefix);
	}

	public getPrefixes(): string[] {
		// Longest first, so an overlapping prefix like ">>" is matched before ">".
		return this.providers()
			.filter((provider: SearchProvider) => !!provider.prefix)
			.map((provider: SearchProvider) => provider.prefix!)
			.sort((first: string, second: string) => second.length - first.length);
	}
}

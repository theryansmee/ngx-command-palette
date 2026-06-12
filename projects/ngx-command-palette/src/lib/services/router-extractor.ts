import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, Route, RouteConfigLoadEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Command } from '../models/command';
import { CommandRegistry } from './command-registry';

interface RouteWithLoadedChildren extends Route {
	_loadedRoutes?: Route[];
}

@Injectable({ providedIn: 'root' })
export class RouterCommandExtractor {
	readonly #router: Router = inject(Router);

	readonly #registry: CommandRegistry = inject(CommandRegistry);

	readonly #destroyRef: DestroyRef = inject(DestroyRef);

	public init(): void {
		this.#extractAndRegister();

		this.#router.events.pipe(
			filter((event: unknown) => event instanceof RouteConfigLoadEnd),
			takeUntilDestroyed(this.#destroyRef),
		).subscribe(() => this.#extractAndRegister());
	}

	#extractAndRegister(): void {
		const commands: Command[] = this.#walkRoutes(this.#router.config, '');
		this.#registry.registerBatch('router', commands);
	}

	#walkRoutes(routes: Route[], parentPath: string): Command[] {
		const commands: Command[] = [];

		for (const route of routes) {
			if (!route.path && route.path !== '') {
				continue;
			}

			if (route.redirectTo) {
				continue;
			}

			if (route.path === '**') {
				continue;
			}

			const config = route.data?.['commandPalette'] as Record<string, unknown> | false | undefined;

			if (config === false) {
				continue;
			}

			const fullPath: string = parentPath
				? `${parentPath}/${route.path}`
				: route.path ?? '';

			const hasParams: boolean = fullPath.includes(':');

			if (hasParams && !config) {
				continue;
			}

			const label: string | null = (config?.['label'] as string | undefined)
				?? (typeof route.title === 'string' ? route.title : null)
				?? this.#pathToLabel(fullPath);

			if (label && !hasParams) {
				commands.push({
					id: `route:${fullPath}`,
					label,
					category: (config?.['category'] as string | undefined) ?? 'Pages',
					icon: config?.['icon'] as string | undefined,
					keywords: (config?.['keywords'] as string[] | undefined) ?? [],
					priority: (config?.['priority'] as number | undefined) ?? 0,
					action: (): void => {
						this.#router.navigate(['/' + fullPath]);
					},
				});
			}

			if (route.children) {
				commands.push(...this.#walkRoutes(route.children, fullPath));
			}

			const loadedRoutes: Route[] | undefined = (route as RouteWithLoadedChildren)._loadedRoutes;
			if (loadedRoutes) {
				commands.push(...this.#walkRoutes(loadedRoutes, fullPath));
			}
		}

		return commands;
	}

	#pathToLabel(path: string): string {
		const last: string = path.split('/').pop() ?? '';
		return last
			.replace(/-/g, ' ')
			.replace(/\b\w/g, (char: string) => char.toUpperCase());
	}
}

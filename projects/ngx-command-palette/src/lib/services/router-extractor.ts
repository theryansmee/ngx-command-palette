import { Injectable, inject } from '@angular/core';
import { Router, Route, RouteConfigLoadEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Command } from '../models/command';
import { CommandRegistry } from './command-registry';

@Injectable({ providedIn: 'root' })
export class RouterCommandExtractor {
	private readonly router: Router = inject(Router);
	private readonly registry: CommandRegistry = inject(CommandRegistry);

	public init(): void {
		this.extractAndRegister();

		this.router.events.pipe(
			filter((e: unknown) => e instanceof RouteConfigLoadEnd),
		).subscribe(() => this.extractAndRegister());
	}

	private extractAndRegister(): void {
		const commands: Command[] = this.walkRoutes(this.router.config, '');
		this.registry.registerBatch('router', commands);
	}

	private walkRoutes(routes: Route[], parentPath: string): Command[] {
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
				?? this.pathToLabel(fullPath);

			if (label && !hasParams) {
				commands.push({
					id: `route:${fullPath}`,
					label,
					category: (config?.['category'] as string | undefined) ?? 'Pages',
					icon: config?.['icon'] as string | undefined,
					keywords: (config?.['keywords'] as string[] | undefined) ?? [],
					priority: (config?.['priority'] as number | undefined) ?? 0,
					action: (): void => {
						this.router.navigate(['/' + fullPath]); 
					},
				});
			}

			if (route.children) {
				commands.push(...this.walkRoutes(route.children, fullPath));
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			if ((route as any)._loadedRoutes) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				commands.push(...this.walkRoutes((route as any)._loadedRoutes as Route[], fullPath));
			}
		}

		return commands;
	}

	private pathToLabel(path: string): string {
		const last: string = path.split('/').pop() ?? '';
		return last
			.replace(/-/g, ' ')
			.replace(/\b\w/g, (c: string) => c.toUpperCase());
	}
}

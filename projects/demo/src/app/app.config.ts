import { ApplicationConfig, Injectable, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideRouter, TitleStrategy, RouterStateSnapshot } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { provideCommandPalette } from 'ngx-command-palette';
import { routes } from './app.routes';

@Injectable()
class PageTitleStrategy extends TitleStrategy {
	readonly #title: Title = new Title(document);

	public override updateTitle(snapshot: RouterStateSnapshot): void {
		const pageTitle: string | undefined = this.buildTitle(snapshot);
		this.#title.setTitle(
			pageTitle ? `${pageTitle} | ngx-command-palette` : 'ngx-command-palette',
		);
	}
}

export const appConfig: ApplicationConfig = {
	providers: [
		provideExperimentalZonelessChangeDetection(),
		provideRouter(routes),
		provideCommandPalette(),
		{ provide: TitleStrategy, useClass: PageTitleStrategy },
	],
};

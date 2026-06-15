import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
	plugins: [
		angular({
			tsconfig: 'projects/ngx-command-palette/tsconfig.spec.json',
		}),
	],
	test: {
		include: ['projects/ngx-command-palette/src/**/*.spec.ts'],
		environment: 'jsdom',
		setupFiles: ['projects/ngx-command-palette/src/test-setup.ts'],
	},
});

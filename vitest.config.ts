import { defineConfig } from 'vitest/config';
import path from 'path';
import rootConfig from './shared/configs/vitest.config.base.ts';

export default defineConfig({
	...rootConfig,
	test: {
		...rootConfig.test,
	},
	resolve: {
		alias: {
			'@': path.resolve(process.cwd(), './src'),
		},
	},
});

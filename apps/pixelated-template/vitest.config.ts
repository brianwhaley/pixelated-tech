import { defineConfig } from 'vitest/config';
import path from 'node:path';
import rootConfig from '../../shared/configs/vitest.config.base.ts';

export default defineConfig({
	root: path.resolve(__dirname),
	...rootConfig,
	test: {
		...rootConfig.test,
		include: ['./src/tests/site.test.tsx'],
		setupFiles: ['./src/tests/setup.ts'],
		globals: true,
	},
});

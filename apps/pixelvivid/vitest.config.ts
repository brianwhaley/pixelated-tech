import { defineConfig } from 'vitest/config';
import rootConfig from '../../shared/configs/vitest.config.base.ts';

export default defineConfig({
	...rootConfig,
	test: {
		...rootConfig.test,
		setupFiles: ['./src/tests/setup.ts'],
	},
});

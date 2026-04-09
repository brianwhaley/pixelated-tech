import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
	plugins: [react()],
	test: {
		// eslint-disable-next-line pixelated/no-hardcoded-config-keys -- vitest config, not pixelated config
		environment: 'jsdom',
		setupFiles: ['./src/test/setup.ts'],
		globals: true,
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
});
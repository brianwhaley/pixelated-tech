import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const COVERAGE_THRESHOLDS = {
	lines: 72.5,
	functions: 73.25,
	branches: 60,
	statements: 70.25,
};

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/test/setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			include: ['src/components/**/*.{ts,tsx,js}'],
			exclude: [
				'node_modules/',
				'dist/',
				'**/*.stories.ts',
				'**/*.stories.tsx',
				'**/*.css',
				'**/data/**',
				'**/scripts/**',
				'**/test/**',
				'**/tests/**',
			],
			thresholds: {
				lines: COVERAGE_THRESHOLDS.lines,
				functions: COVERAGE_THRESHOLDS.functions,
				branches: COVERAGE_THRESHOLDS.branches,
				statements: COVERAGE_THRESHOLDS.statements,
				perFile: false,
			},
		},
		include: ['src/**/*.{test,spec}.{ts,tsx}'],
		exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
	},
});

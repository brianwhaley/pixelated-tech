import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const COVERAGE_THRESHOLDS = {
	lines: 84.5,// actually targeting 80%
	functions: 84.25, // actually targeting 80%
	branches: 69.5, // actually targeting 80%
	statements: 82, // actually targeting 80%
};

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': path.resolve(process.cwd(), './src'),
		},
	},
	test: {
		globals: true,
		environment: 'jsdom',
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			include: ['src/**/*.{ts,tsx}'],
			exclude: [
				'node_modules/',
				'dist/',
				'**/*.d.ts',
				'**/*.stories.*',
				'**/stories/**',
				'**/*.css',
				'**/*[Tt]ypes.{ts,tsx}',
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

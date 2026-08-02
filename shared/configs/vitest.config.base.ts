import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const COVERAGE_THRESHOLDS = {
	statements: 85,
	branches: 73, // 74.5, // actually targeting 85%
	functions: 85,
	lines: 85,
};

const sharedTestConfig = {
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
	include: ['src/**/*.{test,spec}.{ts,tsx,js}'],
	exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
};

export function createAppVitestConfig(appDir: string, options: { include?: string[]; globals?: boolean } = {}) {
	const root = path.resolve(appDir);
	return defineConfig({
		root,
		plugins: [react()],
		resolve: {
			alias: {
				'@': path.resolve(root, './src'),
			},
		},
		test: {
			...sharedTestConfig,
			...options,
			setupFiles: ['./src/tests/setup.ts'],
		},
	});
}

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': path.resolve(process.cwd(), './src'),
		},
	},
	test: {
		...sharedTestConfig,
		setupFiles: ['./src/tests/setup.ts'],
	},
});

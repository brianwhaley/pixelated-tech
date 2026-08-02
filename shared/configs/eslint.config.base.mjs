import globals from "globals";
import eslint from "@eslint/js";
import pluginNext from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";
import parser from "@typescript-eslint/parser";
import jsonPlugin from "@eslint/json";
import a11yPlugin from "eslint-plugin-jsx-a11y";
import pixelatedPlugin from "../eslint-plugin/pixelated-eslint-plugin.js";

/**
 * Base ESLint configuration shared by all apps in the monorepo
 * Each app passes its own __dirname for correct tsconfigRootDir resolution
 */
export function getBaseESLintConfig(__dirname) {
	return [
		{
			ignores: [
				".next/**",
				"**/.next/**",
				"**/package-lock.json",
				"build/**",
				"certificates/",
				"coverage/**",
				"dist/**",
				"node_modules/**",
				"next-env.d.ts",
				"src/scripts/**",
			],
		},
		{
			files: ["**/*.{js,jsx,mjs,mjsx,cjs,cjsx,ts,tsx,mts,mtsx,cts,ctsx}"],
			languageOptions: {
				parser,
				globals: {
					...globals.browser,
					...globals.node,
				},
				parserOptions: {
					ecmaVersion: "latest",
					sourceType: "module",
					jsx: true,
					tsconfigRootDir: __dirname,
				},
			},
			plugins: {
				"@next/next": pluginNext,
				"@typescript-eslint": tseslint.plugin,
				"jsx-a11y": a11yPlugin,
				"pixelated": pixelatedPlugin,
			},
			rules: {
				...eslint.configs.recommended.rules,
				...tseslint.configs.recommended[0].rules,
				...tseslint.configs.recommended[1].rules,
				...pluginNext.configs.recommended.rules,
				"indent": ["error", "tab"],
				"no-tabs": "off",
				"semi": ["error", "always"],
				"@next/next/no-img-element": "off",
				"@next/next/no-html-link-for-pages": "off",
				"@typescript-eslint/no-explicit-any": "off",
				"no-unused-vars": "off",
				"@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
				...pixelatedPlugin.configs.recommended.rules,
				"pixelated/prop-types-inferprops": "warn",
				"pixelated/required-faq": "off",
			},
		},
		{
			files: ["**/*.json"],
			language: "json/jsonc",
			plugins: {
				json: jsonPlugin,
				pixelated: pixelatedPlugin,
			},
			rules: {
				...jsonPlugin.configs.recommended.rules,
				'pixelated/strict-pronoun-resolution': 'warn',
			},
		},
		{
			files: ["scripts/**/*.js", "src/app/api/**/*.ts"],
			rules: {
				"@typescript-eslint/no-require-imports": "off",
			},
		},
	];
}

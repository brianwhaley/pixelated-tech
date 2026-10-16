import { getBaseESLintConfig } from "../../../shared/configs/eslint.config.base.mjs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
	...getBaseESLintConfig(__dirname),
	{
		files: ["*.{js,mjs,cjs}"],
		rules: {
			"pixelated/enforce-single-h1": "off",
			"pixelated/no-process-env": "off",
			"pixelated/no-single-use-helpers": "off",
			"@typescript-eslint/no-require-imports": "off",
			"@typescript-eslint/no-unused-vars": "off",
			"no-undef": "off",
			"no-var": "off",
			"indent": "off",
		},
	},
];

import { getBaseESLintConfig } from "../../../shared/configs/eslint.config.base.mjs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
	...getBaseESLintConfig(__dirname),
	{
		files: ["**/*.{js,mjs,cjs}"],
		rules: {
			"pixelated/enforce-single-h1": "off",
			"pixelated/no-direct-fetch": "off",
			"pixelated/strict-pronoun-resolution": "off",
		},
	},
];

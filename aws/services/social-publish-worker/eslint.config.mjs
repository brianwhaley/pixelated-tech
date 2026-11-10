import { getBaseESLintConfig } from "../../../shared/configs/eslint.config.base.mjs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
	...getBaseESLintConfig(__dirname),
	{
		ignores: [".aws-sam/**"],
	},
	{
		files: ["**/*.{js,mjs,cjs}"],
		rules: {
			"pixelated/enforce-single-h1": "off",
			"pixelated/strict-pronoun-resolution": "off",
			"pixelated/no-process-env": "off",
		},
	},
];

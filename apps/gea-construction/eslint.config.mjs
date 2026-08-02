import { getBaseESLintConfig } from "../../shared/configs/eslint.config.base.mjs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default getBaseESLintConfig(__dirname);


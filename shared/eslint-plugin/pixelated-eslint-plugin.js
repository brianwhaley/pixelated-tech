import { ALLOWED_ENV_VARS } from './rules/eslint-rules-helpers.js';
import { enforceTargetBlankRelRule } from './rules/enforce-target-blank-rel.js';
import { noLowInformationCopyRule } from './rules/no-low-information-copy.js';
import { packageJsonNoUnusedDependencyRule } from './rules/package-json-no-unused-dependency.js';
import { packageJsonMissingDependencyRule } from './rules/package-json-missing-dependency.js';
import { packageJsonWrongDependencyTypeRule } from './rules/package-json-wrong-dependency-type.js';
import { strictPronounResolutionRule } from './rules/strict-pronoun-resolution.js';
import { propTypesInferPropsRule } from './rules/prop-types-inferprops.js';
import { requiredSchemasRule } from './rules/required-schemas.js';
import { noTempDependencyRule } from './rules/no-temp-dependency.js';
import { noStaleOverrideRule } from './rules/no-stale-override.js';
import { propTypesJsdocRule } from './rules/prop-types-jsdoc.js';
import { classNameKebabCaseRule } from './rules/class-name-kebab-case.js';
import { requiredFilesRule } from './rules/required-files.js';
import { noRawImgRule } from './rules/no-raw-img.js';
import { requireContentfulImageWebpRule } from './rules/require-contentful-image-webp.js';
import { requireSectionIdsRule } from './rules/require-section-ids.js';
import { validateTestLocationsRule } from './rules/validate-test-locations.js';
import { noProcessEnvRule } from './rules/no-process-env.js';
import { noDebugTrueRule } from './rules/no-debug-true.js';
import { requiredFaqRule } from './rules/required-faq.js';
import { fileNameKebabCaseRule } from './rules/file-name-kebab-case.js';
import { noDuplicateExportNamesRule } from './rules/no-duplicate-export-names.js';
import { noHardcodedConfigKeysRule } from './rules/no-hardcoded-config-keys.js';
import { noGenericCtaTextRule } from './rules/no-generic-cta-text.js';
import { noDirectFetchRule } from './rules/no-direct-fetch.js';
import { noSingleUseHelpersRule } from './rules/no-single-use-helpers.js';

export default {
	rules: {
		'class-name-kebab-case': classNameKebabCaseRule,
        'enforce-target-blank-rel': enforceTargetBlankRelRule,
		'file-name-kebab-case': fileNameKebabCaseRule,
		'no-debug-true': noDebugTrueRule,
		'no-direct-fetch': noDirectFetchRule,
		'no-duplicate-export-names': noDuplicateExportNamesRule,
		'no-generic-cta-text': noGenericCtaTextRule,
		'no-hardcoded-config-keys': noHardcodedConfigKeysRule,
		'no-low-information-copy': noLowInformationCopyRule,
		'no-process-env': noProcessEnvRule,
		'no-raw-img': noRawImgRule,
		'no-stale-override': noStaleOverrideRule,
		'no-single-use-helpers': noSingleUseHelpersRule,
		'no-temp-dependency': noTempDependencyRule,
		'package-json-missing-dependency': packageJsonMissingDependencyRule,
		'package-json-no-unused-dependency': packageJsonNoUnusedDependencyRule,
		'package-json-wrong-dependency-type': packageJsonWrongDependencyTypeRule,
		'prop-types-inferprops': propTypesInferPropsRule,
		'require-contentful-image-webp': requireContentfulImageWebpRule,
		'require-section-ids': requireSectionIdsRule,
		'required-files': requiredFilesRule,
		'required-proptypes-jsdoc': propTypesJsdocRule,
		'required-schemas': requiredSchemasRule,
		'required-faq': requiredFaqRule,
		'strict-pronoun-resolution': strictPronounResolutionRule,
		'validate-test-locations': validateTestLocationsRule,
	},
	configs: {
		recommended: {
			rules: {
				'pixelated/class-name-kebab-case': 'error',
                'pixelated/enforce-target-blank-rel': 'error',
				'pixelated/file-name-kebab-case': 'off',
				'pixelated/no-debug-true': 'warn',
				'pixelated/no-direct-fetch': 'error',
				'pixelated/no-duplicate-export-names': 'error',
				'pixelated/no-generic-cta-text': 'error',
				'pixelated/no-hardcoded-config-keys': 'error',
				'pixelated/no-low-information-copy': ['warn', { threshold: 1.5 }],
				'pixelated/no-process-env': ['error', { allowed: ALLOWED_ENV_VARS }],
				'pixelated/no-raw-img': 'warn',
				'pixelated/no-single-use-helpers': 'error',
				'pixelated/no-stale-override': 'error',
				'pixelated/no-temp-dependency': 'error',
				'pixelated/package-json-missing-dependency': 'error',
				'pixelated/package-json-no-unused-dependency': 'warn',
				'pixelated/package-json-wrong-dependency-type': 'warn',
				'pixelated/prop-types-inferprops': 'error',
				'pixelated/require-contentful-image-webp': 'warn',
				'pixelated/require-section-ids': 'error',
				'pixelated/required-faq': 'warn',
				'pixelated/required-schemas': 'warn',
				'pixelated/required-files': 'warn',
				'pixelated/required-proptypes-jsdoc': 'error',
				'pixelated/strict-pronoun-resolution': 'warn',
				'pixelated/validate-test-locations': 'error',
			},
		},
	},
};

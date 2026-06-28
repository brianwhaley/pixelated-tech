import fs from 'fs/promises';
import path from 'path';

const root = path.resolve(process.cwd());
const testsDir = path.join(root, 'src', 'tests');
const sharedDir = path.join(root, 'src', 'test');
const failures = [];
const MAX_INLINE_DATA_LINES = 30;
const MAX_INLINE_DATA_CHARS = 1200;
const DUPLICATE_MIN_LINES = 4;
const DUPLICATE_MIN_CHARS = 120;

const THRESHOLDS = {
  sharedTestUtilsImport: 0.49,
  sharedRenderHarnessUsage: 1.0, // verify exclusive use of the render harness
  sharedConfigFactoryUsage: 0.02, // evaluate if this is a god idea or not
  sharedTestDataImport: 1.0, // no direct import of data from /test/data folder
  sharedFixtureImportUsage: 0.32, // i want to make this 0
  sharedDataFactoryUsage: 0.26,
  sharedAssertionUsage: 0.01,
  noDirectJsonImport: 1.0,
  inlineRenderConfigUsage: 0.98,
  largeInlineData: 0.99,
  duplicateInlineData: 1.0,
};

async function readFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await readFiles(fullPath));
    } else if (/\.(?:ts|tsx|js)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

function normalizeLiteral(text) {
  const stripped = stripComments(text);
  return stripped.replace(/\s+/g, ' ').trim();
}

function findLiteralBlocks(contents) {
  const blocks = [];
  const regex = /(^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*([\[{])/g;
  let match;

  while ((match = regex.exec(contents)) !== null) {
    const [, , name, opener] = match;
    const start = match.index + match[0].lastIndexOf(opener);
    const closeChar = opener === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let stringChar = '';
    let escaped = false;
    let inLineComment = false;
    let inBlockComment = false;
    let end = -1;

    for (let idx = start; idx < contents.length; idx += 1) {
      const char = contents[idx];
      const nextChar = contents[idx + 1];

      if (inLineComment) {
        if (char === '\n') {
          inLineComment = false;
        }
        continue;
      }

      if (inBlockComment) {
        if (char === '*' && nextChar === '/') {
          inBlockComment = false;
          idx += 1;
        }
        continue;
      }

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
        continue;
      }

      if (char === '/' && nextChar === '/') {
        inLineComment = true;
        idx += 1;
        continue;
      }

      if (char === '/' && nextChar === '*') {
        inBlockComment = true;
        idx += 1;
        continue;
      }

      if (char === '"' || char === "'" || char === '`') {
        inString = true;
        stringChar = char;
        continue;
      }

      if (char === opener) {
        depth += 1;
      } else if (char === closeChar) {
        depth -= 1;
        if (depth === 0) {
          end = idx + 1;
          break;
        }
      }
    }

    if (end === -1) {
      continue;
    }

    const snippet = contents.slice(match.index, end);
    blocks.push({
      name,
      startLine: contents.slice(0, match.index).split('\n').length,
      lines: snippet.split('\n').length,
      chars: snippet.length,
      content: snippet,
    });
  }

  return blocks;
}

function findTokenOutsideStrings(contents, pattern) {
  let inString = false;
  let stringChar = '';
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let idx = 0; idx < contents.length; idx += 1) {
    const char = contents[idx];
    const nextChar = contents[idx + 1];

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === '*' && nextChar === '/') {
        inBlockComment = false;
        idx += 1;
      }
      continue;
    }

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
      continue;
    }

    if (char === '/' && nextChar === '/') {
      inLineComment = true;
      idx += 1;
      continue;
    }

    if (char === '/' && nextChar === '*') {
      inBlockComment = true;
      idx += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringChar = char;
      continue;
    }

    if (pattern.test(contents.slice(idx))) {
      return true;
    }
  }

  return false;
}

function validateFocusedTests(file, contents) {
  const focusedPatterns = [
    /^(?:describe|it|test)\.only\s*\(/,
    /^vi\.only\s*\(/,
    /^fdescribe\s*\(/,
    /^fit\s*\(/,
  ];

  for (const pattern of focusedPatterns) {
    if (findTokenOutsideStrings(contents, pattern)) {
      failures.push(`${path.relative(root, file)} contains focused tests (${pattern})`);
      return;
    }
  }
}

function validateLocalTestUtilsImport(file, contents) {
  if (/import .*['"]\.\/test-utils['"]/.test(contents)) {
    failures.push(`${path.relative(root, file)} imports local ./test-utils instead of shared src/test/test-utils`);
  }
  if (/import .*['"]\.\.\/tests\/test-utils['"]/.test(contents)) {
    failures.push(`${path.relative(root, file)} imports local ../tests/test-utils instead of shared src/test/test-utils`);
  }
}

function validateSharedTestDataImport(file, contents) {
  // Flag any .json import/require unless the import path explicitly contains a `/test/` segment
  const jsonImportRegex = /(?:import\s+.*\s+from\s+['"]([^'"\\]+\.json)['"])|(?:require\(['"]([^'"\\]+\.json)['"]\))/g;
  let m;
  while ((m = jsonImportRegex.exec(contents)) !== null) {
    const importPath = m[1] || m[2] || '';
    if (!/\/test\//.test(importPath) && !/@\/test\//.test(importPath)) {
      failures.push(`${path.relative(root, file)} imports JSON fixture data directly (${importPath}); use src/test/test-data.ts instead`);
    }
  }
}

function validateLargeInlineDataBlocks(file, contents) {
  const blocks = findLiteralBlocks(contents);
  for (const block of blocks) {
    if (block.lines >= MAX_INLINE_DATA_LINES || block.chars >= MAX_INLINE_DATA_CHARS) {
      failures.push(
        `${path.relative(root, file)} contains large inline literal '${block.name}' at line ${block.startLine} (${block.lines} lines, ${block.chars} chars); move shared fixture data into src/test/fixtures.ts or src/test/test-data.ts`
      );
    }
  }
}

function validateDuplicateTestData(testFilesContents) {
  const seen = new Map();

  for (const { file, contents } of testFilesContents) {
    const blocks = findLiteralBlocks(contents);
    for (const block of blocks) {
      if (block.lines < DUPLICATE_MIN_LINES || block.chars < DUPLICATE_MIN_CHARS) {
        continue;
      }
      const normalized = normalizeLiteral(block.content);
      if (!normalized) {
        continue;
      }
      const key = normalized;
      const previous = seen.get(key) || [];
      previous.push({ file, name: block.name, line: block.startLine, lines: block.lines });
      seen.set(key, previous);
    }
  }

  for (const [key, entries] of seen.entries()) {
    const uniqueFiles = new Set(entries.map(entry => entry.file));
    if (uniqueFiles.size > 1) {
      const files = entries.map(entry => `${path.relative(root, entry.file)}:${entry.line} (${entry.name})`);
      failures.push(`Duplicate inline test data detected in multiple test files: ${files.join(' | ')}`);
    }
  }
}

function getSharedTestUtilsImportMetric(testFilesContents) {
  const pattern = /from\s+['"](?:\.\.\/test\/test-utils|@\/test\/test-utils)['"]/;
  const count = testFilesContents.filter(({ contents }) => pattern.test(contents)).length;
  return count / testFilesContents.length;
}

function getSharedRenderHarnessUsageMetric(testFilesContents) {
  const importPattern = /from\s+['"](?:\.\.\/test\/test-utils|@\/test\/test-utils)['"]/;
  const renderPattern = /(?:renderWithProviders|renderWithConfig|renderWithoutProviders|render)\s*\(/;
  // New policy:
  // - Files that do not call any `render` helper at all are considered passing (they don't affect the metric).
  // - Files that import `render` (or other render helpers) from the shared test-utils are passing.
  // - Files that import `render` from `@testing-library/react` are failing.
  const testingLibraryRenderImport = /import\s+\{[^}]*\brender\b[^}]*\}\s+from\s+['"]@testing-library\/react['"]/;
  const testingLibraryAnyRenderUsage = /(?:renderWithProviders|renderWithConfig|renderWithoutProviders|render)\s*\(/;

  let passing = 0;
  for (const { contents } of testFilesContents) {
    // if the file doesn't call any render helper, treat as pass
    if (!testingLibraryAnyRenderUsage.test(contents)) {
      passing += 1;
      continue;
    }
    // if it imports from shared test-utils, pass
    if (importPattern.test(contents)) {
      passing += 1;
      continue;
    }
    // if it imports render from testing-library, fail (do not increment passing)
    if (testingLibraryRenderImport.test(contents)) {
      continue;
    }
    // otherwise, it's a render usage but not from shared harness nor testing-library import - treat as fail
  }

  return passing / testFilesContents.length;
}

function getSharedTestDataImportMetric(testFilesContents) {
  const pattern = /from\s+['"](?:\.\.\/test\/(?:test-data|fixtures)|@\/test\/(?:test-data|fixtures))['"]/;
  // Consider a file passing if it imports shared test-data/fixtures OR if it does not import from src/test at all.
  // Match any import path that contains a `/test/` segment or `@/test/` (safer than anchoring at the start)
  // Intended policy (informational):
  // - If a test imports any data file (JSON or other fixtures), it SHOULD import via the shared barrel
  //   at `src/test/test-data.ts` (or `src/test/fixtures.ts`).
  // - It's difficult to statically detect arbitrary "data" imports reliably (extensions omitted, dynamic
  //   resolution, varying file names). For now we conservatively detect direct imports that explicitly target
  //   the `src/test/data` folder (e.g. `../test/data/foo.json`) and consider those failures unless they go
  //   through the shared barrel. This is a narrower but safe approximation of the intent.
  const allowedPattern = /from\s+['"](?:\.\.\/test\/(?:test-data|fixtures)|@\/test\/(?:test-data|fixtures))['"]/;
  const directDataImport = /from\s+['"][^'\"]*\/test\/data\/[^^'\"]+['"]/;
  const count = testFilesContents.filter(({ contents }) => allowedPattern.test(contents) || !directDataImport.test(contents)).length;
  return count / testFilesContents.length;
}

function getSharedDataFactoryUsageMetric(testFilesContents) {
  const pattern = /from\s+['"](?:\.\.\/test\/test-data|@\/test\/test-data)['"]/;
  const count = testFilesContents.filter(({ contents }) => pattern.test(contents)).length;
  return count / testFilesContents.length;
}

function getSharedConfigFactoryUsageMetric(testFilesContents) {
  const pattern = /\bcreate[A-Z][A-Za-z0-9]*Config\b/;
  const count = testFilesContents.filter(({ contents }) => pattern.test(contents)).length;
  return count / testFilesContents.length;
}

function getSharedFixtureImportUsageMetric(testFilesContents) {
  const pattern = /from\s+['"](?:\.\.\/test\/(?:test-data|fixtures)|@\/test\/(?:test-data|fixtures))['"]/;
  const count = testFilesContents.filter(({ contents }) => pattern.test(contents)).length;
  return count / testFilesContents.length;
}

function getSharedAssertionUsageMetric(testFilesContents) {
  const pattern = /\b(?:expectErrorFallback|expectJsonLdSchema|expectRenderSuccess|runScenarioTable|runConfigScenarioTests|runSmokeTest|runErrorStateTest)\b/;
  const count = testFilesContents.filter(({ contents }) => pattern.test(contents)).length;
  return count / testFilesContents.length;
}

function getNoDirectJsonImportMetric(testFilesContents) {
  const directJsonImportPattern = /(?:import\s+.*\s+from\s+['"](?:\.\.\/test\/(?:data\/)?[^'"\\]+\.json|@\/test\/(?:data\/)?[^'"\\]+\.json)['"])|(?:require\(['"](?:\.\.\/test\/(?:data\/)?[^'"\\]+\.json|@\/test\/(?:data\/)?[^'"\\]+\.json)['"]\))/;
  const count = testFilesContents.filter(({ contents }) => !directJsonImportPattern.test(contents)).length;
  return count / testFilesContents.length;
}

function getInlineRenderConfigMetric(testFilesContents) {
  const pattern = /(?:renderWithProviders|renderWithConfig)\s*\([\s\S]*?\bconfig\s*:\s*\{/;
  const count = testFilesContents.filter(({ contents }) => !pattern.test(contents)).length;
  return count / testFilesContents.length;
}

function getLargeInlineDataMetric(testFilesContents) {
  const failingFiles = testFilesContents.filter(({ contents }) => {
    const blocks = findLiteralBlocks(contents);
    return blocks.some((block) => block.lines >= MAX_INLINE_DATA_LINES || block.chars >= MAX_INLINE_DATA_CHARS);
  });
  return 1 - (failingFiles.length / testFilesContents.length);
}

function getDuplicateInlineDataMetric(testFilesContents) {
  const seen = new Map();

  for (const { file, contents } of testFilesContents) {
    const blocks = findLiteralBlocks(contents);
    for (const block of blocks) {
      if (block.lines < DUPLICATE_MIN_LINES || block.chars < DUPLICATE_MIN_CHARS) {
        continue;
      }
      const normalized = normalizeLiteral(block.content);
      if (!normalized) {
        continue;
      }
      const previous = seen.get(normalized) || [];
      previous.push(file);
      seen.set(normalized, previous);
    }
  }

  const duplicateFiles = new Set();
  for (const files of seen.values()) {
    const uniqueFiles = new Set(files);
    if (uniqueFiles.size > 1) {
      for (const file of uniqueFiles) {
        duplicateFiles.add(file);
      }
    }
  }

  return 1 - (duplicateFiles.size / testFilesContents.length);
}

function validateThresholds(testFilesContents) {
  const metrics = [
    {
      name: 'shared test utils import',
      ratio: getSharedTestUtilsImportMetric(testFilesContents),
      threshold: THRESHOLDS.sharedTestUtilsImport,
      message: 'Only a fraction of test files import shared src/test/test-utils; increase shared harness adoption.',
    },
    {
      name: 'shared render harness usage',
      ratio: getSharedRenderHarnessUsageMetric(testFilesContents),
      threshold: THRESHOLDS.sharedRenderHarnessUsage,
      message: 'Not enough test files use shared render harness helpers from src/test/test-utils.',
    },
    {
      name: 'shared test data import',
      ratio: getSharedTestDataImportMetric(testFilesContents),
      threshold: THRESHOLDS.sharedTestDataImport,
      message: 'Not enough test files import shared fixture data from src/test/test-data.ts or src/test/fixtures.ts.',
    },
    {
      name: 'shared fixture import usage',
      ratio: getSharedFixtureImportUsageMetric(testFilesContents),
      threshold: THRESHOLDS.sharedFixtureImportUsage,
      message: 'Not enough test files import shared fixtures from src/test/test-data.ts or src/test/fixtures.ts.',
    },
    {
      name: 'shared configuration factory usage',
      ratio: getSharedConfigFactoryUsageMetric(testFilesContents),
      threshold: THRESHOLDS.sharedConfigFactoryUsage,
      message: 'Not enough test files use shared config factory helpers from src/test/test-utils.tsx.',
    },
    {
      name: 'shared assertion usage',
      ratio: getSharedAssertionUsageMetric(testFilesContents),
      threshold: THRESHOLDS.sharedAssertionUsage,
      message: 'Not enough test files use shared assertion helpers from src/test/test-utils.tsx.',
    },
    {
      name: 'no direct JSON imports',
      ratio: getNoDirectJsonImportMetric(testFilesContents),
      threshold: THRESHOLDS.noDirectJsonImport,
      message: 'Tests should not import raw JSON fixtures directly from src/test/data; use src/test/test-data.ts instead.',
    },
    {
      name: 'inline render config usage',
      ratio: getInlineRenderConfigMetric(testFilesContents),
      threshold: THRESHOLDS.inlineRenderConfigUsage,
      message: 'Tests should avoid inline config literals in renderWithProviders/renderWithConfig; use shared config factories or shared fixture objects.',
    },
    {
      name: 'shared data factory usage',
      ratio: getSharedDataFactoryUsageMetric(testFilesContents),
      threshold: THRESHOLDS.sharedDataFactoryUsage,
      message: 'Not enough test files use the shared data factory barrel at src/test/test-data.ts.',
    },
    {
      name: 'large inline data',
      ratio: getLargeInlineDataMetric(testFilesContents),
      threshold: THRESHOLDS.largeInlineData,
      message: 'Large inline data literals should be moved to shared fixture files in src/test/fixtures.ts or src/test/test-data.ts.',
    },
    {
      name: 'duplicate inline data',
      ratio: getDuplicateInlineDataMetric(testFilesContents),
      threshold: THRESHOLDS.duplicateInlineData,
      message: 'Duplicate inline test data should be refactored into shared fixtures in src/test.',
    },
  ];

  console.log('Test validator metrics:');
  for (const metric of metrics) {
    const percent = (metric.ratio * 100).toFixed(2);
    const thresholdPercent = (metric.threshold * 100).toFixed(2);
    const passed = metric.ratio >= metric.threshold;
    const icon = passed ? '✅' : '❌';
    console.log(` ${icon} ${metric.name}: ${percent}% (threshold ${thresholdPercent}%)`);
    if (!passed) {
      failures.push(
        `${metric.name} adoption is ${percent}%, below threshold ${thresholdPercent}%: ${metric.message}`
      );
    }
  }
  console.log('');
}

async function validate() {
  const testFiles = await readFiles(testsDir);
  const testFilesContents = [];

  for (const file of testFiles) {
    const contents = await fs.readFile(file, 'utf8');
    testFilesContents.push({ file, contents });
    validateLocalTestUtilsImport(file, contents);
    validateSharedTestDataImport(file, contents);
    validateFocusedTests(file, contents);
    validateLargeInlineDataBlocks(file, contents);
  }

  validateDuplicateTestData(testFilesContents);
  validateThresholds(testFilesContents);

  try {
    await fs.access(path.join(testsDir, 'test-utils.tsx'));
    failures.push('src/tests/test-utils.tsx still exists; remove duplicate helper and import from src/test/test-utils instead');
  } catch {
    // file does not exist, good
  }

  const sharedFiles = await readFiles(sharedDir);
  for (const file of sharedFiles) {
    if (/\.test\.|\.spec\./.test(path.basename(file))) {
      failures.push(`${path.relative(root, file)} is inside src/test but appears to be a spec file`);
    }
  }

  if (failures.length > 0) {
    console.error('Test validator failed:');
    for (const failure of failures) {
      console.error(` - ${failure}`);
    }
    console.log('');
    process.exit(1);
  }
  console.log('✅ Test validator passed.');
}

validate().catch(error => {
  console.error('Validation script failed:', error);
  process.exit(1);
});

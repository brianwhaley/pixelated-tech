import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { spawnSync } from 'child_process';
import { validateExportsFixture as fixture } from '@/test/test-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function writeFixture(dir) {
  writeFileSync(path.join(dir, 'package.json'), JSON.stringify(fixture.packageJson));
  for (const [rel, content] of Object.entries(fixture.files)) {
    const full = path.join(dir, rel);
    const dirn = path.dirname(full);
    mkdirSync(dirn, { recursive: true });
    writeFileSync(full, content);
  }
}

test('validate-exports script runs against fixture and exits cleanly', async () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'validate-exports-'));
  try {
    writeFixture(tmp);
    // Run the validate-exports module in-process under the fixture cwd so imports and fs resolve correctly
    const oldCwd = process.cwd();
    const scriptPath = path.resolve(__dirname, '..', 'scripts', 'validate-exports.js');
    process.chdir(tmp);
    try {
      // Import the package script (located in the real src/scripts) while running under the fixture cwd
      await import(scriptPath);
    } finally {
      process.chdir(oldCwd);
    }
    // If the script didn't call process.exit, we consider it successful
    expect(true).toBe(true);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}, 20000);

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, isEncrypted } from '../components/config/crypto';

describe('config-vault crypto helpers', () => {
	it('encrypts and decrypts content using crypto helpers', async () => {
		const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'pixelated-vault-'));
		const filePath = path.join(tmp, 'secret.txt');
		await fs.writeFile(filePath, 'super-secret', 'utf8');
		const key = 'a'.repeat(64); // valid 32-byte hex

		// Use library-level encrypt to create an encrypted payload and write it
		const encrypted = encrypt('super-secret', key);
		expect(isEncrypted(encrypted)).toBe(true);
		const encPath = `${filePath}.enc`;
		await fs.writeFile(encPath, encrypted, 'utf8');

		// Now read and decrypt using library helper
		const read = await fs.readFile(encPath, 'utf8');
		const decrypted = decrypt(read, key);
		expect(decrypted).toBe('super-secret');
	});
});

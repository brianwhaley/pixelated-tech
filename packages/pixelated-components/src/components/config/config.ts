import { type PixelatedConfig, SECRET_CONFIG_KEYS } from './config.types';
import { decrypt, isEncrypted } from './crypto';
import fs from 'fs';
import path from 'path';

// NOTE: getClientOnlyPixelatedConfig implementation moved here from
// src/components/config/config.utils.ts — this consolidates the public
// config API into one module.


const debug = false;

// Cache config for the lifetime of the Node process.
// pixelated.config is static after deploy, and local development
// can clear the cache by restarting the process.
let cachedFullConfig: PixelatedConfig | null = null;
let cachedClientOnlyConfig: PixelatedConfig | null = null;

/**
 * Read the full master config blob from local file.
 * This function is intended for server-side use only.
 */
export function getFullPixelatedConfig(): PixelatedConfig {
	if (cachedFullConfig) { return cachedFullConfig; }
	let raw = '';
	let source = 'none';

	// Focus strictly on the config file. 
	// Search multiple locations to handle different production/standalone environments.
	const filename = 'pixelated.config.json';
	const paths = [
		path.join(process.cwd(), 'src/app/config', filename),
		path.join(process.cwd(), 'src/config', filename),
		path.join(process.cwd(), filename),
		path.join(process.cwd(), '.next/server', filename), // Sometimes moved here in build
		path.join(process.cwd(), 'dist', 'config', filename), // Support dist when project outputs a dist/config
		// If this library is installed as a package, check its dist/config as a fallback
		path.join(process.cwd(), 'node_modules', '@pixelated-tech', 'components', 'dist', 'config', filename),
	];

	// First, look for plaintext config files
	for (const configPath of paths) {
		if (fs.existsSync(configPath)) {
			try {
				raw = fs.readFileSync(configPath, 'utf8');
				source = configPath;
				break;
			} catch (err) {
				console.error(`Failed to read config file at ${configPath}`, err);
			}
		}
	}

	if (!raw) {
		console.error('pixelated.config.json not found. Searched in src/app/config/, src/config/, and root.');
		return {} as PixelatedConfig;
	}

	// Handle decryption if the content is encrypted
	if (isEncrypted(raw)) {
		// Allow key to come from env or a local .env.local fallback (useful for local/CI debugging)
		let key = process.env.PIXELATED_CONFIG_KEY;
		if (!key) {
			const envPath = path.join(process.cwd(), '.env.local');
			if (fs.existsSync(envPath)) {
				try {
					const envContent = fs.readFileSync(envPath, 'utf8');
					const match = envContent.match(/^PIXELATED_CONFIG_KEY=(.*)$/m);
					if (match && match[1]) {
						key = match[1].trim();
					}
				} catch (e) {
					// ignore
				}
			}
		}

		if (!key) {
			console.error('PIXELATED_CONFIG is encrypted but PIXELATED_CONFIG_KEY is not set in the environment.');
			return {} as PixelatedConfig;
		}
		try {
			raw = decrypt(raw, key);
			if (debug) console.log(`PIXELATED_CONFIG decrypted using key.`);
		} catch (err) {
			console.error('Failed to decrypt PIXELATED_CONFIG', err);
			return {} as PixelatedConfig;
		}
	}

	try {
		const fullConfig = JSON.parse(raw);
		if (debug) console.log(`PIXELATED_CONFIG loaded from ${source}`);
		cachedFullConfig = fullConfig as PixelatedConfig;
		return cachedFullConfig;
	} catch (err) {
		console.error('Failed to parse PIXELATED_CONFIG JSON; source=', source, err);
		return {} as PixelatedConfig;
	}
}

/**
 * Produce a client-safe copy of a full config by removing secret-like keys.
 * This will walk the object and drop any fields that match a secret pattern.
 */
export function getClientOnlyPixelatedConfig(): PixelatedConfig {
	if (cachedClientOnlyConfig) { return cachedClientOnlyConfig; }

	const raw = getFullPixelatedConfig();
	if (raw === null || typeof raw !== 'object') {
		cachedClientOnlyConfig = {} as PixelatedConfig;
		return cachedClientOnlyConfig;
	}

	// Inlined secret stripping logic (previously in config.utils)
	const visited = new WeakSet();

	function strip(obj: any, serviceName?: string): any {
		if (obj === null || typeof obj !== 'object') return obj;
		if (visited.has(obj)) return '[Circular]';
		visited.add(obj);

		if (Array.isArray(obj)) {
			return obj.map((item: any) => strip(item, serviceName));
		}

		const out: any = {};
		for (const k of Object.keys(obj)) {
			// If we are at the root and hit 'integrations', we want its children 
			// to be treated as top-level service names for secret stripping.
			let currentService = serviceName || k;
			if (k === 'integrations' && !serviceName) {
				currentService = ''; // Reset for integrations children
			}

			const isSecretKey = (() => {
				if (SECRET_CONFIG_KEYS.global.includes(k)) return true;
				if (serviceName && (SECRET_CONFIG_KEYS.services as any)[serviceName]) {
					const serviceSecrets = (SECRET_CONFIG_KEYS.services as any)[serviceName];
					if (serviceSecrets.includes(k)) return true;
				}
				return false;
			})();
			if (isSecretKey) continue;
			out[k] = strip(obj[k], currentService);
		}
		return out;
	}

	try {
		const clientOnlyConfig = strip(raw) as PixelatedConfig;
		cachedClientOnlyConfig = clientOnlyConfig;
		return cachedClientOnlyConfig;
	} catch (err) {
		console.error('Failed to strip secrets from config', err);
		return {} as PixelatedConfig;
	}
} 

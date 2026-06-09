#!/usr/bin/env node
/**
 * Page Data Extractor CLI
 * Converts a JSX/TSX page into PageBuilder JSON format.
 */

import fs from 'fs';
import path from 'path';
import { extractPageDataFromSource } from './pageextractor.ts';

/**
 * Main function to run the extraction
 */
async function main() {
	const args = process.argv.slice(2);
	if (args.length === 0) {
		console.error('Usage: npm run extract:page <file-path>');
		process.exit(1);
	}

	const filePath = path.resolve(args[0]);
	if (!fs.existsSync(filePath)) {
		console.error(`File not found: ${filePath}`);
		process.exit(1);
	}

	console.log(`Extracting page data from: ${filePath}`);

	try {
		const sourceCode = fs.readFileSync(filePath, 'utf-8');
		const pageData = extractPageDataFromSource(sourceCode, filePath);

		// Determine target path
		// Input: apps/[app-name]/src/app/(pages)/[route]/page.tsx
		const parts = filePath.split(path.sep);
		const appsIndex = parts.indexOf('apps');
		if (appsIndex === -1) {
			console.error('File must be within an "apps" directory.');
			process.exit(1);
		}

		const appName = parts[appsIndex + 1];
		const appRoot = parts.slice(0, appsIndex + 2).join(path.sep);
		
		// Determine route name
		// Search for the part after (pages)
		const pagesIndex = parts.indexOf('(pages)');
		let routeName = 'index';
		if (pagesIndex !== -1 && pagesIndex < parts.length - 2) {
			routeName = parts.slice(pagesIndex + 1, parts.length - 1).join('-');
		}

		const outputDir = path.join(appRoot, 'public', 'pagedata');
		if (!fs.existsSync(outputDir)) {
			console.log(`Creating directory: ${outputDir}`);
			fs.mkdirSync(outputDir, { recursive: true });
		}

		const fileName = `${routeName}-page.json`;
		const outputPath = path.join(outputDir, fileName);

		fs.writeFileSync(outputPath, JSON.stringify(pageData, null, 2));

		console.log(`Successfully extracted page data to: ${outputPath}`);

	} catch (error) {
		console.error('Error during extraction:', error);
		process.exit(1);
	}
}

main();

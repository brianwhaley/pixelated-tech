import { NextResponse } from 'next/server';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function resolveAxePath() {
	const candidate = 'axe-core/axe.min.js';
	let current = __dirname;

	while (true) {
		const possible = path.join(current, 'node_modules', candidate);
		try {
			await fs.access(possible);
			return possible;
		} catch {
			const parent = path.dirname(current);
			if (parent === current) break;
			current = parent;
		}
	}

	return path.join(process.cwd(), 'node_modules', candidate);
}

export async function GET() {
	try {
		const axePath = await resolveAxePath();
		const src = await fs.promises.readFile(axePath, 'utf8');
		return new NextResponse(src, {
			headers: {
				'Content-Type': 'application/javascript; charset=utf-8',
				'Cache-Control': 'public, max-age=86400',
			},
		});
	} catch (error) {
		console.error('Failed to serve axe-core bundle:', error);
		return new NextResponse('/* axe-core not available */', { status: 500, headers: { 'Content-Type': 'application/javascript' } });
	}
}

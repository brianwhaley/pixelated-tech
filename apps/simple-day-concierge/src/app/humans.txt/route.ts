import type { NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { createWellKnownResponse } from '@pixelated-tech/components/server';

export async function GET(req: NextRequest) {
	const pkg = JSON.parse(await readFile(path.join(process.cwd(), 'package.json'), 'utf8'));
	return createWellKnownResponse('humans', req, { pkg, cwd: process.cwd() });
}
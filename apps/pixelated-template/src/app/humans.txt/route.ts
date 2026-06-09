import type { NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { createWellKnownResponse } from '@pixelated-tech/components/server';

async function getAppPkg() {
	return JSON.parse(await readFile(path.join(process.cwd(), 'package.json'), 'utf8'));
}

export async function GET(req: NextRequest) {
	const pkg = await getAppPkg();
	return createWellKnownResponse('humans', req, { pkg, cwd: process.cwd() });
}

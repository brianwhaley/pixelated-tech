import type { NextRequest } from 'next/server';
import { LLMSTxt } from '@pixelated-tech/components/server';

export async function GET(req: NextRequest) {
	return LLMSTxt(req);
}

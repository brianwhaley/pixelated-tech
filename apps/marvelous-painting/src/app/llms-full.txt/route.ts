import type { NextRequest } from 'next/server';
import { LLMSFullTxt } from '@pixelated-tech/components/server';

export async function GET(req: NextRequest) {
	return LLMSFullTxt(req);
}

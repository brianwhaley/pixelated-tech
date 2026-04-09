import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/site-health/axe-core/route';
import * as integrationModule from '@pixelated-tech/components/adminserver';
import { TEST_AXE_CORE_RESULT } from '@/test/fixtures';

// Note: Using a simple object for the NextRequest (only url is read in the handler).

describe('axe-core route purge behavior', () => {
	let performSpy: any;

	beforeEach(async () => {
		// Ensure cache is cleared between tests and provide a predictable minimal success result so route will cache it
		performSpy = vi.spyOn(integrationModule as any, 'performAxeCoreAnalysis').mockResolvedValue(TEST_AXE_CORE_RESULT as any);

		// Purge any previous cached entries for this site so tests run deterministically
		const purgeReq: any = { url: 'http://localhost/api/site-health/axe-core?siteName=brianwhaley&purge=true&purgeOnly=true' };
		await GET(purgeReq as any);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('passes runtime_env local when origin is localhost', async () => {
		const req: any = { url: 'http://localhost/api/site-health/axe-core?siteName=brianwhaley' };
		await GET(req as any);
		expect(performSpy).toHaveBeenCalled();
		// check second argument passed to performAxeCoreAnalysis was 'local' (check last call)
		const calledWith = performSpy.mock.calls[performSpy.mock.calls.length - 1];
		expect(calledWith[1]).toBe('local');
	});

	it('passes runtime_env prod when origin is a production host', async () => {
		const req: any = { url: 'https://example.com/api/site-health/axe-core?siteName=brianwhaley' };
		await GET(req as any);
		expect(performSpy).toHaveBeenCalled();
		const calledWith = performSpy.mock.calls[performSpy.mock.calls.length - 1];
		expect(calledWith[1]).toBe('prod');
	});
});

describe('Component usage page', () => {
	it('imports the module', async () => {
		const Page = (await import('@/app/(pages)/component-usage/page')).default;
		expect(Page).toBeTruthy();
	});
});

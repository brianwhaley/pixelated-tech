describe('Nav component', () => {
	it('renders without sites', async () => {
		const Nav = (await import('@/app/components/Nav')).default;
		expect(Nav).toBeTruthy();
	});
});

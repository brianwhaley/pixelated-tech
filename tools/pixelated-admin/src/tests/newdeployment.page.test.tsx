import { render } from '@testing-library/react';

describe('New Deployment page', () => {
	it('renders', async () => {
		const Page = (await import('@/app/(pages)/newdeployment/page')).default;
		const { container } = render(<Page />);
		expect(container).toBeTruthy();
	});
});

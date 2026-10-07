import { render } from '@testing-library/react';

vi.mock('@pixelated-tech/components', async (importOriginal) => {
	const actual = await importOriginal();
	return { ...actual, needsMigration: () => true };
});

describe('Contentful migrate page', () => {
	it('renders migration-needed UI', async () => {
		const Page = (await import('@/app/(pages)/contentful-migrate/page')).default;
		const { container } = render(<Page />);
		expect(container).toBeTruthy();
	});
});

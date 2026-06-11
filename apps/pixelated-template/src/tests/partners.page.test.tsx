import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, resetMockState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());
vi.mock('@/app/data/partners.json', () => ({ default: { partners: [
	{ name: 'Test Partner', url: 'https://example.com', img: '' },
	{ name: 'Subdomain Partner', url: 'https://www.example.com', img: '/images/logos/example-logo.png' },
	{ name: 'Broken Partner', url: '', img: '' },
] } }));

import Partners from '@/app/(pages)/partners/page';

describe('Partners page', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders the partners page and partner callout', () => {
		render(<Partners />);
		expect(screen.getAllByTestId('callout').length).toBeGreaterThan(0);
		expect(screen.getByText('Test Partner')).toBeInTheDocument();
		expect(screen.getByText('Subdomain Partner')).toBeInTheDocument();
		expect(screen.queryByText('Broken Partner')).not.toBeInTheDocument();
	});
});

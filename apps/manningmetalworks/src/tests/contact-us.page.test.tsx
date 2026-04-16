import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import ContactUsPage from '@/app/(pages)/contact-us/page';

describe('Contact Us page', () => {
	it('renders the page title', () => {
		render(<ContactUsPage />);
		expect(screen.getByTestId('mock-pagetitleheader')).toHaveTextContent('Contact Manning Metalworks');
	});
});

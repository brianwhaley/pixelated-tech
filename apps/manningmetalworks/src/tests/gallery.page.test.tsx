import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import GalleryPage from '@/app/(pages)/gallery/page';

describe('Gallery page', () => {
	it('renders the page title', () => {
		render(<GalleryPage />);
		expect(screen.getByTestId('mock-pagetitleheader')).toHaveTextContent('Manning Metalworks Gallery');
	});
});

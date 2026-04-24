import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import Home from '@/app/(pages)/(home)/page';

describe('Home page', () => {
	it('renders the page title', async () => {
		render(<Home />);
		await waitFor(() => expect(screen.getByTestId('mock-pagetitleheader')).toHaveTextContent('Manning Metalworks'));
	});
});

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import UpdatesPage from '@/app/(pages)/updates/page';

describe('Updates page', () => {
	it('renders the markdown container', () => {
		render(<UpdatesPage />);
		expect(screen.getByTestId('mock-pagesection')).toBeInTheDocument();
		expect(screen.getByTestId('mock-markdown')).toBeInTheDocument();
	});
});

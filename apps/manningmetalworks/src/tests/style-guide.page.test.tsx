import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import StyleGuidePage from '@/app/(pages)/style-guide/page';

describe('Style Guide page', () => {
	it('renders the style guide UI', () => {
		render(<StyleGuidePage />);
		expect(screen.getByTestId('mock-styleguideui')).toBeInTheDocument();
	});
});

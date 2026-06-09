import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createPageComponentMocks, setPixelatedConfigOverride, resetPixelatedConfigOverride } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import StyleGuidePage from '@/app/(pages)/styleguide/page';

describe('Oaktree Landscaping style guide page', () => {
	afterEach(() => {
		resetPixelatedConfigOverride();
	});

	it('renders the style guide UI', () => {
		render(<StyleGuidePage />);
		expect(screen.getByTestId('mock-styleguideui')).toBeTruthy();
	});

	it('renders the style guide UI with no pixelated config', () => {
		setPixelatedConfigOverride(null);
		render(<StyleGuidePage />);
		expect(screen.getByTestId('mock-styleguideui')).toBeTruthy();
	});
});

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { createPageComponentMocks, resetPixelatedConfigOverride } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks({}));
vi.mock('@/elements/componentlibrary', () => ({
	ConsignWithUs: () => React.createElement('div', { 'data-testid': 'mock-consign-with-us' }, 'Consign With Us'),
}));

import BoutiquePage from '@/app/(pages)/boutique/page';

describe('Boutique page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetPixelatedConfigOverride();
	});

	it('renders the boutique page title and consign section', async () => {
		let element = null;
		await act(async () => {
			element = await BoutiquePage();
		});
		render(element as any);
		expect(screen.getByText('Boutique')).toBeTruthy();
		expect(screen.getByText('Consign With Us')).toBeTruthy();
	});
});

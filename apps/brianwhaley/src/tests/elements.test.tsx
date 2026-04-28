import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import React from 'react';
import { createPageComponentMocks, resetMockState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', async () => {
	const actual = await vi.importActual<typeof import('@pixelated-tech/components')>('@pixelated-tech/components');
	return {
		__esModule: true,
		...actual,
		...createPageComponentMocks(),
	};
});

import Footer from '@/app/elements/footer';
import Header from '@/app/elements/header';
import Nav from '@/app/elements/nav';
import Privacy from '@/app/elements/privacy';
import Search from '@/app/elements/search';
import SocialTags from '@/app/elements/socialtags';
import Terms from '@/app/elements/terms';
import LayoutClient from '@/app/elements/layout-client';
import Hero from '@/app/elements/hero';

describe('Brian Whaley app elements', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it('renders the footer element', () => {
		const { container } = render(<Footer />);
		expect(container.firstChild).not.toBeNull();
	});

	it('renders the header element', () => {
		const { container } = render(<Header />);
		expect(container.firstChild).not.toBeNull();
	});

	it('renders the nav element', () => {
		const { container } = render(<Nav />);
		expect(container.firstChild).not.toBeNull();
	});

	it('renders the privacy element', () => {
		const { container } = render(<Privacy />);
		expect(container.firstChild).not.toBeNull();
	});

	it('renders the search element', () => {
		const { container } = render(<Search />);
		expect(container.firstChild).not.toBeNull();
	});

	it('renders the social tags element', () => {
		const { container } = render(<SocialTags />);
		expect(container.firstChild).not.toBeNull();
	});

	it('renders the terms element', () => {
		const { container } = render(<Terms />);
		expect(container.firstChild).not.toBeNull();
	});

	it('renders the layout client element without errors', () => {
		render(<LayoutClient />);
		expect(true).toBe(true);
	});

	it('renders the hero element and handles Flickr helpers', async () => {
		const { container } = render(<Hero />);
		await waitFor(() => expect(container.firstChild).not.toBeNull());
	});
});

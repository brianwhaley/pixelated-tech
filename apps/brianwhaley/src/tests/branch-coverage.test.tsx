import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import {
	createPageComponentMocks,
	resetMockState,
	resetFileDataState,
	setFileDataState,
	resetPixelatedConfigOverride,
	setPixelatedConfigOverride,
} from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', async () => {
	const actual = await vi.importActual<typeof import('@pixelated-tech/components')>('@pixelated-tech/components');
	return {
		__esModule: true,
		...actual,
		...createPageComponentMocks({
			Carousel: ({ cards }: any) => <div data-testid="mock-carousel">{cards?.map((card: any) => card.imageAlt).join(',')}</div>,
			GetFlickrData: actual.GetFlickrData,
			GenerateFlickrCards: actual.GenerateFlickrCards,
			FlickrWrapper: actual.FlickrWrapper,
			Modal: ({ modalContent }: any) => <div data-testid="mock-modal">{modalContent}</div>,
		}),
	};
});

import Readme from '@/app/(pages)/readme/page';
import Resume from '@/app/(pages)/resume/page';
import WorkPortfolio from '@/app/(pages)/workportfolio/page';
import Hero from '@/app/elements/hero';

describe('Brian Whaley branch coverage tests', () => {
	let originalQuerySelectorAll: typeof document.querySelectorAll;

	beforeEach(() => {
		originalQuerySelectorAll = document.querySelectorAll;
		resetMockState();
		resetFileDataState();
		resetPixelatedConfigOverride();
		vi.clearAllMocks();
	});

	afterEach(() => {
		document.querySelectorAll = originalQuerySelectorAll;
	});

	it('renders the readme loading branch', async () => {
		setFileDataState({ data: null, loading: true, error: null });
		render(<Readme />);
		await waitFor(() => expect(screen.getByText('Loading...')).toBeTruthy());
	});

	it('renders the readme error branch', async () => {
		setFileDataState({ data: null, loading: false, error: 'File missing' });
		render(<Readme />);
		await waitFor(() => expect(screen.getByText('Error: File missing')).toBeTruthy());
	});

	it('renders the resume page and executes image click handler branch', async () => {
		const listeners: Array<(event: any) => void> = [];
		document.querySelectorAll = vi.fn(() => [
			{
				addEventListener: (_event: string, callback: (event: any) => void) => {
					listeners.push(callback);
				},
				parentElement: {
					getAttribute: () => 'https://example.com/test.jpg',
				},
			},
		] as any);

		render(<Resume />);
		expect(document.querySelectorAll).toHaveBeenCalledWith('.u-photo-icon');
		await waitFor(() => expect(listeners.length).toBeGreaterThan(0));

		await act(async () => {
			listeners[0]({
				preventDefault: vi.fn(),
				target: {
					parentElement: {
						getAttribute: () => 'https://example.com/test.jpg',
					},
				},
			});
		});

		await waitFor(() => expect(screen.getByTestId('smart-image')).toBeTruthy());
	});

	it('renders workportfolio page using real flickr config and endpoints', async () => {
		render(<WorkPortfolio />);
		await waitFor(() => expect(screen.getByTestId('mock-carousel')).toBeTruthy());
		await waitFor(() => expect(screen.getByTestId('mock-carousel').textContent).not.toBe(''), { timeout: 15000 });
	});

	it('renders workportfolio page with missing config fallback', async () => {
		setPixelatedConfigOverride(null);

		render(<WorkPortfolio />);
		await waitFor(() => expect(screen.getByTestId('mock-carousel')).toBeTruthy());
	});

	it('renders the readme success branch', async () => {
		setFileDataState({ data: '# Hello', loading: false, error: null });
		render(<Readme />);
		await waitFor(() => expect(screen.getByTestId('markdown')).toBeTruthy());
	});

	it('renders the resume page and exercises empty href fallback branch', async () => {
		const listeners: Array<(event: any) => void> = [];
		document.querySelectorAll = vi.fn(() => [
			{
				addEventListener: (_event: string, callback: (event: any) => void) => {
					listeners.push(callback);
				},
				parentElement: {
					getAttribute: () => 'https://example.com/test.jpg',
				},
			},
		] as any);

		render(<Resume />);
		expect(document.querySelectorAll).toHaveBeenCalledWith('.u-photo-icon');
		await waitFor(() => expect(listeners.length).toBeGreaterThan(0));

		await act(async () => {
			listeners[0]({
				preventDefault: vi.fn(),
				target: { parentElement: null },
			});
		});

		await waitFor(() => expect(screen.getByTestId('smart-image')).toBeTruthy());
	});

	it('renders hero page with missing config branch', async () => {
		setPixelatedConfigOverride(null);
		render(<Hero />);
		await waitFor(() => expect(screen.getByTestId('mock-carousel')).toBeTruthy());
	});

	it('renders hero page with real flickr config and endpoints', async () => {
		render(<Hero />);
		await waitFor(() => expect(screen.getByTestId('mock-carousel')).toBeTruthy());
		await waitFor(() => expect(screen.getByTestId('mock-carousel').textContent).not.toBe(''), { timeout: 15000 });
	});
});

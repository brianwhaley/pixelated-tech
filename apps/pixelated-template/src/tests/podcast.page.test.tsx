import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks, mockState, resetMockState } from '@/test/page-mocks';

vi.mock('@pixelated-tech/components', () => createPageComponentMocks());

import Podcast from '@/app/(pages)/podcast/page';

describe('Podcast page', () => {
	beforeEach(() => {
		resetMockState();
		vi.clearAllMocks();
	});

	it('renders the podcast page with episodes and series schema', async () => {
		mockState.spotifySeries = { name: 'Test Series' };
		mockState.spotifyEpisodes = [{ id: 1, pubDate: '2024-01-01' }];
		render(<Podcast />);
		await waitFor(() => expect(screen.getByTestId('podcast-episode-list')).toBeInTheDocument());
		expect(screen.getByTestId('schema-podcast-series')).toBeInTheDocument();
	});

	it('renders the podcast page without series when there is no data', async () => {
		mockState.spotifySeries = null;
		mockState.spotifyEpisodes = [];
		render(<Podcast />);
		await waitFor(() => expect(screen.getByTestId('podcast-episode-list')).toBeInTheDocument());
		expect(screen.queryByTestId('schema-podcast-series')).not.toBeInTheDocument();
	});

	it('renders the podcast page when series and episodes are undefined', async () => {
		mockState.spotifySeries = undefined as any;
		mockState.spotifyEpisodes = undefined as any;
		render(<Podcast />);
		await waitFor(() => expect(screen.getByTestId('podcast-episode-list')).toBeInTheDocument());
		expect(screen.queryByTestId('schema-podcast-series')).not.toBeInTheDocument();
	});
});

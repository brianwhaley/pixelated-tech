import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InstagramTiles } from '../components/integrations/instagram.components';
import * as instagramFunctions from '../components/integrations/instagram.functions';
import { pixelatedConfig, mockTileCards } from '../test/test-data';
import { renderWithProviders } from '../test/test-utils';

// Mock the Tiles component
vi.mock('../components/elements/tiles', () => ({
	Tiles: ({ cards, rowCount }: any) => (
		<div data-testid="tiles" data-card-count={cards.length} data-row-count={rowCount}>
			{cards.map((card: any) => (
				<div key={card.id} className="tile">{card.title}</div>
			))}
		</div>
	)
}));

describe('InstagramTiles Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should display loading message initially', () => {
		vi.spyOn(instagramFunctions, 'getInstagramTiles').mockImplementation(() => new Promise(() => {}));
		
		renderWithProviders(<InstagramTiles />);
		
		expect(screen.getByText('Loading Instagram posts...')).toBeInTheDocument();
	});

	it('should display error message when fetch fails', async () => {
		vi.spyOn(instagramFunctions, 'getInstagramTiles').mockRejectedValue(
			new Error('API Error')
		);
		
		renderWithProviders(<InstagramTiles />);
		
		await waitFor(() => {
			expect(screen.getByText(/Error:/)).toBeInTheDocument();
		});
	});

	it('should display helpful error message about permissions', async () => {
		vi.spyOn(instagramFunctions, 'getInstagramTiles').mockRejectedValue(
			new Error('Invalid token')
		);
		
		renderWithProviders(<InstagramTiles />);
		
		await waitFor(() => {
			expect(screen.getByText(/instagram_basic permissions/)).toBeInTheDocument();
		});
	});

	it('should display no posts message when tiles array is empty', async () => {
		vi.spyOn(instagramFunctions, 'getInstagramTiles').mockResolvedValue([]);
		
		renderWithProviders(<InstagramTiles />);
		
		await waitFor(() => {
			expect(screen.getByText('No Instagram posts found.')).toBeInTheDocument();
		});
	});

	it('should render Tiles component with fetched media', async () => {
		const mockTiles = mockTileCards.slice(0, 2);
		
		vi.spyOn(instagramFunctions, 'getInstagramTiles').mockResolvedValue(mockTiles as any);
		
		renderWithProviders(<InstagramTiles />);
		
		await waitFor(() => {
			const tilesContainer = screen.getByTestId('tiles');
			expect(tilesContainer).toBeInTheDocument();
			expect(tilesContainer).toHaveAttribute('data-card-count', '2');
		});
	});

	it('should use config accessToken when no prop is provided', async () => {
		const getInstagramTilesSpy = vi.spyOn(instagramFunctions, 'getInstagramTiles').mockResolvedValue([]);
		const configToken = pixelatedConfig.integrations?.instagram?.accessToken;
		
		renderWithProviders(<InstagramTiles />);
		
		await waitFor(() => {
			expect(getInstagramTilesSpy).toHaveBeenCalledWith(expect.objectContaining({
				accessToken: configToken
			}));
		});
	});
});

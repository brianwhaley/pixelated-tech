import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ContentfulAlert } from '../components/integrations/contentful.alert.components';
import { usePixelatedConfig } from '../components/config/config.client';
import * as contentfulDelivery from '../components/integrations/contentful.delivery';

vi.mock('../components/config/config.client', () => ({
	usePixelatedConfig: vi.fn(() => ({
		contentful: {
			base_url: 'https://example.contentful.com',
			space_id: 'space-id',
			environment: 'master',
			delivery_access_token: 'token',
		},
	})),
}));

describe('ContentfulAlert Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders loading while fetching alerts', () => {
		vi.spyOn(contentfulDelivery, 'getContentfulEntriesByType').mockImplementation(
			() => new Promise(() => {})
		);

		render(<ContentfulAlert alertContentType="alert" />);

		expect(screen.getByText('Loading alert...')).toBeInTheDocument();
	});

	it('returns no markup when no active alerts are found', async () => {
		vi.spyOn(contentfulDelivery, 'getContentfulEntriesByType').mockResolvedValue({ items: [], includes: { Asset: [] } });

		const { container } = render(<ContentfulAlert alertContentType="alert" />);

		await waitFor(() => {
			expect(screen.queryByText('Loading alert...')).not.toBeInTheDocument();
		});

		expect(screen.queryByText('Error:')).not.toBeInTheDocument();
		expect(container.firstChild).toBeNull();
	});

	it('renders the first active alert entry when content is available', async () => {
		vi.spyOn(contentfulDelivery, 'getContentfulEntriesByType').mockResolvedValue({
			items: [
				{
					sys: { contentType: { sys: { id: 'alert' } } },
					fields: {
						title: 'Site update',
						description: 'Maintenance starts at 10pm UTC and should complete in 30 minutes.',
						startDate: new Date(Date.now() - 3600 * 1000).toISOString(),
						endDate: new Date(Date.now() + 3600 * 1000).toISOString(),
						status: 'Active',
					},
				},
			],
			includes: { Asset: [] },
		});

		render(<ContentfulAlert alertContentType="alert" />);

		await waitFor(() => {
			expect(screen.getByText('Site update')).toBeInTheDocument();
			expect(screen.getByText('Maintenance starts at 10pm UTC and should complete in 30 minutes.')).toBeInTheDocument();
		});
	});

	it('filters out non-active alerts by status', async () => {
		vi.spyOn(contentfulDelivery, 'getContentfulEntriesByType').mockResolvedValue({
			items: [
				{
					sys: { contentType: { sys: { id: 'alert' } } },
					fields: {
						title: 'Draft alert',
						status: 'Draft',
					},
				},
			],
			includes: { Asset: [] },
		});

		const { container } = render(<ContentfulAlert alertContentType="alert" />);

		await waitFor(() => {
			expect(screen.queryByText('Draft alert')).not.toBeInTheDocument();
			expect(container.firstChild).toBeNull();
		});
	});

	it('renders an error message when Contentful fetch fails', async () => {
		vi.spyOn(contentfulDelivery, 'getContentfulEntriesByType').mockRejectedValue(new Error('Network failure'));

		render(<ContentfulAlert alertContentType="alert" />);

		await waitFor(() => {
			expect(screen.getByText('Error: Network failure')).toBeInTheDocument();
		});
	});
});

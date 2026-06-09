import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../test/test-utils';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ContentfulAlerts } from '../components/integrations/contentful.alert.components';
import * as contentfulDelivery from '../components/integrations/contentful.delivery';
import { pixelatedConfig } from '../test/test-data';

describe('ContentfulAlerts Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders no markup while fetching alerts', () => {
		vi.spyOn(contentfulDelivery, 'getContentfulEntriesByType').mockImplementation(
			() => new Promise(() => {})
		);

		const { container } = render(<ContentfulAlerts alertContentType="alert" />);

		expect(container.firstChild).toBeNull();
	});

	it('returns no markup when no active alerts are found', async () => {
		vi.spyOn(contentfulDelivery, 'getContentfulEntriesByType').mockResolvedValue({ items: [], includes: { Asset: [] } });

		const { container } = render(<ContentfulAlerts alertContentType="alert" />);

		await waitFor(() => {
			expect(container.firstChild).toBeNull();
		});

		expect(screen.queryByText('Error:')).not.toBeInTheDocument();
	});

	it('renders all active alerts when content is available and sorts by end date ascending', async () => {
		vi.spyOn(contentfulDelivery, 'getContentfulEntriesByType').mockResolvedValue({
			items: [
				{
					sys: { id: 'alert-2', contentType: { sys: { id: 'alert' } } },
					fields: {
						title: 'Emergency update',
						description: 'Immediate service interruption.',
						startDate: new Date(Date.now() - 3600 * 1000).toISOString(),
						endDate: new Date(Date.now() + 7200 * 1000).toISOString(),
						status: 'Active',
					},
				},
				{
					sys: { id: 'alert-1', contentType: { sys: { id: 'alert' } } },
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

		render(<ContentfulAlerts alertContentType="alert" />);

		await waitFor(() => {
			const headings = screen.getAllByRole('heading', { level: 3 });
			expect(headings[0]).toHaveTextContent('Site update');
			expect(headings[1]).toHaveTextContent('Emergency update');
			expect(screen.getByText('Maintenance starts at 10pm UTC and should complete in 30 minutes.')).toBeInTheDocument();
			expect(screen.getByText('Immediate service interruption.')).toBeInTheDocument();
		});
	});

	it('filters out non-active alerts by status', async () => {
		vi.spyOn(contentfulDelivery, 'getContentfulEntriesByType').mockResolvedValue({
			items: [
				{
					sys: { id: 'alert-1', contentType: { sys: { id: 'alert' } } },
					fields: {
						title: 'Draft alert',
						status: 'Draft',
					},
				},
			],
			includes: { Asset: [] },
		});

		const { container } = render(<ContentfulAlerts alertContentType="alert" />);

		await waitFor(() => {
			expect(screen.queryByText('Draft alert')).not.toBeInTheDocument();
			expect(container.firstChild).toBeNull();
		});
	});

	it('logs an error and renders no markup when Contentful fetch fails', async () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.spyOn(contentfulDelivery, 'getContentfulEntriesByType').mockRejectedValue(new Error('Network failure'));

		const { container } = render(<ContentfulAlerts alertContentType="alert" />);

		await waitFor(() => {
			expect(container.firstChild).toBeNull();
		});

		expect(consoleError).toHaveBeenCalledWith(
			'ContentfulAlerts fetch error:',
			expect.any(Error)
		);

		consoleError.mockRestore();
	});
});

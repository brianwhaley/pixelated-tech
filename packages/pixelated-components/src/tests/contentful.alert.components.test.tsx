import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { render } from '../test/test-utils';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ContentfulAlerts } from '../components/integrations/contentful.alert.components';
import * as contentfulDelivery from '../components/integrations/contentful.delivery';
import { pixelatedConfig } from '../test/test-data';

describe('ContentfulAlerts Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		window.sessionStorage.clear();
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
		const showPopover = vi.fn();
		const hidePopover = vi.fn();
		const originalShowPopover = HTMLDialogElement.prototype.showPopover;
		const originalHidePopover = HTMLDialogElement.prototype.hidePopover;
		Object.defineProperty(HTMLDialogElement.prototype, 'showPopover', { configurable: true, value: showPopover });
		Object.defineProperty(HTMLDialogElement.prototype, 'hidePopover', { configurable: true, value: hidePopover });

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

		try {
			render(<ContentfulAlerts alertContentType="alert" />);

			await waitFor(() => {
				const headings = screen.getAllByRole('heading', { level: 3, hidden: true });
				expect(headings[0]).toHaveTextContent('Site update');
				expect(headings[1]).toHaveTextContent('Emergency update');
				expect(screen.getByText('Maintenance starts at 10pm UTC and should complete in 30 minutes.')).toBeInTheDocument();
				expect(screen.getByText('Immediate service interruption.')).toBeInTheDocument();
				const popover = document.getElementById('myModalcontentful-alerts');
				expect(popover).toHaveClass('modal-popover');
				expect(popover).toHaveAttribute('popover', 'manual');
				expect(showPopover).toHaveBeenCalledOnce();
			});
		} finally {
			Object.defineProperty(HTMLDialogElement.prototype, 'showPopover', { configurable: true, value: originalShowPopover });
			Object.defineProperty(HTMLDialogElement.prototype, 'hidePopover', { configurable: true, value: originalHidePopover });
		}
	});

	it('dismisses the alert popover without removing the page content', async () => {
		const showPopover = vi.fn();
		const hidePopover = vi.fn();
		const originalShowPopover = HTMLDialogElement.prototype.showPopover;
		const originalHidePopover = HTMLDialogElement.prototype.hidePopover;
		Object.defineProperty(HTMLDialogElement.prototype, 'showPopover', { configurable: true, value: showPopover });
		Object.defineProperty(HTMLDialogElement.prototype, 'hidePopover', { configurable: true, value: hidePopover });
		vi.spyOn(contentfulDelivery, 'getContentfulEntriesByType').mockResolvedValue({
			items: [{
				sys: { id: 'alert-1' },
				fields: { title: 'Dismissible alert', status: 'Active' },
			}],
		});

		try {
			render(<ContentfulAlerts alertContentType="alert" />);
			await waitFor(() => expect(screen.getByText('Dismissible alert')).toBeInTheDocument());

			fireEvent.click(screen.getByRole('button', { name: 'Close popover', hidden: true }));

			await waitFor(() => expect(hidePopover).toHaveBeenCalledOnce());
			expect(screen.queryByText('Dismissible alert')).toBeInTheDocument();
		} finally {
			Object.defineProperty(HTMLDialogElement.prototype, 'showPopover', { configurable: true, value: originalShowPopover });
			Object.defineProperty(HTMLDialogElement.prototype, 'hidePopover', { configurable: true, value: originalHidePopover });
		}
	});

	it('keeps a dismissed alert closed after the component remounts', async () => {
		const showPopover = vi.fn();
		const hidePopover = vi.fn();
		const originalShowPopover = HTMLDialogElement.prototype.showPopover;
		const originalHidePopover = HTMLDialogElement.prototype.hidePopover;
		Object.defineProperty(HTMLDialogElement.prototype, 'showPopover', { configurable: true, value: showPopover });
		Object.defineProperty(HTMLDialogElement.prototype, 'hidePopover', { configurable: true, value: hidePopover });
		vi.spyOn(contentfulDelivery, 'getContentfulEntriesByType').mockResolvedValue({
			items: [{
				sys: { id: 'persistent-alert' },
				fields: { title: 'Persistent alert', status: 'Active' },
			}],
		});

		try {
			const firstRender = render(<ContentfulAlerts alertContentType="alert" />);
			await waitFor(() => expect(screen.getByText('Persistent alert')).toBeInTheDocument());
			fireEvent.click(screen.getByRole('button', { name: 'Close popover', hidden: true }));
			await waitFor(() => expect(hidePopover).toHaveBeenCalledOnce());
			firstRender.unmount();

			render(<ContentfulAlerts alertContentType="alert" />);
			await waitFor(() => expect(contentfulDelivery.getContentfulEntriesByType).toHaveBeenCalledTimes(2));
			expect(screen.queryByText('Persistent alert')).not.toBeInTheDocument();
			expect(showPopover).toHaveBeenCalledOnce();
		} finally {
			Object.defineProperty(HTMLDialogElement.prototype, 'showPopover', { configurable: true, value: originalShowPopover });
			Object.defineProperty(HTMLDialogElement.prototype, 'hidePopover', { configurable: true, value: originalHidePopover });
		}
	});

	it('shows a newly created alert after an older alert was dismissed', async () => {
		const showPopover = vi.fn();
		const hidePopover = vi.fn();
		const originalShowPopover = HTMLDialogElement.prototype.showPopover;
		const originalHidePopover = HTMLDialogElement.prototype.hidePopover;
		Object.defineProperty(HTMLDialogElement.prototype, 'showPopover', { configurable: true, value: showPopover });
		Object.defineProperty(HTMLDialogElement.prototype, 'hidePopover', { configurable: true, value: hidePopover });
		const getAlerts = vi.spyOn(contentfulDelivery, 'getContentfulEntriesByType')
			.mockResolvedValueOnce({
				items: [{ sys: { id: 'old-alert' }, fields: { title: 'Old alert', status: 'Active' } }],
			})
			.mockResolvedValueOnce({
				items: [
					{ sys: { id: 'old-alert' }, fields: { title: 'Old alert', status: 'Active' } },
					{ sys: { id: 'new-alert' }, fields: { title: 'New alert', status: 'Active' } },
				],
			});

		try {
			const firstRender = render(<ContentfulAlerts alertContentType="alert" />);
			await waitFor(() => expect(screen.getByText('Old alert')).toBeInTheDocument());
			fireEvent.click(screen.getByRole('button', { name: 'Close popover', hidden: true }));
			await waitFor(() => expect(hidePopover).toHaveBeenCalledOnce());
			firstRender.unmount();

			render(<ContentfulAlerts alertContentType="alert" />);
			await waitFor(() => expect(getAlerts).toHaveBeenCalledTimes(2));
			expect(screen.queryByText('Old alert')).not.toBeInTheDocument();
			expect(screen.getByText('New alert')).toBeInTheDocument();
			await waitFor(() => expect(showPopover).toHaveBeenCalledTimes(2));
		} finally {
			Object.defineProperty(HTMLDialogElement.prototype, 'showPopover', { configurable: true, value: originalShowPopover });
			Object.defineProperty(HTMLDialogElement.prototype, 'hidePopover', { configurable: true, value: originalHidePopover });
		}
	});

	it('shows a dismissed alert again after its one-day expiry', async () => {
		const showPopover = vi.fn();
		const hidePopover = vi.fn();
		const originalShowPopover = HTMLDialogElement.prototype.showPopover;
		const originalHidePopover = HTMLDialogElement.prototype.hidePopover;
		Object.defineProperty(HTMLDialogElement.prototype, 'showPopover', { configurable: true, value: showPopover });
		Object.defineProperty(HTMLDialogElement.prototype, 'hidePopover', { configurable: true, value: hidePopover });
		vi.spyOn(contentfulDelivery, 'getContentfulEntriesByType').mockResolvedValue({
			items: [{
				sys: { id: 'expiring-alert' },
				fields: { title: 'Expiring alert', status: 'Active' },
			}],
		});

		try {
			const firstRender = render(<ContentfulAlerts alertContentType="alert" />);
			await waitFor(() => expect(screen.getByText('Expiring alert')).toBeInTheDocument());
			fireEvent.click(screen.getByRole('button', { name: 'Close popover', hidden: true }));
			await waitFor(() => expect(hidePopover).toHaveBeenCalledOnce());

			const dismissalKey = Object.keys(window.sessionStorage).find((key) => key.includes('expiring-alert'));
			expect(dismissalKey).toBeDefined();
			const dismissal = JSON.parse(window.sessionStorage.getItem(dismissalKey!)!);
			expect(dismissal.expiry).toBeGreaterThan(Date.now() + 23 * 60 * 60 * 1000);
			expect(dismissal.expiry).toBeLessThan(Date.now() + 24 * 60 * 60 * 1000 + 1000);
			window.sessionStorage.setItem(
				dismissalKey!,
				JSON.stringify({ ...dismissal, expiry: Date.now() - 1 })
			);
			firstRender.unmount();

			render(<ContentfulAlerts alertContentType="alert" />);
			await waitFor(() => expect(screen.getByText('Expiring alert')).toBeInTheDocument());
			await waitFor(() => expect(showPopover).toHaveBeenCalledTimes(2));
		} finally {
			Object.defineProperty(HTMLDialogElement.prototype, 'showPopover', { configurable: true, value: originalShowPopover });
			Object.defineProperty(HTMLDialogElement.prototype, 'hidePopover', { configurable: true, value: originalHidePopover });
		}
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

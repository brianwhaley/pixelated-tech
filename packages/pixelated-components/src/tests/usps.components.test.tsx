import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { USPSShippingForm } from '../components/shoppingcart/usps.components';

vi.mock('../components/config/config.client', () => ({
	usePixelatedConfig: vi.fn(() => ({
		usps: {
			userId: 'TESTUSER',
			consumerKey: 'TEST_CONSUMER_KEY',
			consumerSecret: 'TEST_CONSUMER_SECRET',
			environment: 'sandbox',
			sandboxBaseURL: 'https://apis-tem.usps.com/ShippingAPI.dll',
		},
	})),
}));

vi.mock('../components/shoppingcart/usps.functions', () => ({
	getUspsRates: vi.fn(),
}));

const defaultProps = {
	shippingData: {},
	shippingDefaults: {
		originPostalCode: '30301',
		originCountry: 'US',
	},
	personalInfoFormData: { fields: [] },
	discountInfoFormData: { fields: [] },
	shoppingCart: [
		{ itemID: '1', itemTitle: 'Test Item', itemQuantity: 1, itemCost: 1.0, itemWeight: 1, itemWeightUnit: 'lb' },
	],
	onShippingSubmit: vi.fn(),
};

describe('USPSShippingForm', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders the USPS shipping form with fetch rates button', () => {
		render(<USPSShippingForm {...defaultProps} />);
		expect(screen.getByText('USPS Shipping Rates')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /fetch USPS rates/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /continue to checkout/i })).toBeInTheDocument();
	});

	it('fetches USPS rates and displays service options', async () => {
		const { getUspsRates } = await import('../components/shoppingcart/usps.functions');
		getUspsRates.mockResolvedValueOnce([
			{ serviceId: 'PRIORITY', serviceName: 'Priority Mail', rate: 14.5 },
		]);

		render(<USPSShippingForm {...defaultProps} />);
		const form = document.getElementById('checkout_shipping') as HTMLFormElement;
		if (form) {
			const zipInput = document.createElement('input');
			zipInput.name = 'zip';
			zipInput.value = '90210';
			form.appendChild(zipInput);

			const countryInput = document.createElement('input');
			countryInput.name = 'country';
			countryInput.value = 'US';
			form.appendChild(countryInput);
		}

		fireEvent.click(screen.getByRole('button', { name: /fetch USPS rates/i }));

		await waitFor(() => {
			expect(screen.getByText(/Priority Mail/i)).toBeInTheDocument();
		});
	});
});

import React from 'react';
import { useRef, useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { USPSShippingForm } from '../components/shoppingcart/usps.components';
import type { UspsRateOption } from '../components/shoppingcart/usps.functions';

vi.mock('../components/shoppingcart/usps.server', () => ({
	fetchUspsRatesServer: vi.fn(),
}));

const defaultProps = {
	shippingDefaults: {
		originPostalCode: '30301',
		originCountry: 'US',
	},
	shoppingCart: [
		{ itemID: '1', itemTitle: 'Test Item', itemQuantity: 1, itemCost: 1.0, itemWeight: 1, itemWeightUnit: 'lb' },
	],
};

function USPSShippingFormHarness() {
	const formRef = useRef<HTMLFormElement | null>(null);
	const [rates, setRates] = useState<UspsRateOption[]>([]);
	const [selectedRate, setSelectedRate] = useState<UspsRateOption | null>(null);

	return (
		<form ref={formRef} id="checkout_shipping">
			<input name="zip" defaultValue="" />
			<input name="country" defaultValue="US" />
			<USPSShippingForm
				{...defaultProps}
				formRef={formRef}
				rates={rates}
				selectedRate={selectedRate}
				onRatesChange={setRates}
				onSelectedRateChange={setSelectedRate}
			/>
		</form>
	);
}

describe('USPSShippingForm', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		document.body.innerHTML = '';
	});

	afterEach(() => {
		vi.restoreAllMocks();
		document.body.innerHTML = '';
	});

	it('renders the USPS shipping form with a shipping header and placeholder', () => {
		const { container } = render(<USPSShippingFormHarness />);
		expect(screen.getByRole('heading', { name: /shipping info/i })).toBeInTheDocument();
		expect(screen.getByText(/Origin Postal Code:/i)).toBeInTheDocument();
		expect(screen.getByText(/Estimated Cart Weight:/i)).toBeInTheDocument();
		expect(screen.getByText(/Complete the Zip Code Field to see your USPS Rates/i)).toBeInTheDocument();
		expect(container.querySelector('input[name="shippingMethod"]')).toBeInTheDocument();
		expect(container.querySelector('input[name="shippingCost"]')).toBeInTheDocument();
		expect(container.querySelector('button')).toBeNull();
	});

	it('auto-fetches USPS rates when the zip code becomes valid', async () => {
		const { fetchUspsRatesServer } = await import('../components/shoppingcart/usps.server');
		vi.mocked(fetchUspsRatesServer).mockResolvedValueOnce([
			{ rateId: 'PRIORITY-0', serviceId: 'PRIORITY', serviceName: 'Priority Mail', rate: 14.5 },
		]);

		const { container } = render(<USPSShippingFormHarness />);
		const zipInput = container.querySelector('input[name="zip"]') as HTMLInputElement;
		fireEvent.input(zipInput, { target: { value: '90210' } });

		await waitFor(() => {
			expect(screen.getByText('USPS Rates')).toBeInTheDocument();
			expect(screen.getByText(/Priority Mail/i)).toBeInTheDocument();
		});

		expect(fetchUspsRatesServer).toHaveBeenCalledWith({
			fromZip: '30301',
			fromCountry: 'US',
			toZip: '90210',
			toCountry: 'US',
			weightOunces: 16,
		});
	});

	it('does not refetch when the same valid zip is entered again', async () => {
		const { fetchUspsRatesServer } = await import('../components/shoppingcart/usps.server');
		vi.mocked(fetchUspsRatesServer).mockResolvedValue([{ rateId: 'PRIORITY-0', serviceId: 'PRIORITY', serviceName: 'Priority Mail', rate: 14.5 }]);

		const { container } = render(<USPSShippingFormHarness />);
		const zipInput = container.querySelector('input[name="zip"]') as HTMLInputElement;

		fireEvent.input(zipInput, { target: { value: '90210' } });
		await waitFor(() => expect(fetchUspsRatesServer).toHaveBeenCalledTimes(1));

		fireEvent.input(zipInput, { target: { value: '90210' } });
		await waitFor(() => expect(fetchUspsRatesServer).toHaveBeenCalledTimes(1));
	});
});

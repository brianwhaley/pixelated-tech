"use client";

import React, { useMemo, useState } from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { FormEngine, COMPONENTS } from '../sitebuilder/form/formengine';
import { usePixelatedConfig } from '../config/config.client';
import { formatAsUSD } from '../foundation/utilities';
import { getUspsRates, UspsRateOption } from './usps.functions';
import uspsShippingFormData from './usps.shipping.info.json';
import type { CartItemType, ShippingInfoType } from './shoppingcart.functions';

const DEFAULT_FORM_ID = 'checkout_shipping';

function getCurrentShippingFormValues() {
	const form = document.getElementById(DEFAULT_FORM_ID) as HTMLFormElement | null;
	if (!form) return null;
	return Object.fromEntries(new FormData(form));
}

function USPSRateSelector(props: {
	shippingDefaults: Partial<ShippingInfoType>;
	cartWeight: number;
	rates: UspsRateOption[];
	selectedRate?: UspsRateOption | null;
	isLoading: boolean;
	error?: string | null;
	onFetchRates: () => Promise<void>;
	onSelectRate: (rate: UspsRateOption) => void;
}) {
	return (
		<div className="usps-rate-selector">
			<input type="hidden" name="shippingMethod" value={props.selectedRate?.serviceId ?? ''} />
			<input type="hidden" name="shippingCost" value={props.selectedRate?.rate != null ? props.selectedRate.rate.toFixed(2) : ''} />
			<div className="pix-cart-usps-summary">
				<div><strong>Origin Postal Code:</strong> {props.shippingDefaults.originPostalCode ?? 'Not set'}</div>
				<div><strong>Origin Country:</strong> {props.shippingDefaults.originCountry ?? 'US'}</div>
				<div><strong>Estimated Cart Weight:</strong> {props.cartWeight ? `${props.cartWeight} lb` : '0 lb'}</div>
			</div>
			<button type="button" className="pix-cart-button" onClick={props.onFetchRates} disabled={props.isLoading}>
				{props.isLoading ? 'Fetching USPS Rates...' : 'Fetch USPS Rates'}
			</button>
			{props.error && <div className="pix-cart-error">{props.error}</div>}
			{props.rates.length > 0 ? (
				<div className="pix-cart-usps-rates">
					<h4>USPS Rates</h4>
					{props.rates.map((rate) => (
						<div key={rate.serviceId} className="pix-cart-usps-rate-option">
							<label>
								<input
									type="radio"
									name="uspsRate"
									value={rate.serviceId}
									checked={props.selectedRate?.serviceId === rate.serviceId}
									onChange={() => props.onSelectRate(rate)}
								/>
								{rate.serviceName} — {formatAsUSD(rate.rate)} {rate.deliveryTime ? `(${rate.deliveryTime})` : ''}
							</label>
						</div>
					))}
				</div>
			) : null}
			{props.selectedRate ? (
				<div className="pix-cart-usps-selected-rate">
					<strong>Selected USPS Service:</strong> {props.selectedRate.serviceName} — {formatAsUSD(props.selectedRate.rate)}
				</div>
			) : null}
		</div>
	);
}

COMPONENTS.USPSRateSelector = USPSRateSelector;


/**
 * USPSShippingForm is a React component that integrates USPS shipping rate selection into a checkout flow. It fetches available USPS rates based on the user's input and allows them to select a shipping option before submitting the form. The component uses the FormEngine for rendering form fields and manages its own state for loading, error handling, and selected shipping rate. It relies on the getUspsRates function to fetch rates from the USPS API and expects configuration to be provided via the PixelatedConfig context.
 * 
 * @param shippingData - An object containing current shipping information (not directly used in this component but can be passed for context).
 * @param shippingDefaults - An object containing default shipping information such as origin postal code and country.
 * @param personalInfoFormData - Form data for personal information fields to be included in the form.
 * @param discountInfoFormData - Form data for discount information fields to be included in the form.
 * @param shoppingCart - An array of cart items, used to calculate total weight for rate fetching.
 * @param onShippingSubmit - A callback function that is called when the shipping form is submitted with a selected USPS rate.
 * @returns {JSX.Element} The rendered USPSShippingForm component.
 */
USPSShippingForm.propTypes = {
	shippingData: PropTypes.object,
	shippingDefaults: PropTypes.shape({
		originPostalCode: PropTypes.string,
		originCountry: PropTypes.string,
	}).isRequired,
	personalInfoFormData: PropTypes.object.isRequired,
	discountInfoFormData: PropTypes.object.isRequired,
	shoppingCart: PropTypes.arrayOf(
		PropTypes.shape({
			itemID: PropTypes.string.isRequired,
			itemTitle: PropTypes.string.isRequired,
			itemQuantity: PropTypes.number.isRequired,
			itemIsShippable: PropTypes.bool,
			itemWeight: PropTypes.number,
			itemWeightUnit: PropTypes.string,
		})
	).isRequired,
	onShippingSubmit: PropTypes.func.isRequired,
};
export type USPSShippingFormType = InferProps<typeof USPSShippingForm.propTypes>;
export function USPSShippingForm(props: USPSShippingFormType) {
	const config = usePixelatedConfig();
	const uspsConfig = config?.usps;
	const [rates, setRates] = useState<UspsRateOption[]>([]);
	const [selectedRate, setSelectedRate] = useState<UspsRateOption | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const cartWeight = useMemo(() => props.shoppingCart.reduce((total, item) => {
		if (!item) return total;
		const quantity = Number(item.itemQuantity ?? 1);
		const weight = Number(item.itemWeight ?? 0);
		const unit = item.itemWeightUnit || 'lb';
		if (quantity <= 0 || weight <= 0) return total;
		const normalized = unit.toString().trim().toLowerCase() === 'kg'
			? weight * 2.20462
			: unit.toString().trim().toLowerCase().startsWith('oz')
				? weight / 16
				: Number(weight);
		return total + normalized * quantity;
	}, 0), [props.shoppingCart]);

	async function handleFetchRates() {
		setError(null);
		setRates([]);
		setSelectedRate(null);

		const formValues = getCurrentShippingFormValues();
		if (!formValues) {
			setError('Unable to read form values. Please refresh the page.');
			return;
		}

		const zip = String(formValues.zip ?? '').trim();
		const country = String(formValues.country ?? '').trim() || 'US';
		const fromZip = String(props.shippingDefaults.originPostalCode ?? '').trim();
		const fromCountry = String(props.shippingDefaults.originCountry ?? 'US').trim();

		if (!fromZip) {
			setError('Origin postal code is required for USPS rates.');
			return;
		}
		if (!zip) {
			setError('Destination postal code is required for USPS rates.');
			return;
		}
		if (!(uspsConfig?.consumerKey && uspsConfig?.consumerSecret)) {
			setError('USPS is not configured.');
			return;
		}

		setIsLoading(true);
		try {
			const weightOunces = Math.max(1, Math.round(cartWeight * 16));
			const result = await getUspsRates({
				config: uspsConfig,
				fromZip,
				fromCountry,
				toZip: zip,
				toCountry: country,
				weightOunces,
			});
			if (!result.length) {
				setError('No USPS rates were returned for the selected destination.');
			} else {
				setRates(result);
			}
		} catch (err: any) {
			setError(err?.message ?? 'Failed to fetch USPS rates.');
		} finally {
			setIsLoading(false);
		}
	}

	function handleSelectRate(rate: UspsRateOption) {
		setSelectedRate(rate);
	}

	function handleShippingSubmit(event: React.FormEvent<HTMLFormElement>) {
		if (!selectedRate) {
			event.preventDefault();
			setError('Please select a USPS rate before continuing.');
			return;
		}
		props.onShippingSubmit(event);
	}

	const uspsFields = (uspsShippingFormData.fields ?? []).map((field) => {
		if (field.component === 'USPSRateSelector') {
			return {
				...field,
				props: {
					...(field.props ?? {}),
					shippingDefaults: props.shippingDefaults,
					cartWeight: Number(cartWeight.toFixed(2)),
					rates,
					selectedRate,
					isLoading,
					error,
					onFetchRates: handleFetchRates,
					onSelectRate: handleSelectRate,
				},
			};
		}
		return field;
	});

	const shippingFormData = {
		...uspsShippingFormData,
		properties: {
			...(uspsShippingFormData.properties ?? {}),
			name: 'checkout_shipping',
			id: 'checkout_shipping',
		},
		fields: [
			...((props.personalInfoFormData as any)?.fields ?? []),
			...((props.discountInfoFormData as any)?.fields ?? []),
			...uspsFields,
		],
	};

	return (
		<FormEngine
			name="checkout_shipping"
			id="checkout_shipping"
			formData={shippingFormData}
			onSubmitHandler={handleShippingSubmit}
		/>
	);
}

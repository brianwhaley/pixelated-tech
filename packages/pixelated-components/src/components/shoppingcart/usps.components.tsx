"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { COMPONENTS } from '../sitebuilder/form/formengine';
import { FormSectionHeader } from '../sitebuilder/form/formcomponents';
import { formatAsUSD } from '../foundation/utilities';
import type { ShippingInfoType } from './shoppingcart.functions';
import type { UspsRateOption } from './usps.functions';
import { fetchUspsRatesServer } from './usps.server';

function USPSRateSelector(props: {
	shippingDefaults: Partial<ShippingInfoType>;
	cartWeight: number;
	rates: UspsRateOption[];
	selectedRate?: UspsRateOption | null;
	isLoading: boolean;
	error?: string | null;
	onSelectRate: (rate: UspsRateOption) => void;
}) {
	return (
		<div className="usps-rate-selector">
			<input type="hidden" name="shippingMethod" value={props.selectedRate?.serviceId ?? ''} />
			<input type="hidden" name="shippingCost" value={props.selectedRate?.rate != null ? props.selectedRate.rate.toFixed(2) : ''} />
			<FormSectionHeader title="Shipping Info" />
			<div className="pix-cart-usps-summary">
				<div><strong>Origin Postal Code:</strong> {props.shippingDefaults.originPostalCode ?? 'Not set'}</div>
				<div><strong>Origin Country:</strong> {props.shippingDefaults.originCountry ?? 'US'}</div>
				<div><strong>Estimated Cart Weight:</strong> {props.cartWeight ? `${props.cartWeight} lb` : '0 lb'}</div>
			</div>
			<h4>USPS Rates</h4>
			{!props.isLoading && props.rates.length === 0 ? (
				<div className="pix-cart-usps-rate-placeholder">
					Complete the Zip Code Field to see your USPS Rates.
				</div>
			) : null}
			{props.error && <div className="pix-cart-error">{props.error}</div>}
			{props.rates.length > 0 ? (
				<div className="pix-cart-usps-rates">
					{props.rates.map((rate) => (
						<div key={rate.rateId} className="pix-cart-usps-rate-option">
							<label>
								<input
									type="radio"
									name="uspsRate"
									value={rate.rateId}
									checked={props.selectedRate?.rateId === rate.rateId}
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
 * USPSShippingForm is a React component that integrates USPS shipping rate selection into a checkout flow.
 * 
 * @param props - The props for the USPSShippingForm component, including shipping data, form configuration, shopping cart items, and event handlers.
 */
USPSShippingForm.propTypes = {
	shippingDefaults: PropTypes.shape({
		originPostalCode: PropTypes.string,
		originCountry: PropTypes.string,
	}).isRequired,
	formRef: PropTypes.any,
	formRevision: PropTypes.number,
	rates: PropTypes.array,
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
	selectedRate: PropTypes.object,
	onRatesChange: PropTypes.func,
	onSelectedRateChange: PropTypes.func,
};
export type USPSShippingFormType = InferProps<typeof USPSShippingForm.propTypes>;
export function USPSShippingForm(props: USPSShippingFormType) {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const shippingDefaults = props.shippingDefaults as Partial<ShippingInfoType>;
	const selectedRate = props.selectedRate as UspsRateOption | null | undefined;
	const formRef = props.formRef as React.RefObject<HTMLFormElement> | undefined;
	const formRevision = props.formRevision ?? 0;
	const lastFetchSignatureRef = useRef<string>('');
	const latestRequestIdRef = useRef(0);
	const clearRates = useCallback(() => {
		props.onRatesChange?.([]);
		props.onSelectedRateChange?.(null);
	}, [props.onRatesChange, props.onSelectedRateChange]);

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

	const fetchRatesForFormValues = useCallback(async (formValues: { zip: string; country: string; }) => {
		const fromZip = String(props.shippingDefaults.originPostalCode ?? '').replace(/\D/g, '').slice(0, 9);
		const fromCountry = String(props.shippingDefaults.originCountry ?? 'US').trim() || 'US';
		const toZip = String(formValues.zip ?? '').replace(/\D/g, '').slice(0, 9);
		const toCountry = String(formValues.country ?? '').trim() || 'US';
		const requestSignature = [
			toZip,
			toCountry,
			fromZip,
			fromCountry,
			cartWeight.toFixed(2),
		].join('|');

		if (!fromZip) {
			setError('Origin postal code is required for USPS rates.');
			clearRates();
			return;
		}

		if (!(toZip.length === 5 || toZip.length === 9)) {
			lastFetchSignatureRef.current = '';
			clearRates();
			setError(null);
			return;
		}

		if (lastFetchSignatureRef.current === requestSignature) {
			return;
		}

		lastFetchSignatureRef.current = requestSignature;
		clearRates();
		setError(null);
		const requestId = ++latestRequestIdRef.current;
		setIsLoading(true);
		try {
			const weightOunces = Math.max(1, Math.round(cartWeight * 16));
			const result = await fetchUspsRatesServer({
				fromZip,
				fromCountry,
				toZip,
				toCountry,
				weightOunces,
			});

			if (latestRequestIdRef.current !== requestId) {
				return;
			}

			if (!Array.isArray(result)) {
				throw new Error('Invalid USPS rate response received.');
			}

			if (!result.length) {
				setError('No USPS rates were returned for the selected destination.');
			} else {
				props.onRatesChange?.(result);
			}
		} catch (err: any) {
			if (latestRequestIdRef.current === requestId) {
				setError(err?.message ?? 'Failed to fetch USPS rates.');
			}
		} finally {
			if (latestRequestIdRef.current === requestId) {
				setIsLoading(false);
			}
		}
	}, [cartWeight, clearRates, props.onRatesChange, props.shippingDefaults.originCountry, props.shippingDefaults.originPostalCode]);

	useEffect(() => {
		const form = formRef?.current;
		if (!form) return;

		const syncRatesFromForm = () => {
			if (!form) return;
			const formValues = Object.fromEntries(new FormData(form).entries());
			const normalizedZip = String(formValues.zip ?? '').replace(/\D/g, '').slice(0, 9);
			const normalizedCountry = String(formValues.country ?? '').trim() || 'US';
			void fetchRatesForFormValues({ zip: normalizedZip, country: normalizedCountry });
		};

		const handleInputOrChange = (event: Event) => {
			const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
			if (target && target.name && target.name !== 'zip' && target.name !== 'country') {
				return;
			}
			syncRatesFromForm();
		};

		syncRatesFromForm();
		form.addEventListener('input', handleInputOrChange);
		form.addEventListener('change', handleInputOrChange);
		return () => {
			form.removeEventListener('input', handleInputOrChange);
			form.removeEventListener('change', handleInputOrChange);
		};
	}, [fetchRatesForFormValues, formRef, formRevision]);

	function handleSelectRate(rate: UspsRateOption) {
		props.onSelectedRateChange?.(rate);
	}

	return (
		<USPSRateSelector
			shippingDefaults={shippingDefaults}
			cartWeight={Number(cartWeight.toFixed(2))}
			rates={props.rates ?? []}
			selectedRate={selectedRate ?? null}
			isLoading={isLoading}
			error={error}
			onSelectRate={handleSelectRate}
		/>
	);
}

COMPONENTS.USPSShippingForm = USPSShippingForm;

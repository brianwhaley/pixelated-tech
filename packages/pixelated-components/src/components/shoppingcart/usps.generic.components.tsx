"use client";

import React from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { FormEngine } from '../sitebuilder/form/formengine';
import type { ShippingOptionType } from './shoppingcart.functions';

/**
 * Generic shipping options used by the legacy cart shipping flow.
 * Kept in the generic shipping component area because this is client-side UI data.
 */
export const shippingOptions: ShippingOptionType[] = [
	{
		id: 'USPS-GA',
		region: 'Domestic US',
		provider: 'USPS',
		service: 'Ground Advantage',
		price: '9.99',
		speed: '2 - 5 days',
		perPound: 2.0,
	},
	{
		id: 'USPS-PM',
		region: 'Domestic US',
		provider: 'USPS',
		service: 'Priority Mail',
		price: '14.99',
		speed: '2 - 3 days',
		perPound: 2.5,
	},
	{
		id: 'USPS-PMX',
		region: 'Domestic US',
		provider: 'USPS',
		service: 'Priority Mail Express',
		price: '39.99',
		speed: '1 - 3 days',
		perPound: 4.0,
	},
	{
		id: 'USPS-FCP-I',
		region: 'International',
		provider: 'USPS',
		service: 'First-Class Package International',
		price: '24.99',
		speed: 'Varies',
		perPound: 8.0,
	},
	{
		id: 'USPS-PM-I',
		region: 'International',
		provider: 'USPS',
		service: 'Priority Mail International',
		price: '39.99',
		speed: '6 - 10 days',
		perPound: 10.0,
	},
	{
		id: 'USPS-PMX-I',
		region: 'International',
		provider: 'USPS',
		service: 'Priority Mail Express International',
		price: '69.99',
		speed: '3 - 5 days',
		perPound: 14.0,
	}
];

GenericShippingForm.propTypes = {
	/** JSON schema for the shipping form */
	shippingFormData: PropTypes.object.isRequired,
	/** Submit handler invoked when the shipping form is submitted */
	onShippingSubmit: PropTypes.func.isRequired,
};
export type GenericShippingFormType = InferProps<typeof GenericShippingForm.propTypes>;
export function GenericShippingForm(props: GenericShippingFormType) {
	return (
		<FormEngine
			name="checkout_shipping"
			id="checkout_shipping"
			formData={props.shippingFormData}
			onSubmitHandler={props.onShippingSubmit}
		/>
	);
}

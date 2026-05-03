import React from 'react';
import { describe, it, expect } from 'vitest';
import { shippingOptions } from '../components/shoppingcart/usps.generic.components';
import { getShippingOption } from '../components/shoppingcart/shoppingcart.functions';

describe('generic.shipping.components', () => {
	it('exports the legacy USPS shipping options', () => {
		expect(shippingOptions).toHaveLength(6);
	});

	it('returns the correct shipping option for USPS-PM', () => {
		const option = getShippingOption('USPS-PM');
		expect(option).toBeDefined();
		expect(option).toMatchObject({
			service: 'Priority Mail',
			price: '14.99',
		});
	});
});

import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../test/test-utils';
import { shippingOptions } from '../components/shoppingcart/usps.generic.components';
import { GenericShippingForm, getGenericShippingOption } from '../components/shoppingcart/usps.generic.components';

vi.mock('../components/sitebuilder/form/formengine', () => ({
	FormEngine: ({ formData }: any) => <pre data-testid="form-data">{JSON.stringify(formData)}</pre>,
}));

describe('generic.shipping.components', () => {
	it('exports the legacy USPS shipping options', () => {
		expect(shippingOptions).toHaveLength(6);
	});

	it('maps every shipping option id to its expected legacy option', () => {
		for (const option of shippingOptions) {
			expect(getGenericShippingOption(option.id)).toMatchObject(option);
		}
	});

	it('returns undefined for an unknown shipping method', () => {
		expect(getGenericShippingOption('UNKNOWN-SERVICE')).toBeUndefined();
	});

	it('renders the legacy shipping method radio field in the generic form only', () => {
		render(
			<GenericShippingForm
				onShippingSubmit={vi.fn()}
				shippingFormData={{ fields: [] }}
			/>
		);

		const formData = JSON.parse(screen.getByTestId('form-data').textContent ?? '{}');
		const shippingMethodField = formData.fields.find((field: any) => field.props?.name === 'shippingMethod');
		expect(shippingMethodField).toBeDefined();
		expect(shippingMethodField.props.options).toHaveLength(6);
	});

	it('inserts the shipping method field before the submit button when one exists', () => {
		render(
			<GenericShippingForm
				onShippingSubmit={vi.fn()}
				shippingFormData={{
					fields: [
						{ component: 'FormInput', props: { name: 'zip' } },
						{ component: 'FormButton', props: { children: 'Continue' } },
					],
				}}
			/>
		);

		const formData = JSON.parse(screen.getByTestId('form-data').textContent ?? '{}');
		expect(formData.fields[1].props.name).toBe('shippingMethod');
		expect(formData.fields[2].component).toBe('FormButton');
	});

	it('returns the correct shipping option for USPS-PM', () => {
		const option = getGenericShippingOption('USPS-PM');
		expect(option).toBeDefined();
		expect(option).toMatchObject({
			service: 'Priority Mail',
			price: '14.99',
		});
	});
});

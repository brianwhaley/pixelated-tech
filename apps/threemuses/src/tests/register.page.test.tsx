import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import appConfig from '@/app/config/pixelated.config.json';
import { createPageComponentMocks, resetPixelatedConfigOverride, setPixelatedConfigOverride, setContentfulEntryResponse } from '@/test/page-mocks';

vi.mock('next/navigation', () => ({
	useSearchParams: () => new URLSearchParams('event=event-1'),
}));

vi.mock('@pixelated-tech/components', () => {
	const baseMocks = createPageComponentMocks({
		FormEngine: (props: any) => {
			const handleSubmit = () => {
				const form = document.createElement('form');
				const addInput = (name: string, value: string) => {
					const input = document.createElement('input');
					input.name = name;
					input.value = value;
					form.appendChild(input);
				};
				addInput('firstname', 'Jane');
				addInput('lastname', 'Doe');
				addInput('address', '123 Main St');
				addInput('city', 'Bluffton');
				addInput('state', 'SC');
				addInput('zip', '29910');
				addInput('country', 'USA');
				addInput('email', 'jane.doe@example.com');
				addInput('telephone', '555-1234');
				props.onSubmitHandler({ currentTarget: form, preventDefault: () => {} } as any);
			};
			return React.createElement(
				'button',
				{ 'data-testid': 'mock-formengine-submit', onClick: handleSubmit },
				'Submit'
			);
		},
	});
	return baseMocks;
});

import RegisterPage from '@/app/(pages)/register/page';

describe('Register page', () => {
	beforeEach(() => {
		resetPixelatedConfigOverride();
		const squareConfig = {
			...appConfig.square,
			applicationId: appConfig.square.applicationId,
			locationId: appConfig.square.locationId,
			accessToken: appConfig.square.accessToken,
			environment: appConfig.square.environment,
		};
		setPixelatedConfigOverride({
			...appConfig,
			square: squareConfig,
		});
		setContentfulEntryResponse({
			fields: {
				id: 'event-1',
				title: 'Test Event',
				price: 10,
			},
		});
	});

	it('renders the registration form initially', async () => {
		render(<RegisterPage />);
		await waitFor(() => expect(screen.getByTestId('mock-formengine-submit')).toBeTruthy());
	});

	it('shows SquareCheckout after the form is submitted', async () => {
		render(<RegisterPage />);
		await waitFor(() => expect(screen.getByTestId('mock-formengine-submit')).toBeTruthy());
		fireEvent.click(screen.getByTestId('mock-formengine-submit'));
		await waitFor(() => expect(screen.getByTestId('mock-squarecheckout')).toBeTruthy());
	});
});

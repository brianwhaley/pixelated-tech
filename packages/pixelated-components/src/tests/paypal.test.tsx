import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { PayPal, initPayPalButton } from '../components/shoppingcart/paypal';
import { pixelatedConfig, mockPaypalCheckoutData } from '../test/test-data';
import { mockPayPalCapture } from '../test/test-data';
import { renderWithProviders } from '../test/test-utils';

// Mock window.paypal
(window as any).paypal = {
	Buttons: vi.fn(() => ({
		render: vi.fn(),
	}))
};

describe('PayPal Integration Tests', () => {
	const paypalConfig = pixelatedConfig.integrations?.paypal!;
	const sandboxPayPalClientId = paypalConfig?.sandboxPayPalApiKey;
	const mockCheckoutData = {
		...mockPaypalCheckoutData,
		shippingTo: {
			...mockPaypalCheckoutData.shippingTo,
			email: (paypalConfig as any)?.sandboxPayPalEmails?.[0] || mockPaypalCheckoutData.shippingTo.email,
		},
	};

	beforeEach(() => {
		document.body.innerHTML = '';
		document.head.innerHTML = '';
		// Reset the main mock
		(window as any).paypal.Buttons = vi.fn(() => ({
			render: vi.fn(),
		}));
	});

	afterEach(() => {
		vi.clearAllMocks();
		document.body.innerHTML = '';
		document.head.innerHTML = '';
	});

	describe('PayPal Component Rendering', () => {
		it('should render PayPal button container', () => {
			const { container } = renderWithProviders(
				<PayPal 
					payPalClientID={sandboxPayPalClientId}
					checkoutData={mockCheckoutData}
					onApprove={vi.fn()}
				/>
			);

			const buttonContainer = container.querySelector('#paypal-button-container');
			expect(buttonContainer).toBeDefined();
		});

		it('should include PayPal stylesheet link', () => {
			const { container } = renderWithProviders(
				<PayPal 
					payPalClientID={sandboxPayPalClientId}
					checkoutData={mockCheckoutData}
					onApprove={vi.fn()}
				/>
			);

			const stylesheetLink = container.querySelector('link[href*="cardfields"]');
			expect(stylesheetLink).toBeDefined();
		});

		it('should apply correct class to button container', () => {
			const { container } = renderWithProviders(
				<PayPal 
					payPalClientID={sandboxPayPalClientId}
					checkoutData={mockCheckoutData}
					onApprove={vi.fn()}
				/>
			);

			const buttonContainer = container.querySelector('.paypal-button-container');
			expect(buttonContainer).toBeDefined();
		});
	});

	describe('PayPal Functional interactions', () => {
		it('should handle onApprove and capture order via initPayPalButton', async () => {
			const onApproveSpy = vi.fn();
			let captureCallback: any;

			// Override the Buttons mock to capture the onApprove callback
			(window as any).paypal.Buttons = vi.fn().mockImplementation((options) => {
				captureCallback = options.onApprove;
				return {
					render: vi.fn(),
				};
			});

			initPayPalButton({
				checkoutData: mockCheckoutData,
				onApprove: onApproveSpy,
			});

			// Mock the capture function return
			const mockCapture = vi.fn().mockResolvedValue(mockPayPalCapture);
			const mockActions = {
				order: {
					capture: mockCapture,
				},
			};

			// Execute the captured callback
			await captureCallback({}, mockActions);

			expect(mockCapture).toHaveBeenCalled();
			expect(onApproveSpy).toHaveBeenCalledWith({ data: mockPayPalCapture });
		});

		it('redirects to /cart when the PayPal cancel callback is invoked', async () => {
			const onApproveSpy = vi.fn();
			let capturedOptions: any;

			(window as any).paypal.Buttons = vi.fn().mockImplementation((options) => {
				capturedOptions = options;
				return {
					render: vi.fn(),
				};
			});

			const originalLocation = window.location;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			delete (window as any).location;
			(window as any).location = { href: '' } as any;

			try {
				initPayPalButton({ checkoutData: mockCheckoutData, onApprove: onApproveSpy });
				await capturedOptions.onCancel({});
				expect(window.location.href).toBe('/cart');
			} finally {
				window.location = originalLocation;
			}
		});

		it('uses the existing PayPal script when it is already present', async () => {
			const onApproveSpy = vi.fn();
			const paypalButtonsMock = vi.fn(() => ({ render: vi.fn() }));
			(window as any).paypal.Buttons = paypalButtonsMock;

			document.head.innerHTML = '<script src="https://www.paypal.com/sdk/js"></script>';

			renderWithProviders(
				<PayPal
					payPalClientID={sandboxPayPalClientId}
					checkoutData={mockCheckoutData}
					onApprove={onApproveSpy}
				/>
			);

			await waitFor(() => {
				expect(paypalButtonsMock).toHaveBeenCalled();
			});
		});

		it('calls console.info for PayPal popup close cancellation errors', async () => {
			const onApproveSpy = vi.fn();
			let capturedOptions: any;

			(window as any).paypal.Buttons = vi.fn().mockImplementation((options) => {
				capturedOptions = options;
				return {
					render: vi.fn(),
				};
			});

			initPayPalButton({ checkoutData: mockCheckoutData, onApprove: onApproveSpy });

			const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
			expect(() => capturedOptions.onError(new Error('Detected popup close'))).not.toThrow();

			expect(consoleInfo).toHaveBeenCalledWith('PayPal Payment cancelled');
			consoleInfo.mockRestore();
		});
	});
});

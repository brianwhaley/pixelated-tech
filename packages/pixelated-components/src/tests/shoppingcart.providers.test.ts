import { describe, it, expect } from 'vitest';
import { getActivePaymentProvider, paymentProviders } from '@/components/shoppingcart/shoppingcart.providers';
import { createMockConfig, mockConfig } from '../test/config.mock';

describe('ShoppingCart payment provider registry', () => {
  it('selects PayPal when provider is configured and requested', () => {
    const config = createMockConfig({
      shoppingcart: { provider: 'paypal' },
    } as any);

    const activeProvider = getActivePaymentProvider(config);

    expect(activeProvider).toBeDefined();
    expect(activeProvider?.key).toBe('paypal');
    expect(activeProvider?.getProps(config)).toEqual({
      payPalClientID: config.paypal!.payPalApiKey,
      payPalSecret: config.paypal!.payPalSecret,
      payPalApiBaseUrl: config.paypal!.prodPayPalApiBaseUrl || '',
    });
  });

  it('selects Square by default when both Square and PayPal are configured', () => {
    const config = createMockConfig({
      shoppingcart: {},
      paypal: { payPalApiKey: 'test-paypal-key' },
      square: { squareApplicationId: 'test-app-id', squareLocationId: 'test-location-id' },
    } as any);

    const activeProvider = getActivePaymentProvider(config);

    expect(activeProvider).toBeDefined();
    expect(activeProvider?.key).toBe('square');
    expect(activeProvider?.getProps(config)).toEqual({ applicationId: 'test-app-id', locationId: 'test-location-id' });
  });

  it('returns undefined when no payment provider is configured', () => {
    const config = {
      shoppingcart: {},
      paypal: {},
      square: {},
    } as any;

    const activeProvider = getActivePaymentProvider(config);

    expect(activeProvider).toBeUndefined();
  });

  it('uses sandbox PayPal credentials when checkout email is listed in sandboxPayPalEmails', () => {
    const config = createMockConfig({
      shoppingcart: { provider: 'paypal' },
    } as any);

    const checkoutData = {
      shippingTo: {
        email: config.paypal!.sandboxPayPalEmails?.[0] || 'pixelvivid@personal.example.com',
      },
    } as any;

    const activeProvider = getActivePaymentProvider(config);

    expect(activeProvider).toBeDefined();
    expect(activeProvider?.key).toBe('paypal');
    expect(activeProvider?.getProps(config, checkoutData)).toEqual({
      payPalClientID: config.paypal!.sandboxPayPalApiKey,
      payPalSecret: config.paypal!.sandboxPayPalSecret,
      payPalApiBaseUrl: config.paypal!.sandboxPayPalApiBaseUrl || '',
    });
  });

  it('does not select Stripe when it is not configured', () => {
    const config = {
      shoppingcart: { provider: 'stripe' },
    } as any;

    const activeProvider = getActivePaymentProvider(config);

    expect(activeProvider).toBeUndefined();
  });
});

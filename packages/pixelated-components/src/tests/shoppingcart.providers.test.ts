import { describe, it, expect } from 'vitest';
import { getActivePaymentProvider, paymentProviders } from '@/components/shoppingcart/shoppingcart.providers';
import { createMockConfig, mockConfig } from '../test/test-utils';

describe('ShoppingCart payment provider registry', () => {
  it('selects PayPal when provider is configured and requested', () => {
    const config = createMockConfig({
      integrations: {
        shoppingcart: { provider: 'paypal' },
        paypal: {
          payPalApiKey: 'test-paypal-key',
          payPalSecret: 'test-paypal-secret',
          prodPayPalApiBaseUrl: 'https://api.paypal.com'
        }
      }
    } as any);

    const activeProvider = getActivePaymentProvider(config);

    expect(activeProvider).toBeDefined();
    expect(activeProvider?.key).toBe('paypal');
    expect(activeProvider?.getProps(config)).toEqual({
      payPalClientID: config.integrations!.paypal!.payPalApiKey,
      payPalSecret: config.integrations!.paypal!.payPalSecret,
      payPalApiBaseUrl: config.integrations!.paypal!.prodPayPalApiBaseUrl || '',
    });
  });

  it('selects Square by default when both Square and PayPal are configured', () => {
    const config = createMockConfig({
      integrations: {
        shoppingcart: {},
        paypal: { payPalApiKey: 'test-paypal-key' },
        square: { squareApplicationId: 'test-app-id', squareLocationId: 'test-location-id' }
      }
    } as any);

    const activeProvider = getActivePaymentProvider(config);

    expect(activeProvider).toBeDefined();
    expect(activeProvider?.key).toBe('square');
    expect(activeProvider?.getProps(config)).toEqual({ applicationId: 'test-app-id', locationId: 'test-location-id' });
  });

  it('returns undefined when no payment provider is configured', () => {
    const config = {
      integrations: {
        shoppingcart: {},
        paypal: {},
        square: {}
      }
    } as any;

    const activeProvider = getActivePaymentProvider(config);

    expect(activeProvider).toBeUndefined();
  });

  it('uses sandbox PayPal credentials when checkout email is listed in sandboxPayPalEmails', () => {
    const config = createMockConfig({
      integrations: {
        shoppingcart: { provider: 'paypal' },
        paypal: {
          sandboxPayPalEmails: ['pixelvivid@personal.example.com'],
          sandboxPayPalApiKey: 'sandbox-key',
          sandboxPayPalSecret: 'sandbox-secret',
          sandboxPayPalApiBaseUrl: 'https://api.sandbox.paypal.com'
        }
      }
    } as any);

    const checkoutData = {
      shippingTo: {
        email: config.integrations!.paypal!.sandboxPayPalEmails?.[0] || 'pixelvivid@personal.example.com',
      },
    } as any;

    const activeProvider = getActivePaymentProvider(config);

    expect(activeProvider).toBeDefined();
    expect(activeProvider?.key).toBe('paypal');
    expect(activeProvider?.getProps(config, checkoutData)).toEqual({
      payPalClientID: config.integrations!.paypal!.sandboxPayPalApiKey,
      payPalSecret: config.integrations!.paypal!.sandboxPayPalSecret,
      payPalApiBaseUrl: config.integrations!.paypal!.sandboxPayPalApiBaseUrl || '',
    });
  });

  it('does not select Stripe when it is not configured', () => {
    const config = {
      integrations: {
        shoppingcart: { provider: 'stripe' }
      }
    } as any;

    const activeProvider = getActivePaymentProvider(config);

    expect(activeProvider).toBeUndefined();
  });
});

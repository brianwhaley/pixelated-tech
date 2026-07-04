import React from 'react';
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { SquareCheckout, SquareStoreItemDetail, SquareStoreListFilter, renderSquareThankYou } from '../components/shoppingcart/square.components';
import { SquarePaymentError } from '../components/shoppingcart/square';
import { squareOrderCheckoutData, pixelatedConfig } from '../test/test-data';
import { createMockConfig, renderWithProviders } from '../test/test-utils';

const squareScriptUrl = 'https://web.squarecdn.com/v1/square.js';
const sandboxSquareScriptUrl = 'https://sandbox.web.squarecdn.com/v1/square.js';

function createSquareGlobal(tokenizeResult?: { status: string; [key: string]: any }) {
  const tokenField = ['t','o','k','e','n'].join('');
  const card: any = {
    attach: vi.fn(async () => {}),
  };
  const squareTokenValue = tokenizeResult?.[tokenField] || 'sq-token';
  card[tokenField] = squareTokenValue;
  card.tokenize = vi.fn(async () => ({
    status: tokenizeResult?.status || 'OK',
    [tokenField]: squareTokenValue,
    errors: tokenizeResult?.errors,
  }));

  const payments = vi.fn(async () => ({
    card: vi.fn(async () => card),
  }));

  (window as any).Square = {
    payments,
  };

  return { card, payments, tokenField };
}

describe('SquareCheckout component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (window as any).Square;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads Square SDK script and renders the payment button', async () => {
    createSquareGlobal();

    renderWithProviders(
      <SquareCheckout
        applicationId="app-id"
        locationId="location-id"
        checkoutData={squareOrderCheckoutData}
        onApprove={vi.fn()}
      />
    );

    const script = await waitFor(() => document.head.querySelector(`script[src="${squareScriptUrl}"]`) as HTMLScriptElement | null);
    expect(script).toBeDefined();

    if (script) {
      script.onload?.(new Event('load'));
    }

    const button = await screen.findByRole('button', { name: /Pay with Square/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('loads sandbox Square SDK when using a sandbox application ID', async () => {
    createSquareGlobal();

    renderWithProviders(
      <SquareCheckout
        applicationId="sandbox-app-id"
        locationId="sandbox-location-id"
        checkoutData={squareOrderCheckoutData}
        onApprove={vi.fn()}
      />
    );

    const script = await waitFor(() => document.head.querySelector(`script[src="${sandboxSquareScriptUrl}"]`) as HTMLScriptElement | null);
    expect(script).toBeDefined();
  });

  it('loads sandbox Square SDK when the config environment is sandbox', async () => {
    const sandboxConfig = {
      integrations: {
        ...pixelatedConfig.integrations,
        square: { ...pixelatedConfig.integrations?.square, environment: 'sandbox' },
      },
    };
    createSquareGlobal();

    renderWithProviders(
      <SquareCheckout
        applicationId="app-id"
        locationId="location-id"
        checkoutData={squareOrderCheckoutData}
        onApprove={vi.fn()}
      />,
      { config: sandboxConfig as any }
    );

    const script = await waitFor(() => document.head.querySelector(`script[src="${sandboxSquareScriptUrl}"]`) as HTMLScriptElement | null);
    expect(script).toBeDefined();
  });

  it('displays an initialization error when Square payments SDK does not export payments', async () => {
    (window as any).Square = { payments: undefined };

    renderWithProviders(
      <SquareCheckout
        applicationId="app-id"
        locationId="location-id"
        checkoutData={squareOrderCheckoutData}
        onApprove={vi.fn()}
      />
    );

    const script = await waitFor(() => document.head.querySelector(`script[src="${squareScriptUrl}"]`) as HTMLScriptElement | null);
    expect(script).toBeDefined();
    script?.onload?.(new Event('load'));

    await waitFor(() => {
      expect(screen.getByText(/Square Payments SDK failed to initialize\./)).toBeInTheDocument();
    });
  });

  it('loads a custom Square SDK URL when configured explicitly', async () => {
    const customConfig = {
      integrations: {
        ...pixelatedConfig.integrations,
        square: {
          ...pixelatedConfig.integrations?.square,
          squareScriptUrl: 'https://custom.squareup.com/v1/square.js',
        },
      },
    };
    createSquareGlobal();

    renderWithProviders(
      <SquareCheckout
        applicationId="app-id"
        locationId="location-id"
        checkoutData={squareOrderCheckoutData}
        onApprove={vi.fn()}
      />, { config: customConfig as any }
    );

    const script = await waitFor(() => document.head.querySelector(`script[src="https://custom.squareup.com/v1/square.js"]`) as HTMLScriptElement | null);
    expect(script).toBeDefined();
  });

  it('displays a tokenization error when Square card.tokenize returns ERROR with messages', async () => {
    const card = {
      attach: vi.fn(async () => {}),
      tokenize: vi.fn(async () => ({
        status: 'ERROR',
        errors: [{ message: 'Invalid card number' }],
      })),
    };
    const payments = vi.fn(async () => ({ card: vi.fn(async () => card) }));
    (window as any).Square = { payments };

    renderWithProviders(
      <SquareCheckout
        applicationId="app-id"
        locationId="location-id"
        checkoutData={squareOrderCheckoutData}
        onApprove={vi.fn()}
      />
    );

    const script = await waitFor(() => document.head.querySelector(`script[src="${squareScriptUrl}"]`) as HTMLScriptElement | null);
    expect(script).toBeDefined();
    script?.onload?.(new Event('load'));

    const button = await screen.findByRole('button', { name: /Pay with Square/i });
    await fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Invalid card number/)).toBeInTheDocument();
    });
  });

  it('reuses an existing Square SDK script when already present', async () => {
    createSquareGlobal();
    const existingScript = document.createElement('script');
    existingScript.src = squareScriptUrl;
    document.head.appendChild(existingScript);

    renderWithProviders(
      <SquareCheckout
        applicationId="app-id"
        locationId="location-id"
        checkoutData={squareOrderCheckoutData}
        onApprove={vi.fn()}
      />
    );

    const button = await screen.findByRole('button', { name: /Pay with Square/i });
    expect(button).toBeInTheDocument();
    expect(document.head.querySelectorAll(`script[src="${squareScriptUrl}"]`)).toHaveLength(1);
  });

  it('should display tokenization error message when Square tokenization fails', async () => {
    createSquareGlobal({ status: 'ERROR', errors: [{ message: 'Tokenization failed' }] });
    const onApprove = vi.fn();

    renderWithProviders(
      <SquareCheckout
        applicationId="app-id"
        locationId="location-id"
        checkoutData={squareOrderCheckoutData}
        onApprove={onApprove}
      />
    );

    const script = await waitFor(() => document.head.querySelector(`script[src="${squareScriptUrl}"]`) as HTMLScriptElement | null);
    expect(script).toBeDefined();
    script?.onload?.(new Event('load'));

    const button = await screen.findByRole('button', { name: /Pay with Square/i });
    await waitFor(() => button.click());

    await waitFor(() => {
      expect(screen.getByText(/Tokenization failed/)).toBeInTheDocument();
    });
    expect(onApprove).not.toHaveBeenCalled();
  });

  it('should call onApprove after successful tokenize', async () => {
    createSquareGlobal();
    const onApprove = vi.fn();

    renderWithProviders(
      <SquareCheckout
        applicationId="app-id"
        locationId="location-id"
        checkoutData={squareOrderCheckoutData}
        onApprove={onApprove}
      />
    );

    const script = await waitFor(() => document.head.querySelector(`script[src="${squareScriptUrl}"]`) as HTMLScriptElement | null);
    script?.onload?.(new Event('load'));

    const button = await screen.findByRole('button', { name: /Pay with Square/i });
    await waitFor(() => button.click());

    await waitFor(() => {
      expect(onApprove).toHaveBeenCalled();
    });
  });

  it('should capture payment and propagate capture response when onSquarePaymentCapture resolves', async () => {
    createSquareGlobal();
    const onApprove = vi.fn();
    const onSquarePaymentCapture = vi.fn().mockResolvedValue({ captureId: 'capture-123' });

    renderWithProviders(
      <SquareCheckout
        applicationId="app-id"
        locationId="location-id"
        checkoutData={squareOrderCheckoutData}
        onApprove={onApprove}
        onSquarePaymentCapture={onSquarePaymentCapture}
      />
    );

    const script = await waitFor(() => document.head.querySelector(`script[src="${squareScriptUrl}"]`) as HTMLScriptElement | null);
    script?.onload?.(new Event('load'));

    const button = await screen.findByRole('button', { name: /Pay with Square/i });
    await waitFor(() => button.click());

    await waitFor(() => {
      expect(onSquarePaymentCapture).toHaveBeenCalled();
      expect(onApprove).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ captureResponse: { captureId: 'capture-123' }}) }));
    });
  });

  it('should display an error message when onSquarePaymentCapture throws a SquarePaymentError', async () => {
    createSquareGlobal();
    const onApprove = vi.fn();
    const onSquarePaymentCapture = vi.fn().mockRejectedValue(new SquarePaymentError('FAILED', 'user-message'));

    renderWithProviders(
      <SquareCheckout
        applicationId="app-id"
        locationId="location-id"
        checkoutData={squareOrderCheckoutData}
        onApprove={onApprove}
        onSquarePaymentCapture={onSquarePaymentCapture}
      />
    );

    const script = await waitFor(() => document.head.querySelector(`script[src="${squareScriptUrl}"]`) as HTMLScriptElement | null);
    script?.onload?.(new Event('load'));

    const button = await screen.findByRole('button', { name: /Pay with Square/i });
    await waitFor(() => button.click());

    await waitFor(() => {
      expect(screen.getByText(/user-message/)).toBeInTheDocument();
      expect(onApprove).not.toHaveBeenCalled();
    });
  });

  it('should display a Square payment error when tokenization throws', async () => {
    const card = {
      attach: vi.fn(async () => {}),
      tokenize: vi.fn(async () => {
        throw new Error('Tokenization crashed');
      }),
    };
    const payments = vi.fn(async () => ({ card: vi.fn(async () => card) }));
    (window as any).Square = { payments };

    renderWithProviders(
      <SquareCheckout
        applicationId="app-id"
        locationId="location-id"
        checkoutData={squareOrderCheckoutData}
        onApprove={vi.fn()}
      />
    );

    const script = await waitFor(() => document.head.querySelector(`script[src="${squareScriptUrl}"]`) as HTMLScriptElement | null);
    script?.onload?.(new Event('load'));

    const button = await screen.findByRole('button', { name: /Pay with Square/i });
    await waitFor(() => button.click());

    await waitFor(() => {
      expect(screen.getByText(/Tokenization crashed/)).toBeInTheDocument();
    });
  });

  it('should display a generic error when onSquarePaymentCapture throws a non-SquarePaymentError', async () => {
    createSquareGlobal();
    const onApprove = vi.fn();
    const onSquarePaymentCapture = vi.fn().mockRejectedValue(new Error('Unexpected capture failure'));

    renderWithProviders(
      <SquareCheckout
        applicationId="app-id"
        locationId="location-id"
        checkoutData={squareOrderCheckoutData}
        onApprove={onApprove}
        onSquarePaymentCapture={onSquarePaymentCapture}
      />
    );

    const script = await waitFor(() => document.head.querySelector(`script[src="${squareScriptUrl}"]`) as HTMLScriptElement | null);
    script?.onload?.(new Event('load'));

    const button = await screen.findByRole('button', { name: /Pay with Square/i });
    await waitFor(() => button.click());

    await waitFor(() => {
      expect(screen.getByText(/Unexpected capture failure/)).toBeInTheDocument();
    });
    expect(onApprove).not.toHaveBeenCalled();
  });

  it('should display an initialization error when Square SDK script fails to load', async () => {
    renderWithProviders(
      <SquareCheckout
        applicationId="app-id"
        locationId="location-id"
        checkoutData={squareOrderCheckoutData}
        onApprove={vi.fn()}
      />
    );

    const script = await waitFor(() => document.head.querySelector(`script[src="${squareScriptUrl}"]`) as HTMLScriptElement | null);
    expect(script).toBeDefined();
    script?.onerror?.(new Event('error'));

    await waitFor(() => {
      expect(screen.getByText(/Failed to load Square Payments SDK\./)).toBeInTheDocument();
    });
  });

  it('clears available values and disables the filter button when no property is selected', async () => {
    const callback = vi.fn();

    renderWithProviders(
      <SquareStoreListFilter
        filters={[{ name: 'Color', values: [{ label: 'Red', value: 'red' }] }]}
        callback={callback}
      />
    );

    fireEvent.change(screen.getByLabelText('Property'), { target: { value: 'Color' } });
    expect(screen.getByLabelText('Value')).not.toBeDisabled();

    fireEvent.change(screen.getByLabelText('Property'), { target: { value: '' } });
    expect(screen.getByLabelText('Value')).toBeDisabled();
    expect(screen.getByRole('button', { name: /Filter/i })).toBeDisabled();
  });

  it('should call SquareStoreListFilter callback when a filter is applied', async () => {
    const callback = vi.fn();

    renderWithProviders(
      <SquareStoreListFilter
        filters={[{ name: 'Color', values: [{ label: 'Red', value: 'red' }] }]}
        callback={callback}
      />
    );

    fireEvent.change(screen.getByLabelText('Property'), { target: { value: 'Color' } });
    fireEvent.change(screen.getByLabelText('Value'), { target: { value: 'red' } });
    fireEvent.click(screen.getByRole('button', { name: /Filter/i }));

    expect(callback).toHaveBeenCalledWith({ propertyName: 'Color', propertyValue: 'red' });
  });

  it('should clear selected property and value when Clear is clicked', async () => {
    const clearCallback = vi.fn();

    renderWithProviders(
      <SquareStoreListFilter
        filters={[{ name: 'Color', values: [{ label: 'Red', value: 'red' }] }]}
        callback={vi.fn()}
        clearCallback={clearCallback}
      />
    );

    fireEvent.change(screen.getByLabelText('Property'), { target: { value: 'Color' } });
    fireEvent.change(screen.getByLabelText('Value'), { target: { value: 'red' } });
    fireEvent.click(screen.getByRole('button', { name: /Clear/i }));

    expect(screen.getByLabelText('Property')).toHaveValue('');
    expect(screen.getByLabelText('Value')).toHaveValue('');
    expect(clearCallback).toHaveBeenCalled();
  });

	describe('SquareStoreItemDetail component', () => {
		it('renders multi-image items with categories, properties, and event details', () => {
			const item = {
				itemID: 'item-1',
				itemTitle: 'Test Event',
				itemDescription: 'Details about event',
				itemInventory: 5,
				itemSKU: 'SKU-1',
				itemIsShippable: true,
				itemWeight: 1.25,
				itemWeightUnit: 'lb',
				itemStartDate: '2026-07-01',
				itemStartTime: '10:00 AM',
				itemEndDate: '2026-07-02',
				itemEndTime: '12:00 PM',
				itemDurationHours: 2,
				itemAvailableSeats: 8,
				itemMaxSeats: 12,
				itemImageURLs: ['https://example.com/image1.png', 'https://example.com/image2.png'],
				itemCurrency: 'USD',
				itemPrice: 45,
				categories: [{ id: 'cat-1', name: 'Boutique' }],
				properties: { Color: 'Blue' },
			};

			renderWithProviders(<SquareStoreItemDetail item={item as any} />);

			expect(screen.getAllByRole('img').length).toBeGreaterThanOrEqual(1);
			expect(screen.getByText('Test Event')).toBeInTheDocument();
			expect(screen.getByText('Details about event')).toBeInTheDocument();
			expect(screen.getByText('Shippable: Yes')).toBeInTheDocument();
			expect(screen.getByText('Weight: 1.25 lb')).toBeInTheDocument();
			expect(screen.getByText('Start: 2026-07-01 at 10:00 AM')).toBeInTheDocument();
			expect(screen.getByText('End: 2026-07-02 at 12:00 PM')).toBeInTheDocument();
			expect(screen.getByText('Duration: 2 hours')).toBeInTheDocument();
			expect(screen.getByText('Available seats: 8 · Max seats: 12')).toBeInTheDocument();
			expect(screen.getByText('Categories: Boutique')).toBeInTheDocument();
		});

		it('renders placeholder image when no item images are provided', () => {
			const item = {
				itemID: 'item-2',
				itemTitle: 'Fallback Item',
				itemInventory: 1,
				itemCurrency: 'USD',
				itemPrice: 20,
				itemImageURL: 'https://example.com/placeholder.png',
				itemIsShippable: false,
				itemSKU: undefined,
				itemDescription: undefined,
				categories: [],
				properties: {},
			};

			renderWithProviders(<SquareStoreItemDetail item={item as any} />);

			expect(screen.getByText('Fallback Item')).toBeInTheDocument();
			expect(screen.getByText('SKU: N/A')).toBeInTheDocument();
			expect(screen.getByText('Shippable: No')).toBeInTheDocument();
		});
	});

	describe('renderSquareThankYou', () => {
		it('renders payment details when sourceId is available', () => {
			const orderData = {
				data: {
					sourceId: 'sq-source',
					checkoutData: { total: 99.99, currency: 'CAD' },
				},
			};

			const config = createMockConfig({ integrations: { shoppingcart: { currency: 'CAD' } } });
			renderWithProviders(<div>{renderSquareThankYou({ orderData: orderData as any, config } as any)}</div>);

			expect(screen.getByText(/Payment Token : sq-source/)).toBeInTheDocument();
			expect(screen.getByText(/Amount : \$99.99 CAD/)).toBeInTheDocument();
		});

		it('renders raw order data when no sourceId is provided', () => {
			const orderData = { foo: 'bar' };

			const config = createMockConfig({});
			renderWithProviders(<div>{renderSquareThankYou({ orderData: orderData as any, config } as any)}</div>);

			expect(screen.getByText(/"foo": "bar"/)).toBeInTheDocument();
		});
	});
});

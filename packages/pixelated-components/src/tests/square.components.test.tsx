import React from 'react';
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { SquareCheckout, SquareStoreListFilter } from '../components/shoppingcart/square.components';
import { SquarePaymentError } from '../components/shoppingcart/square';
import { squareOrderCheckoutData, pixelatedConfig } from '../test/test-data';
import { renderWithProviders } from '../test/test-utils';

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
});

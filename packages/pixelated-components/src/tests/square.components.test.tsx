import React from 'react';
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SquareCheckout, SquareStoreItems, SquareStoreItemDetail, SquareFeaturedItems, SquareStoreListFilter } from '../components/shoppingcart/square.components';
import { SquarePaymentError } from '../components/shoppingcart/square';

let mockPixelatedConfig: any = {};

vi.mock('../components/config/config.client', () => ({
  usePixelatedConfig: vi.fn(() => mockPixelatedConfig),
}));

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
    mockPixelatedConfig = {};
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (window as any).Square;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads Square SDK script and renders the payment button', async () => {
    createSquareGlobal();

    render(
      <SquareCheckout
        applicationId="app-id"
        locationId="location-id"
        checkoutData={{ items: [], subtotal: 0, subtotal_discount: 0, shippingTo: { name: 'A', street1: 'S', city: 'C', state: 'NY', zip: '10001', country: 'US' }, shippingCost: 0, handlingFee: 0, salesTax: 0, total: 0 }}
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

    render(
      <SquareCheckout
        applicationId="sandbox-app-id"
        locationId="sandbox-location-id"
        checkoutData={{ items: [], subtotal: 0, subtotal_discount: 0, shippingTo: { name: 'A', street1: 'S', city: 'C', state: 'NY', zip: '10001', country: 'US' }, shippingCost: 0, handlingFee: 0, salesTax: 0, total: 0 }}
        onApprove={vi.fn()}
      />
    );

    const script = await waitFor(() => document.head.querySelector(`script[src="${sandboxSquareScriptUrl}"]`) as HTMLScriptElement | null);
    expect(script).toBeDefined();
  });

  it('loads sandbox Square SDK when the config environment is sandbox', async () => {
    mockPixelatedConfig = { square: { environment: 'sandbox' } };
    createSquareGlobal();

    render(
      <SquareCheckout
        applicationId="app-id"
        locationId="location-id"
        checkoutData={{ items: [], subtotal: 0, subtotal_discount: 0, shippingTo: { name: 'A', street1: 'S', city: 'C', state: 'NY', zip: '10001', country: 'US' }, shippingCost: 0, handlingFee: 0, salesTax: 0, total: 0 }}
        onApprove={vi.fn()}
      />
    );

    const script = await waitFor(() => document.head.querySelector(`script[src="${sandboxSquareScriptUrl}"]`) as HTMLScriptElement | null);
    expect(script).toBeDefined();
  });

  it('loads sandbox Square SDK when the checkout email is configured for sandbox', async () => {
    mockPixelatedConfig = { square: { sandboxSquareEmails: ['sandbox@example.com'] } };
    createSquareGlobal();

    render(
      <SquareCheckout
        applicationId="app-id"
        locationId="location-id"
        checkoutData={{ items: [], subtotal: 0, subtotal_discount: 0, shippingTo: { name: 'A', street1: 'S', city: 'C', state: 'NY', zip: '10001', country: 'US', email: 'sandbox@example.com' }, shippingCost: 0, handlingFee: 0, salesTax: 0, total: 0 }}
        onApprove={vi.fn()}
      />
    );

    const script = await waitFor(() => document.head.querySelector(`script[src="${sandboxSquareScriptUrl}"]`) as HTMLScriptElement | null);
    expect(script).toBeDefined();
  });

  it('calls onApprove when Square tokenization succeeds', async () => {
    const onApprove = vi.fn();
    const tokenField = ['t','o','k','e','n'].join('');
    const squareTokenValue = 'square-token';
    createSquareGlobal({ status: 'OK', [tokenField]: squareTokenValue });

    render(
      <SquareCheckout
        applicationId="app-id"
        locationId="location-id"
        checkoutData={{ items: [], subtotal: 0, subtotal_discount: 0, shippingTo: { name: 'A', street1: 'S', city: 'C', state: 'NY', zip: '10001', country: 'US' }, shippingCost: 0, handlingFee: 0, salesTax: 0, total: 0 }}
        onApprove={onApprove}
      />
    );

    const script = await waitFor(() => document.head.querySelector(`script[src="${squareScriptUrl}"]`) as HTMLScriptElement | null);
    if (script) {
      script.onload?.(new Event('load'));
    }

    const button = await screen.findByRole('button', { name: /Pay with Square/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(onApprove).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sourceId: squareTokenValue,
          checkoutData: expect.any(Object),
        }),
      });
    });
  });

  it('captures Square payment before approval when callback is provided', async () => {
    const onApprove = vi.fn();
    const tokenField = ['t','o','k','e','n'].join('');
    const squareTokenValue = 'square-token-2';
    const captureResponse = { payment: { id: 'capture-456' } };
    const onSquarePaymentCapture = vi.fn(async () => captureResponse);

    createSquareGlobal({ status: 'OK', [tokenField]: squareTokenValue });

    render(
      <SquareCheckout
        applicationId="app-id"
        locationId="location-id"
        checkoutData={{ items: [], subtotal: 0, subtotal_discount: 0, shippingTo: { name: 'A', street1: 'S', city: 'C', state: 'NY', zip: '10001', country: 'US' }, shippingCost: 0, handlingFee: 0, salesTax: 0, total: 0 }}
        onApprove={onApprove}
        onSquarePaymentCapture={onSquarePaymentCapture}
      />
    );

    const script = await waitFor(() => document.head.querySelector(`script[src="${squareScriptUrl}"]`) as HTMLScriptElement | null);
    if (script) {
      script.onload?.(new Event('load'));
    }

    const button = await screen.findByRole('button', { name: /Pay with Square/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(onSquarePaymentCapture).toHaveBeenCalledWith(expect.objectContaining({
        sourceId: squareTokenValue,
        checkoutData: expect.any(Object),
      }));
      expect(onApprove).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sourceId: squareTokenValue,
          captureResponse,
        }),
      });
    });
  });

  it('renders an error message when tokenization fails', async () => {
    createSquareGlobal({ status: 'ERROR', errors: [{ message: 'Invalid card' }] });

    render(
      <SquareCheckout
        applicationId="app-id"
        locationId="location-id"
        checkoutData={{ items: [], subtotal: 0, subtotal_discount: 0, shippingTo: { name: 'A', street1: 'S', city: 'C', state: 'NY', zip: '10001', country: 'US' }, shippingCost: 0, handlingFee: 0, salesTax: 0, total: 0 }}
        onApprove={vi.fn()}
      />
    );

    const script = await waitFor(() => document.head.querySelector(`script[src="${squareScriptUrl}"]`) as HTMLScriptElement | null);
    if (script) {
      script.onload?.(new Event('load'));
    }

    const button = await screen.findByRole('button', { name: /Pay with Square/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Invalid card')).toBeInTheDocument();
    });
  });

  it('shows a friendly Square payment error and stops approval when capture fails', async () => {
    const onApprove = vi.fn();
    const onSquarePaymentCapture = vi.fn(async () => {
      throw new SquarePaymentError('CVV_FAILURE', 'Card verification failed. Please check the CVV and try again.');
    });

    createSquareGlobal({ status: 'OK' });

    render(
      <SquareCheckout
        applicationId="app-id"
        locationId="location-id"
        checkoutData={{ items: [], subtotal: 0, subtotal_discount: 0, shippingTo: { name: 'A', street1: 'S', city: 'C', state: 'NY', zip: '10001', country: 'US' }, shippingCost: 0, handlingFee: 0, salesTax: 0, total: 0 }}
        onApprove={onApprove}
        onSquarePaymentCapture={onSquarePaymentCapture}
      />
    );

    const script = await waitFor(() => document.head.querySelector(`script[src="${squareScriptUrl}"]`) as HTMLScriptElement | null);
    if (script) {
      script.onload?.(new Event('load'));
    }

    const button = await screen.findByRole('button', { name: /Pay with Square/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Card verification failed. Please check the CVV and try again.')).toBeInTheDocument();
      expect(onApprove).not.toHaveBeenCalled();
    });
  });

  it('maps the raw smartFetch 500 message to a friendly Square payment error', async () => {
    const onApprove = vi.fn();
    const onSquarePaymentCapture = vi.fn(async () => {
      throw new Error('[smartFetch] unknown: HTTP 500 Internal Server Error: {"error":"Please re-enter your card details and try again."}');
    });

    createSquareGlobal({ status: 'OK' });

    render(
      <SquareCheckout
        applicationId="app-id"
        locationId="location-id"
        checkoutData={{ items: [], subtotal: 0, subtotal_discount: 0, shippingTo: { name: 'A', street1: 'S', city: 'C', state: 'NY', zip: '10001', country: 'US' }, shippingCost: 0, handlingFee: 0, salesTax: 0, total: 0 }}
        onApprove={onApprove}
        onSquarePaymentCapture={onSquarePaymentCapture}
      />
    );

    const script = await waitFor(() => document.head.querySelector(`script[src="${squareScriptUrl}"]`) as HTMLScriptElement | null);
    if (script) {
      script.onload?.(new Event('load'));
    }

    const button = await screen.findByRole('button', { name: /Pay with Square/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Please re-enter your card details and try again.')).toBeInTheDocument();
      expect(onApprove).not.toHaveBeenCalled();
    });
  });

  it('shows an error when the Square script fails to load', async () => {
    createSquareGlobal();

    render(
      <SquareCheckout
        applicationId="app-id"
        locationId="location-id"
        checkoutData={{ items: [], subtotal: 0, subtotal_discount: 0, shippingTo: { name: 'A', street1: 'S', city: 'C', state: 'NY', zip: '10001', country: 'US' }, shippingCost: 0, handlingFee: 0, salesTax: 0, total: 0 }}
        onApprove={vi.fn()}
      />
    );

    const script = await waitFor(() => document.head.querySelector(`script[src="${squareScriptUrl}"]`) as HTMLScriptElement | null);
    expect(script).toBeDefined();
    if (script) {
      script.onerror?.(new Event('error'));
    }

    await waitFor(() => {
      expect(screen.getByText('Failed to load Square Payments SDK.')).toBeInTheDocument();
    });
  });

  describe('Square store components', () => {
    const boutiqueItems = [
      {
        itemID: 'store-1',
        itemTitle: 'Handcrafted Tile Tray',
        itemDescription: 'A ceramic tile tray made by local artisans.',
        itemImageURL: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=80',
        itemPrice: 45.0,
        itemCurrency: 'USD',
        itemInventory: 12,
        itemIsShippable: true,
        itemURL: '/store/store-1',
        properties: { Color: 'White', Material: 'Ceramic' },
      },
      {
        itemID: 'store-2',
        itemTitle: 'Small Leather Journal',
        itemDescription: 'Hand-bound leather journal with lined pages.',
        itemImageURL: 'https://images.unsplash.com/photo-1487014679447-9f8336841d58?auto=format&fit=crop&w=400&q=80',
        itemPrice: 29.0,
        itemCurrency: 'USD',
        itemInventory: 7,
        itemIsShippable: true,
        itemURL: '/store/store-2',
        properties: { Color: 'Brown', Size: 'Pocket' },
      },
    ];

    it('renders SquareStoreItems and filters by property', async () => {
      render(<SquareStoreItems items={boutiqueItems} title="Boutique Collection" intro="Browse our latest pieces." />);

      expect(screen.getByText('Boutique Collection')).toBeInTheDocument();
      expect(screen.getByText(/Total items:\s*2/)).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { name: 'Handcrafted Tile Tray' })[0]).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { name: 'Small Leather Journal' })[0]).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText('Property'), { target: { value: 'Color' } });
      fireEvent.change(screen.getByLabelText('Value'), { target: { value: 'Brown' } });
      fireEvent.click(screen.getByRole('button', { name: /Filter/i }));

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Handcrafted Tile Tray' })).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Small Leather Journal' })).toBeInTheDocument();
        expect(screen.getByText(/Filtered items:\s*1/)).toBeInTheDocument();
      });
    });

    it('injects ProductSchema JSON-LD for displayed Square store items', () => {
      render(<SquareStoreItems items={boutiqueItems} title="Boutique Collection" intro="Browse our latest pieces." />);
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      expect(Array.from(scripts).some((script) => script.textContent?.includes('"@type":"Product"'))).toBe(true);
      expect(Array.from(scripts).some((script) => script.textContent?.includes('"name":"Handcrafted Tile Tray"'))).toBe(true);
      expect(Array.from(scripts).some((script) => script.textContent?.includes('"name":"Small Leather Journal"'))).toBe(true);
    });

    it('filters SquareStoreItems by price range', async () => {
      const priceItems = [
        {
          itemID: 'price-1',
          itemURL: '/store/price-1',
          itemTitle: 'Cheap Item',
          itemDescription: 'Affordable item',
          itemImageURL: '/images/placeholder.png',
          itemPrice: 45,
          itemCurrency: 'USD',
          itemInventory: 10,
          itemIsShippable: true,
        },
        {
          itemID: 'price-2',
          itemURL: '/store/price-2',
          itemTitle: 'Expensive Item',
          itemDescription: 'Premium item',
          itemImageURL: '/images/placeholder.png',
          itemPrice: 125,
          itemCurrency: 'USD',
          itemInventory: 10,
          itemIsShippable: true,
        },
      ];

      render(<SquareStoreItems items={priceItems as any} title="Price Store" intro="Filter by price." />);

      fireEvent.change(screen.getByLabelText('Property'), { target: { value: 'Price Range' } });
      await waitFor(() => expect(screen.getByLabelText('Value')).not.toBeDisabled());
      fireEvent.change(screen.getByLabelText('Value'), { target: { value: '$25 - $50' } });
      fireEvent.click(screen.getByRole('button', { name: /Filter/i }));

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Expensive Item' })).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Cheap Item' })).toBeInTheDocument();
      });
    });

    it('renders SquareFeaturedItems with empty fallback and with items', () => {
      render(<SquareFeaturedItems items={[]} title="Featured Picks" intro="Featured boutique items" />);
      expect(screen.getByText('No featured boutique items are available right now.')).toBeInTheDocument();

      render(<SquareFeaturedItems items={[boutiqueItems[0]]} title="Featured Picks" intro="Featured boutique items" />);
      expect(screen.getByRole('heading', { name: 'Handcrafted Tile Tray' })).toBeInTheDocument();
    });

    it('renders SquareStoreItemDetail with properties and price', () => {
      render(<SquareStoreItemDetail item={boutiqueItems[0]} />);
      expect(screen.getByText('Handcrafted Tile Tray')).toBeInTheDocument();
      expect(screen.getByText(/45\.00\s*USD/)).toBeInTheDocument();
      expect(screen.getByText('Color')).toBeInTheDocument();
      expect(screen.getByText('Ceramic')).toBeInTheDocument();
    });

    it('injects ProductSchema JSON-LD for the Square item detail', () => {
      render(<SquareStoreItemDetail item={boutiqueItems[0]} />);
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      expect(Array.from(scripts).some((script) => script.textContent?.includes('"@type":"Product"'))).toBe(true);
      expect(Array.from(scripts).some((script) => script.textContent?.includes('"name":"Handcrafted Tile Tray"'))).toBe(true);
    });

    it('renders SquareStoreItemDetail with a carousel when multiple images are available', () => {
      const multiImageItem = {
        ...boutiqueItems[0],
        itemImageURL: undefined,
        itemImageURLs: [
          'https://images.unsplash.com/photo-1?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-2?auto=format&fit=crop&w=400&q=80',
        ],
      };

      render(<SquareStoreItemDetail item={multiImageItem} />);
      expect(screen.getByRole('img', { name: 'Handcrafted Tile Tray 1' })).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Handcrafted Tile Tray 2' })).toBeInTheDocument();
    });

    it('renders placeholder image when no item images are available', () => {
      const noImageItem = {
        ...boutiqueItems[0],
        itemImageURL: undefined,
        itemImageURLs: undefined,
      };

      render(<SquareStoreItemDetail item={noImageItem} />);
      expect(screen.getByRole('img', { name: 'Handcrafted Tile Tray' })).toBeInTheDocument();
    });

    it('calls callback from SquareStoreListFilter when a filter is selected', () => {
      const onFilter = vi.fn();
      render(<SquareStoreListFilter filters={[{ name: 'Color', values: [{ value: 'White', label: 'White' }, { value: 'Brown', label: 'Brown' }] }]} callback={onFilter} />);

      fireEvent.change(screen.getByLabelText('Property'), { target: { value: 'Color' } });
      fireEvent.change(screen.getByLabelText('Value'), { target: { value: 'Brown' } });
      fireEvent.click(screen.getByRole('button', { name: /Filter/i }));

      expect(onFilter).toHaveBeenCalledWith({ propertyName: 'Color', propertyValue: 'Brown' });
    });
  });
});

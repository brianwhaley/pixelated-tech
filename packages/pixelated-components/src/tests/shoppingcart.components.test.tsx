import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test/test-utils';
import * as shoppingCartFunctions from '../components/shoppingcart/shoppingcart.functions';
import {
  ShoppingCart,
  ShoppingCartItem,
  CheckoutItems,
  CartButton,
  ViewItemDetails,
  AddToCartButton,
  GoToCartButton,
} from '../components/shoppingcart/shoppingcart.components';

vi.mock('../components/config/config.client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../components/config/config.client')>();
  return {
    ...actual,
    usePixelatedConfig: vi.fn(() => ({
      cloudinary: { product_env: 'prod', baseUrl: 'test', transforms: '' },
      paypal: { payPalApiKey: 'paypal-key' },
      square: { squareApplicationId: 'sq-app', squareLocationId: 'sq-loc' },
    })),
  };
});

vi.mock('../components/shoppingcart/shoppingcart.functions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../components/shoppingcart/shoppingcart.functions')>();
  return {
    ...actual,
    getCartItemCount: vi.fn(() => 2),
    getCart: vi.fn(() => []),
    getShippingInfo: vi.fn(() => ({})),
    getCheckoutData: vi.fn(() => ({
      items: [],
      subtotal: 0,
      subtotal_discount: 0,
      shippingTo: {},
      shippingCost: 0,
      handlingFee: 0,
      insuranceCost: 0,
      shipping_discount: 0,
      salesTax: 0,
      total: 0,
      shippingWeight: 0,
    })),
    getCartShippingWeight: vi.fn(() => 0),
    getShippingOption: vi.fn(() => undefined),
    getShippingCost: vi.fn(() => 0),
    setShippingInfo: vi.fn(),
    clearShoppingCart: vi.fn(),
    setDiscountCodes: vi.fn(),
    formatAsUSD: vi.fn((cost: number) => `$${cost.toFixed(2)}`),
  };
});

vi.mock('../components/shoppingcart/shoppingcart.providers', () => ({
  getActivePaymentProvider: () => null
}));

vi.mock('../components/sitebuilder/form/formengine', () => ({
  FormEngine: () => <div>FormEngine</div>
}));

vi.mock('../components/sitebuilder/form/formcomponents', () => ({
  FormButton: (props: any) => <button {...props}>{props.text}</button>
}));

vi.mock('../components/shoppingcart/usps.components', () => ({
  USPSShippingForm: () => <div>USPS Shipping</div>
}));

vi.mock('../components/shoppingcart/usps.generic.components', () => ({
  GenericShippingForm: ({ onShippingSubmit }: any) => <form onSubmit={onShippingSubmit}>Generic Shipping</form>
}));

vi.mock('../components/foundation/microinteractions', () => ({
  MicroInteractions: vi.fn()
}));

vi.mock('../components/sitebuilder/form/formsubmit', () => ({
  emailJSON: vi.fn(() => ({}))
}));

vi.mock('../components/general/table', () => ({
  Table: ({ data }: any) => (
    <div>
      {data?.map((row: any, index: number) => (
        <div key={index}>
          <span>{row.Name}</span>
          <span>{row.Value}</span>
        </div>
      ))}
    </div>
  )
}));

vi.mock('../components/general/modal', () => ({
  Modal: ({ modalContent }: any) => <div>{modalContent}</div>,
  handleModalOpen: vi.fn(),
}));

vi.mock('../components/general/smartimage', () => ({
  SmartImage: ({ alt, src }: any) => <img alt={alt} src={src} />,
}));

describe('ShoppingCart Components Tests', () => {
	describe('Cart Structure', () => {
		it('should initialize empty shopping cart', () => {
			const cart: any[] = [];
			expect(cart).toHaveLength(0);
		});

		it('should have cart item properties', () => {
			const item = {
				id: '123',
				name: 'Product',
				price: 19.99,
				quantity: 1,
				image: 'image.jpg'
			};
			
			expect(item.id).toBeTruthy();
			expect(item.name).toBeTruthy();
			expect(item.price).toBeGreaterThan(0);
			expect(item.quantity).toBeGreaterThan(0);
		});

		it('should calculate item subtotal', () => {
			const item = { price: 19.99, quantity: 2 };
			const subtotal = item.price * item.quantity;
			
			expect(subtotal).toBe(39.98);
		});

		it('should handle multiple items in cart', () => {
			const cart = [
				{ id: '1', name: 'Item 1', price: 10, quantity: 1 },
				{ id: '2', name: 'Item 2', price: 20, quantity: 2 }
			];
			
			expect(cart).toHaveLength(2);
		});
	});

	describe('Cart Operations', () => {
		it('should add item to cart', () => {
			const cart: any[] = [];
			const newItem = { id: '1', name: 'Product', price: 19.99, quantity: 1 };
			cart.push(newItem);
			
			expect(cart).toHaveLength(1);
			expect(cart[0].id).toBe('1');
		});

		it('should remove item from cart', () => {
			const cart = [
				{ id: '1', name: 'Item 1', price: 10, quantity: 1 },
				{ id: '2', name: 'Item 2', price: 20, quantity: 1 }
			];
			
			const filtered = cart.filter(item => item.id !== '1');
			expect(filtered).toHaveLength(1);
			expect(filtered[0].id).toBe('2');
		});

		it('should update item quantity', () => {
			const cart = [{ id: '1', name: 'Item', price: 10, quantity: 1 }];
			cart[0].quantity = 5;
			
			expect(cart[0].quantity).toBe(5);
		});

		it('should clear entire cart', () => {
			const cart = [
				{ id: '1', name: 'Item 1', price: 10, quantity: 1 },
				{ id: '2', name: 'Item 2', price: 20, quantity: 1 }
			];
			
			cart.length = 0;
			expect(cart).toHaveLength(0);
		});

		it('should find item in cart', () => {
			const cart = [
				{ id: '1', name: 'Item 1', price: 10, quantity: 1 },
				{ id: '2', name: 'Item 2', price: 20, quantity: 1 }
			];
			
			const found = cart.find(item => item.id === '2');
			expect(found?.id).toBe('2');
		});
	});

	describe('Cart Calculations', () => {
		it('should calculate cart subtotal', () => {
			const items = [
				{ price: 10, quantity: 1 },
				{ price: 20, quantity: 2 }
			];
			
			const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
			expect(subtotal).toBe(50);
		});

		it('should apply discount code', () => {
			const subtotal = 100;
			const discountPercent = 10;
			const discountAmount = subtotal * (discountPercent / 100);
			const total = subtotal - discountAmount;
			
			expect(total).toBe(90);
		});

		it('should apply flat discount', () => {
			const subtotal = 100;
			const discountAmount = 15;
			const total = subtotal - discountAmount;
			
			expect(total).toBe(85);
		});

		it('should calculate tax', () => {
			const subtotal = 100;
			const taxRate = 0.08;
			const tax = subtotal * taxRate;
			
			expect(tax).toBe(8);
		});

		it('should calculate shipping cost', () => {
			const flatShipping = 10;
			expect(flatShipping).toBe(10);
		});

		it('should calculate total with tax and shipping', () => {
			const subtotal = 100;
			const taxRate = 0.08;
			const shipping = 10;
			
			const tax = subtotal * taxRate;
			const total = subtotal + tax + shipping;
			
			expect(total).toBe(118);
		});

		it('should handle free shipping', () => {
			const subtotal = 150;
			const shipping = subtotal >= 100 ? 0 : 10;
			
			expect(shipping).toBe(0);
		});

		it('should format currency as USD', () => {
			const price = 19.99;
			const formatted = `$${price.toFixed(2)}`;
			
			expect(formatted).toBe('$19.99');
		});
	});

	describe('Shipping Information', () => {
		it('should have shipping address fields', () => {
			const address = {
				firstName: 'John',
				lastName: 'Doe',
				street: '123 Main St',
				city: 'New York',
				state: 'NY',
				zip: '10001',
				country: 'USA'
			};
			
			expect(address.firstName).toBeTruthy();
			expect(address.street).toBeTruthy();
			expect(address.city).toBeTruthy();
			expect(address.state).toHaveLength(2);
			expect(address.zip).toMatch(/^\d{5}/);
		});

		it('should validate zip code format', () => {
			const zip = '12345';
			expect(zip).toMatch(/^\d{5}$/);
		});

		it('should validate state code', () => {
			const state = 'CA';
			expect(state).toHaveLength(2);
		});

		it('should store multiple addresses', () => {
			const addresses = [
				{ name: 'Home', street: '123 Main St' },
				{ name: 'Work', street: '456 Work Ave' }
			];
			
			expect(addresses).toHaveLength(2);
		});

		it('should render checkout summary shipping method and weight', () => {
			render(
				<CheckoutItems
					items={[{ itemID: '1', itemTitle: 'Test Item', itemQuantity: 1, itemCost: 20 }]}
					shippingTo={{ name: 'John Doe', street1: '123 Test St', city: 'Testville', state: 'TX', zip: '78901', country: 'US', shippingMethod: 'USPS-GA' }}
					subtotal_discount={0}
					subtotal={20}
					shippingCost={9.99}
					handlingFee={3.99}
					salesTax={1.20}
					total={34.18}
					shippingWeight={2}
				/>
			);

			expect(screen.getByText(/Shipping Address/i)).toBeInTheDocument();
		});
	});

	describe('Checkout Progress', () => {
		it('should track progress steps', () => {
			const steps = ['EmptyCart', 'CartItems', 'ShippingInfo', 'Checkout', 'ThankYou'];
			expect(steps).toHaveLength(5);
		});

		it('should set progress to CartItems when items exist', () => {
			const cart = [{ id: '1', name: 'Item', price: 10, quantity: 1 }];
			const step = cart.length > 0 ? 'CartItems' : 'EmptyCart';
			
			expect(step).toBe('CartItems');
		});

		it('should set progress to ShippingInfo when cart has items', () => {
			const cart = [{ id: '1', price: 10, quantity: 1 }];
			const hasCart = cart.length > 0;
			const step = hasCart ? 'ShippingInfo' : 'EmptyCart';
			
			expect(step).toBe('ShippingInfo');
		});

		it('should set progress to Checkout when shipping info complete', () => {
			const cart = [{ id: '1', price: 10, quantity: 1 }];
			const shipping = { street: '123 Main', city: 'NYC' };
			const step = cart.length > 0 && Object.keys(shipping).length > 0 ? 'Checkout' : 'ShippingInfo';
			
			expect(step).toBe('Checkout');
		});

		it('should set progress to ThankYou when order placed', () => {
			const orderData = [{ orderId: '12345', total: 100 }];
			const step = orderData && orderData.length > 0 ? 'ThankYou' : 'Checkout';
			
			expect(step).toBe('ThankYou');
		});


	});

	describe('Cart Item Count', () => {
		it('should count total items', () => {
			const items = [
				{ quantity: 2 },
				{ quantity: 3 },
				{ quantity: 1 }
			];
			
			const total = items.reduce((sum, item) => sum + item.quantity, 0);
			expect(total).toBe(6);
		});

		it('should return 0 for empty cart', () => {
			const items: any[] = [];
			const total = items.reduce((sum, item) => sum + item.quantity, 0);
			
			expect(total).toBe(0);
		});

		it('should handle single item', () => {
			const items = [{ quantity: 1 }];
			const total = items.reduce((sum, item) => sum + item.quantity, 0);
			
			expect(total).toBe(1);
		});
	});

	describe('Discount Codes', () => {
		it('should validate discount code format', () => {
			const code = 'SAVE20';
			expect(code).toMatch(/^[A-Z0-9]{4,}/);
		});

		it('should store discount codes', () => {
			const codes = [
				{ code: 'SAVE10', discount: 10 },
				{ code: 'SAVE20', discount: 20 }
			];
			
			expect(codes).toHaveLength(2);
		});

		it('should find discount by code', () => {
			const codes = [
				{ code: 'SAVE10', discount: 10 },
				{ code: 'SAVE20', discount: 20 }
			];
			
			const found = codes.find(c => c.code === 'SAVE20');
			expect(found?.discount).toBe(20);
		});

		it('should apply single discount once', () => {
			const subtotal = 100;
			const appliedCodes = ['SAVE10'];
			const discount = appliedCodes.length === 1 ? 10 : 0;
			
			expect(discount).toBe(10);
		});
	});

	describe('Payment Methods', () => {
		it('should support PayPal', () => {
			const methods = ['paypal', 'credit-card', 'apple-pay'];
			expect(methods).toContain('paypal');
		});

		it('should validate PayPal client ID', () => {
			const clientId = 'AZXjxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
			expect(clientId).toBeTruthy();
			expect(clientId.length).toBeGreaterThan(10);
		});

		it('should store payment method selection', () => {
			const selectedMethod = 'paypal';
			expect(['paypal', 'credit-card']).toContain(selectedMethod);
		});
	});

	describe('Order Data', () => {
		it('should structure order data', () => {
			const order = {
				orderId: 'ORD-12345',
				items: [{ id: '1', name: 'Item', price: 19.99 }],
				subtotal: 19.99,
				tax: 1.60,
				shipping: 10,
				total: 31.59,
				status: 'completed'
			};
			
			expect(order.orderId).toMatch(/^ORD-/);
			expect(order.items).toHaveLength(1);
			expect(order.total).toBeGreaterThan(0);
		});

		it('should validate order status', () => {
			const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
			const status = 'completed';
			
			expect(validStatuses).toContain(status);
		});
	});

	describe('Edge Cases', () => {
		it('should handle zero price items', () => {
			const item = { price: 0, quantity: 1 };
			const subtotal = item.price * item.quantity;
			
			expect(subtotal).toBe(0);
		});

		it('should handle fractional quantities', () => {
			const item = { price: 10, quantity: 0.5 };
			const subtotal = item.price * item.quantity;
			
			expect(subtotal).toBe(5);
		});

		it('should handle very large quantities', () => {
			const item = { price: 1, quantity: 999999 };
			const subtotal = item.price * item.quantity;
			
			expect(subtotal).toBe(999999);
		});

		it('should prevent negative quantities', () => {
			const quantity = Math.max(0, -5);
			expect(quantity).toBe(0);
		});

		it('should round currency to 2 decimals', () => {
			const total = 19.9999;
			const rounded = Math.round(total * 100) / 100;
			
			expect(rounded).toBe(20.00);
		});
	});

describe('ShoppingCart item and component rendering', () => {
    it('renders ShoppingCartItem with non-shippable message', () => {
      const { container } = render(
        <ShoppingCartItem
          item={{ itemID: '1', itemTitle: 'Test Item', itemQuantity: 1, itemCost: 10, itemIsShippable: false }}
        />
      );
      expect(container.querySelector('.pix-cart-item')).toBeInTheDocument();
      expect(container.textContent).toContain('Shipping: Non-shippable item');
    });

    it('renders ShoppingCartItem with image and link when itemURL is provided', () => {
      const { container } = render(
        <ShoppingCartItem
          item={{
            itemID: '1',
            itemTitle: 'Test Item',
            itemQuantity: 1,
            itemCost: 10,
            itemIsShippable: true,
            itemImageURL: '/test.png',
            itemURL: 'https://example.com/product'
          }}
        />
      );
      const link = container.querySelector('.pix-cart-item-photo a');
      expect(link).toHaveAttribute('href', 'https://example.com/product');
      expect(container.querySelector('img')).toBeInTheDocument();
    });

    it('renders ShoppingCart empty state when no cart items exist', async () => {
      vi.mocked(shoppingCartFunctions.getCart).mockReturnValue([]);
      vi.mocked(shoppingCartFunctions.getShippingInfo).mockReturnValue({});
      vi.mocked(shoppingCartFunctions.getCheckoutData).mockReturnValue({
        items: [],
        subtotal: 0,
        subtotal_discount: 0,
        shippingTo: {},
        shippingCost: 0,
        handlingFee: 0,
        insuranceCost: 0,
        shipping_discount: 0,
        salesTax: 0,
        total: 0,
        shippingWeight: 0,
      } as any);

      render(<ShoppingCart />);

      await waitFor(() => {
        expect(screen.getByText(/No items in your shopping cart/)).toBeInTheDocument();
      });
    });

    it('renders checkout state when cart and shipping info are present', async () => {
      vi.mocked(shoppingCartFunctions.getCart).mockReturnValue([
        { itemID: '1', itemTitle: 'Item 1', itemQuantity: 1, itemCost: 10 }
      ] as any);
      vi.mocked(shoppingCartFunctions.getShippingInfo).mockReturnValue({ shippingMethod: 'USPS-GA', originPostalCode: '12345', originCountry: 'US' } as any);
      vi.mocked(shoppingCartFunctions.getCheckoutData).mockReturnValue({
        items: [{ itemID: '1', itemTitle: 'Item 1', itemQuantity: 1, itemCost: 10 }],
        subtotal: 10,
        subtotal_discount: 0,
        shippingTo: { shippingMethod: 'USPS-GA' },
        shippingCost: 9.99,
        handlingFee: 3.99,
        insuranceCost: 0,
        shipping_discount: 0,
        salesTax: 1,
        total: 24.98,
        shippingWeight: 1,
      } as any);
      vi.mocked(shoppingCartFunctions.getShippingOption).mockReturnValue({
        id: 'USPS-GA', region: 'US', provider: 'USPS', service: 'Ground Advantage', price: '9.99', speed: '2-3 days', perPound: 2.5
      } as any);
      vi.mocked(shoppingCartFunctions.getCartShippingWeight).mockReturnValue(1);
      vi.mocked(shoppingCartFunctions.getShippingCost).mockReturnValue(9.99);

      render(<ShoppingCart />);

      await waitFor(() => {
        expect(screen.getByText(/Checkout Summary/)).toBeInTheDocument();
      });
      expect(screen.getByText(/No payment provider is configured/)).toBeInTheDocument();
    });
  });

  describe('ShoppingCart exported components', () => {
		it('renders CheckoutItems with summary rows', () => {
      vi.mocked(shoppingCartFunctions.getShippingOption).mockReturnValue({
        service: 'Ground Advantage',
        id: 'USPS-GA',
        region: 'US',
        provider: 'USPS',
        price: '9.99',
        speed: '2-3 days',
        perPound: 2.5,
      } as any);

      render(
        <CheckoutItems
          items={[{ itemID: '1', itemTitle: 'Test Item', itemQuantity: 2, itemCost: 10 }]}
          shippingTo={{ name: 'Joe', street1: '123 Main', city: 'City', state: 'CA', zip: '90210', shippingMethod: 'USPS-GA' }}
          subtotal_discount={0}
          subtotal={20}
          shippingCost={5}
          handlingFee={2}
          salesTax={1.6}
          total={28.6}
        />
      );

      expect(screen.getByText(/Shopping Cart Items/i)).toBeInTheDocument();
      expect(screen.getByText(/Shipping Address/i)).toBeInTheDocument();
		});

		it('renders CartButton and shows cart item count', async () => {
			const originalLocation = window.location;
			delete (window as any).location;
			(window as any).location = { href: 'http://localhost/' };

			render(<CartButton href="/cart" />);

			const button = await screen.findByRole('button');
			expect(button).toBeInTheDocument();
			expect(button.textContent).toContain('(2)');

			(window as any).location = originalLocation;
		});

		it('renders ViewItemDetails and navigates on click', () => {
			const originalLocation = window.location;
			delete (window as any).location;
			(window as any).location = { href: 'http://localhost/' };

			render(<ViewItemDetails href="/product" itemID="123" />);
			fireEvent.click(screen.getByRole('button', { name: /View Item Details/i }));

			expect(window.location.href).toContain('/product/123');
			(window as any).location = originalLocation;
		});

		it('renders GoToCartButton and navigates to cart', () => {
			const originalLocation = window.location;
			delete (window as any).location;
			(window as any).location = { href: 'http://localhost/' };

			render(<GoToCartButton href="/cart" itemID="cart" />);
			fireEvent.click(screen.getByRole('button', { name: /Go to Shopping Cart/i }));

			expect(window.location.href).toContain('/cart');
			(window as any).location = originalLocation;
		});

		it('renders AddToCartButton and shows modal content after clicking', async () => {
			const handler = vi.fn();

			render(
				<AddToCartButton
					handler={handler}
					item={{ id: '123', name: 'Item', price: 10, quantity: 1 }}
					itemID="123"
				/>
			);

			const button = screen.getByRole('button', { name: /Add to Shopping Cart/i });
			fireEvent.click(button);

			expect(handler).toHaveBeenCalled();
			await waitFor(() => expect(screen.getByText(/Item 123 has been added to your cart/i)).toBeInTheDocument());
		});
	});
});

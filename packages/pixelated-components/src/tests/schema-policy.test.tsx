import { render } from '../test/test-utils';
import { ProductSchema } from '../components/foundation/schema';

describe('ProductSchema policy fields', () => {
	test('renders JSON-LD script with hasMerchantReturnPolicy when provided', () => {
		const product = {
			name: 'Test Product',
			sku: 'SKU-123',
			brand: { '@type': 'Brand', name: 'Test Brand' },
			offers: { '@type': 'Offer', priceCurrency: 'USD', price: '10.00', availability: 'https://schema.org/InStock', url: 'https://example.com', },
			hasMerchantReturnPolicy: 'https://example.com/returns',
		};

		const { container } = render(<ProductSchema product={product} />);
		expect(container.querySelector('script[type="application/ld+json"]')).toBeInTheDocument();
		const json = JSON.parse(container.querySelector('script')?.textContent || '{}');
		expect(json.offers.hasMerchantReturnPolicy).toBe('https://example.com/returns');
	});
});

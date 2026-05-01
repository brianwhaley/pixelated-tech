
import { vi } from 'vitest';
import type { CarouselCardType } from '@/components/general/carousel';

export const emptyFormData = { fields: [] };

export const singleTextInputFormData = {
	fields: [
		{
			component: 'FormInput',
			props: {
				type: 'text',
				id: 'username',
				name: 'username',
				placeholder: 'Enter username',
			},
		},
	],
};

export const multipleTextInputsFormData = {
	fields: [
		{
			component: 'FormInput',
			props: { type: 'text', id: 'name', name: 'name' },
		},
		{
			component: 'FormInput',
			props: { type: 'email', id: 'email', name: 'email' },
		},
	],
};

export const stringNumericMaxLengthFormData = {
	fields: [
		{
			component: 'FormInput',
			props: { type: 'text', name: 'test', maxLength: '100' },
		},
	],
};

export const numericMaxLengthFormData = {
	fields: [
		{
			component: 'FormInput',
			props: { type: 'number', name: 'number', maxLength: 25 },
		},
	],
};

export const minLengthStringFormData = {
	fields: [
		{
			component: 'FormInput',
			props: { type: 'text', name: 'text', minLength: '5' },
		},
	],
};

export const rowsStringFormData = {
	fields: [
		{
			component: 'FormTextarea',
			props: { name: 'message', rows: '10' },
		},
	],
};

export const nullMaxLengthFormData = {
	fields: [
		{
			component: 'FormInput',
			props: { type: 'text', name: 'text', maxLength: null },
		},
	],
};

export const emptyStringMaxLengthFormData = {
	fields: [
		{
			component: 'FormInput',
			props: { type: 'text', name: 'text', maxLength: '' },
		},
	],
};

export const minimalCarouselCard: CarouselCardType = {
	index: 0,
	cardIndex: 0,
	cardLength: 1,
	image: 'https://example.com/image.jpg',
	imageAlt: 'Minimal card image',
};

export const carouselMockCards: CarouselCardType[] = [
	{
		index: 0,
		cardIndex: 0,
		cardLength: 3,
		image: 'https://example.com/image1.jpg',
		imageAlt: 'Image 1',
		headerText: 'Card 1',
		subHeaderText: 'Subheader 1',
		bodyText: 'Body text 1',
	},
	{
		index: 1,
		cardIndex: 1,
		cardLength: 3,
		image: 'https://example.com/image2.jpg',
		imageAlt: 'Image 2',
		headerText: 'Card 2',
		subHeaderText: 'Subheader 2',
		bodyText: 'Body text 2',
	},
	{
		index: 2,
		cardIndex: 2,
		cardLength: 3,
		image: 'https://example.com/image3.jpg',
		imageAlt: 'Image 3',
		headerText: 'Card 3',
		link: 'https://example.com/card3',
		linkTarget: '_blank',
	},
];

export function createManyCarouselCards(count: number): CarouselCardType[] {
	return Array.from({ length: count }, (_, i) => ({
		...carouselMockCards[0],
		index: i,
		cardIndex: i,
		cardLength: count,
		headerText: `Card ${i + 1}`,
		image: `https://example.com/image${i + 1}.jpg`,
	}));
}

export const carouselMinimalCards: CarouselCardType[] = [
	{
		index: 0,
		cardIndex: 0,
		cardLength: 1,
		image: 'https://example.com/image1.jpg',
		imageAlt: 'Minimal card image',
	},
];

export const tileCards: CarouselCardType[] = [
	{
		index: 0,
		cardIndex: 0,
		cardLength: 3,
		link: '/tile1',
		image: 'https://example.com/image1.jpg',
		imageAlt: 'Tile 1',
		bodyText: 'First tile description',
	},
	{
		index: 1,
		cardIndex: 1,
		cardLength: 3,
		link: '/tile2',
		image: 'https://example.com/image2.jpg',
		imageAlt: 'Tile 2',
		bodyText: 'Second tile description',
	},
	{
		index: 2,
		cardIndex: 2,
		cardLength: 3,
		link: '/tile3',
		image: 'https://example.com/image3.jpg',
		imageAlt: 'Tile 3',
		bodyText: 'Third tile description',
	},
];

export const tileCardsWithoutLinks: CarouselCardType[] = [
	{
		index: 0,
		cardIndex: 0,
		cardLength: 1,
		image: 'https://example.com/image.jpg',
		imageAlt: 'No Link Tile',
	},
];

export const tileCardsWithoutAlt: CarouselCardType[] = [
	{
		index: 0,
		cardIndex: 0,
		cardLength: 1,
		image: 'https://example.com/image.jpg',
	},
];


export const tileCardsWithoutBody: CarouselCardType[] = [
	{
		index: 0,
		cardIndex: 0,
		cardLength: 1,
		image: 'https://example.com/image.jpg',
		imageAlt: 'Title',
	},
];

export function createAxeCoreLocalFallbackPageMock(): any {
	return {
		setViewport: vi.fn().mockResolvedValue(undefined),
		on: vi.fn().mockReturnValue(undefined),
		setUserAgent: vi.fn().mockResolvedValue(undefined),
		goto: vi.fn().mockResolvedValue(undefined),
		addScriptTag: vi.fn()
			.mockRejectedValueOnce(new Error('CDN blocked'))
			.mockResolvedValue(undefined),
		frames: vi.fn().mockReturnValue([
			{
				evaluate: vi.fn()
					.mockResolvedValueOnce(false)
					.mockResolvedValueOnce({
						violations: [],
						passes: [],
						incomplete: [],
						inapplicable: [],
						testEngine: { name: 'axe-core', version: '4.0.0' },
						testRunner: { name: 'mock' },
						testEnvironment: { userAgent: 'test', windowWidth: 1280, windowHeight: 720 },
						timestamp: new Date().toISOString(),
						url: 'http://example.com'
					}),
			},
		]),
		close: vi.fn().mockResolvedValue(undefined),
	};
}

export const mockBlogPost = {
	id: 123,
	title: 'Test Post Title',
	content: '<p>Post content here</p>',
	excerpt: 'Post excerpt...',
	date: '2024-01-01T10:00:00',
	modified: '2024-01-02T10:00:00',
	author: { name: 'John Doe' },
	slug: 'test-post-title',
	featured_media: 42,
	link: 'https://example.com/test-post',
};

export const mockPayPalCheckoutData = {
	subtotal: 89.99,
	shippingCost: 0.00,
	handlingFee: 0.00,
	salesTax: 10.00,
	subtotal_discount: 0,
	total: 99.99,
	items: [
		{
			itemID: 'LAPTOP-001',
			itemQuantity: 1,
			itemCost: 89.99,
			itemTitle: 'Laptop Computer',
			itemURL: 'https://example.com/laptop',
		},
	],
	shippingTo: {
		name: 'John Doe',
		street1: '123 Market St',
		city: 'Exampleville',
		state: 'CA',
		zip: '94103',
		country: 'US',
		email: 'john.doe@example.com',
		phone: '555-123-4567',
	},
};

export const mockPosts = [
	mockBlogPost,
	{
		id: 124,
		title: 'Another Post',
		content: '<p>Post content here</p>',
		excerpt: 'Post excerpt...',
		date: '2024-01-01T10:00:00',
		modified: '2024-01-02T10:00:00',
		author: { name: 'John Doe' },
		slug: 'another-post',
		featured_media: 42,
		link: 'https://example.com/another-post',
	},
];

export const mockNoExcerptPost = {
	id: 125,
	title: 'Post Without Excerpt',
	content: '<p>Full content</p>',
	excerpt: '',
};

export const mockPageEngineData = {
	components: [
		{
			component: 'Callout',
			props: {
				title: 'Test Callout',
				content: 'Test content'
			},
			children: []
		},
		{
			component: 'Page Section',
			props: {
				items: []
			},
			children: [
				{
					component: 'Callout',
					props: {
						title: 'Child Callout',
						content: 'Child content'
					},
					children: []
				}
			]
		}
	]
};

export const mockPayPalOrder = {
	id: 'ORDER-12345',
	status: 'CREATED',
	create_time: new Date().toISOString(),
	purchase_units: [
		{
			amount: {
				value: '99.99',
				breakdown: {
					item_total: { value: '89.99' },
					tax_total: { value: '10.00' },
					shipping: { value: '0.00' },
				},
			},
			items: [
				{
					name: 'Laptop Computer',
					unit_amount: { value: '89.99' },
					quantity: '1',
					description: 'Laptop Computer',
					category: 'PHYSICAL_GOODS',
				},
			],
			shipping: {
				name: { full_name: 'John Doe' },
				address: {
					address_line_1: '2211 N First St',
					admin_area_2: 'San Jose',
					admin_area_1: 'CA',
					postal_code: '95131',
					country_code: 'US',
				},
			},
		},
	],
	payer: {
		name: { given_name: 'John', surname: 'Doe' },
		email_address: 'john@example.com',
		payer_id: 'PAYERID12345',
	},
};

export const mockContentfulImageAssets = {
	items: [
		{
			fields: {
				file: {
					contentType: 'image/jpeg',
					url: '/uploads/image1.jpg',
				},
			},
			sys: { createdAt: '2024-01-01T10:00:00Z' },
		},
		{
			fields: {
				file: {
					contentType: 'image/png',
					url: '//example.com/image2.png',
				},
			},
			sys: { createdAt: '2024-01-02T10:00:00Z' },
		},
		{
			fields: {
				file: {
					contentType: 'image/webp',
					url: 'https://cdn.example.com/image3.webp',
				},
			},
			sys: { createdAt: '2024-01-03T10:00:00Z' },
		},
	],
};

export const mockContentfulImageAssetsWithEmptyUrls = {
	items: [
		{
			fields: {
				file: {
					contentType: 'image/jpeg',
					url: '/valid.jpg',
				},
			},
			sys: { createdAt: '2024-01-01T10:00:00Z' },
		},
		{
			fields: {
				file: {
					contentType: 'image/png',
					url: '',
				},
			},
			sys: { createdAt: '2024-01-02T10:00:00Z' },
		},
		{
			fields: {
				file: {
					contentType: 'image/webp',
					url: 'another-valid.jpg',
				},
			},
			sys: { createdAt: '2024-01-03T10:00:00Z' },
		},
	],
};

export const mockContentfulVideoAssets = {
	items: [
		{
			fields: {
				title: 'Tutorial Video',
				description: 'Learn how to grill steaks',
				file: {
					contentType: 'video/mp4',
					url: 'https://cdn.example.com/video1.mp4',
				},
			},
			sys: { createdAt: '2024-01-01T10:00:00Z' },
		},
		{
			fields: {
				title: 'Cooking Tips',
				description: 'Essential cooking techniques',
				file: {
					contentType: 'video/webm',
					url: 'https://cdn.example.com/video2.webm',
				},
			},
			sys: { createdAt: '2024-01-02T10:00:00Z' },
		},
	],
};

export const mockWordPressPosts = [
	{
		ID: 1,
		title: 'Test Post 1',
		featured_image: 'https://i0.wp.com/example.com/image1.jpg',
		content: 'Test content 1',
		excerpt: 'Excerpt 1',
		date: '2024-01-01T00:00:00+00:00',
		URL: 'https://example.com/post-1',
		categories: [],
		author: null,
	},
	{
		ID: 2,
		title: 'Test Post 2',
		featured_image: 'https://example.com/image2.jpg',
		content: 'Test content 2',
		excerpt: 'Excerpt 2',
		date: '2024-01-02T00:00:00+00:00',
		URL: 'https://example.com/post-2',
		categories: [],
		author: null,
	},
	{
		ID: 3,
		title: 'Test Post 3',
		featured_image: null,
		content: 'Test content 3',
		excerpt: 'Excerpt 3',
		date: '2024-01-03T00:00:00+00:00',
		URL: 'https://example.com/post-3',
		categories: [],
		author: null,
	},
];

export function createPayPalSandboxOrderPayload(sandboxEmail: string) {
	return {
		intent: 'CAPTURE',
		purchase_units: [
			{
				reference_id: 'PU1',
				description: 'Pixelated sandbox transaction',
				amount: {
					currency_code: 'USD',
					value: '10.00',
					breakdown: {
						item_total: { currency_code: 'USD', value: '7.00' },
						shipping: { currency_code: 'USD', value: '1.50' },
						handling: { currency_code: 'USD', value: '0.50' },
						tax_total: { currency_code: 'USD', value: '1.00' },
						discount: { currency_code: 'USD', value: '0.00' },
					},
				},
				items: [
					{
						name: 'Pixelated Test Widget',
						unit_amount: { currency_code: 'USD', value: '7.00' },
						quantity: '1',
						description: 'Sandbox order item for integration test',
						category: 'PHYSICAL_GOODS',
						url: 'https://example.com/product/123',
					},
				],
				shipping: {
					name: { full_name: 'Jane Buyer' },
					address: {
						address_line_1: '123 Market St',
						address_line_2: 'Suite 100',
						admin_area_2: 'San Francisco',
						admin_area_1: 'CA',
						postal_code: '94103',
						country_code: 'US',
					},
					email_address: sandboxEmail,
					phone: { phone_number: '5551234567' },
				},
			},
		],
		payer: {
			email_address: sandboxEmail,
			name: {
				given_name: 'Jane',
				surname: 'Buyer',
			},
			address: {
				address_line_1: '123 Market St',
				admin_area_2: 'San Francisco',
				admin_area_1: 'CA',
				postal_code: '94103',
				country_code: 'US',
			},
		},
		payment_source: {
			card: {
				number: '4111111111111111',
				expiry: '2028-12',
				security_code: '123',
				name: 'Jane Buyer',
				billing_address: {
					address_line_1: '123 Market St',
					address_line_2: 'Suite 100',
					admin_area_2: 'San Francisco',
					admin_area_1: 'CA',
					postal_code: '94103',
					country_code: 'US',
				},
			},
		},
	};
}


// THIS FILE IS DEPRECATED AND SHOULD NOT BE CHANGED.  
// It is being left in place for now to avoid breaking existing tests that rely on its exports, 
// but no new exports should be added to it.
// YOU SHOULD USE EXISTING EXPORTS FROM test-data.ts OR CREATE NEW ONES
// THIS INCLUDES CONFIGURATION DATA, RAW SUBMIT DATA, AND RAW RESPONSE DATA
// IF YOU NEED SPECIFIC CUSTOM DATA FOR A TEST SCENARIO, IE A FAILING TEST FOR ONE FIELD CHANGE
// YOU SHOULD IMPORT THE DATA FROM OBJECTS IN test-data.ts AND THEN MODIFY THAT OBJECT IN YOUR TEST FILE
// IF YOU NEED SPECIFIC CUSTOM CONFIG DATA FOR A TEST SCENARIO, IE A FAILING TEST FOR ONE FIELD CHANGE
// YOU SHOULD IMPORT THE DATA FROM OBJECTS IN test-data.ts AND THEN MODIFY THAT OBJECT IN YOUR TEST FILE


import { vi } from 'vitest';
import siteConfig from '@/data/siteconfig.json';
import recipes from '@/data/recipes.json';
import resume from '@/data/resume.json';
import faqTestData from './data/faq-test-data.json';
import mockGoogleDateRangesJson from './data/mock-google-date-ranges.json';
import type { CarouselCardType } from '@/components/general/carousel';
import type { GeminiRecommendationRequest } from '../components/integrations/gemini-api.server';
import { mockWordPressPosts as mockWordPressPostsCentralized, mockCarouselCards as mockCarouselCardsCentralized, mockTileCards as mockTileCardsCentralized } from './test-data';

export const mockGoogleDateRanges = {
	currentStart: new Date(mockGoogleDateRangesJson.currentStart),
	currentEnd: new Date(mockGoogleDateRangesJson.currentEnd),
	currentStartStr: mockGoogleDateRangesJson.currentStartStr,
	currentEndStr: mockGoogleDateRangesJson.currentEndStr,
	previousStart: new Date(mockGoogleDateRangesJson.previousStart),
	previousEnd: new Date(mockGoogleDateRangesJson.previousEnd),
	previousStartStr: mockGoogleDateRangesJson.previousStartStr,
	previousEndStr: mockGoogleDateRangesJson.previousEndStr,
};

export const emptySiteInfo = { name: '', author: '', description: '', url: '', email: '' };
export const routes = siteConfig.routes || [];
export const emptyRoutes: any[] = [];
export const malformedRoutes = [{ invalidField: 'value' }];

export const siteInfo = siteConfig.siteInfo;
export const siteInfoFull = siteConfig.siteInfo;
export const visualdesign = siteConfig.visualdesign || {};

export const realRecipes = recipes;
export const realResume = resume;
export const minimalRecipe = (recipes.items && recipes.items[0]) ? recipes.items[0] : { '@type': 'Recipe', name: 'Minimal' };
export const minimalResume = (resume.items && resume.items[0]) ? { items: [resume.items[0]] } : { items: [] };

import siteHealthData from './data/site-health-data.json';
import googlePsiExampleCom from './data/google-psi-example-com.json';
import { processPSIData } from '../components/admin/site-health/site-health-core-web-vitals.integration';

export async function createSiteHealthResponse(siteName = 'test-site', url = 'https://www.example.com') {
	return {
		success: true,
		data: [await processPSIData(googlePsiExampleCom, siteName, url)],
	};
}

export const emptyFormData = { fields: [] };

export function createFormInputField(props: Record<string, any>) {
	return { component: 'FormInput', props };
}

export function createFormTextareaField(props: Record<string, any>) {
	return { component: 'FormTextarea', props };
}

export function createFormCheckboxField(props: Record<string, any>) {
	return { component: 'FormCheckbox', props };
}

export function createFormRadioField(props: Record<string, any>) {
	return { component: 'FormRadio', props };
}

export function createFormButtonField(props: Record<string, any>) {
	return { component: 'FormButton', props };
}

export function createFormSectionHeader(title: string, text: string) {
	return {
		component: 'FormSectionHeader',
		props: {
			title,
			text,
		},
	};
}

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

export const mockComponentWithTextField = {
	component: 'TestComponent',
	fields: [
		{
			component: 'FormInput',
			name: 'title',
			label: 'Title',
			props: {
				type: 'text',
				placeholder: 'Enter title'
			}
		}
	]
};

export const mockComponentWithSubmitField = {
	component: 'TestComponent',
	fields: [
		{
			component: 'FormInput',
			name: 'title',
			label: 'Title',
			props: {
				type: 'text',
				placeholder: 'Enter title'
			}
		},
		{
			component: 'FormButton',
			name: 'submit',
			props: {
				type: 'submit',
				text: 'Save'
			}
		}
	]
};

export const mockComponentTreeData = [
	{
		component: 'Callout',
		props: { title: 'Test Callout' },
		children: []
	},
	{
		component: 'PageSection',
		props: { items: [] },
		children: [
			{
				component: 'Callout',
				props: { title: 'Child Callout' },
				children: []
			}
		]
	}
];

export const mockDeepPageEngineData = {
	components: [
		{
			component: 'PageSection',
			props: {},
			children: [
				{
					component: 'Callout',
					props: { title: 'Level 2' },
					children: [
						{
							component: 'Callout',
							props: { title: 'Level 3' },
							children: []
						}
					]
				}
			]
		}
	]
};

export const mockGooglePlacesPredictions = {
	predictions: [
		{
			place_id: 'place1',
			description: '123 Main St, Springfield, IL',
			structured_formatting: {
				main_text: '123 Main St',
				secondary_text: 'Springfield, IL'
			}
		},
		{
			place_id: 'place2',
			description: '456 Oak Ave, Springfield, IL',
			structured_formatting: {
				main_text: '456 Oak Ave',
				secondary_text: 'Springfield, IL'
			}
		}
	]
};

export const mockGooglePlacesDetailsUS = {
	result: {
		formatted_address: '123 Main St, Springfield, IL 62701, USA',
		address_components: [
			{ long_name: '123', short_name: '123', types: ['street_number'] },
			{ long_name: 'Main Street', short_name: 'Main St', types: ['route'] },
			{ long_name: 'Springfield', short_name: 'Springfield', types: ['locality'] },
			{ long_name: 'Illinois', short_name: 'IL', types: ['administrative_area_level_1'] },
			{ long_name: '62701', short_name: '62701', types: ['postal_code'] },
			{ long_name: 'United States', short_name: 'US', types: ['country'] }
		]
	}
};

export const mockGooglePlacesDetailsCA = {
	result: {
		formatted_address: '111 Richmond St W, Toronto, ON M5H 2G4, Canada',
		address_components: [
			{ long_name: '111', short_name: '111', types: ['street_number'] },
			{ long_name: 'Richmond St W', short_name: 'Richmond St W', types: ['route'] },
			{ long_name: 'Toronto', short_name: 'Toronto', types: ['locality'] },
			{ long_name: 'Ontario', short_name: 'ON', types: ['administrative_area_level_1'] },
			{ long_name: 'M5H 2G4', short_name: 'M5H 2G4', types: ['postal_code'] },
			{ long_name: 'Canada', short_name: 'CA', types: ['country'] }
		]
	}
};

export const mockGooglePlacesDetailsInvalidCountry = {
	result: {
		formatted_address: 'Some address in Mexico',
		address_components: [
			{ long_name: 'Mexico', short_name: 'MX', types: ['country'] }
		]
	}
};

export const mockGooglePlacesDetailsNoCountry = {
	result: {
		formatted_address: 'Unknown location',
		address_components: []
	}
};

export const faqWithImage = {
	...faqTestData,
	mainEntity: [{
		'@type': 'Question',
		name: 'Image FAQ',
		category: 'Services',
		acceptedAnswer: {
			'@type': 'Answer',
			text: 'Answer with image',
			image: {
				'@type': 'ImageObject',
				contentUrl: '/images/test.jpg',
				name: 'Test image',
				width: 100,
				height: 100,
				layout: 'right'
			}
		}
	}]
};

export const faqWithHtml = {
	...faqTestData,
	mainEntity: [{
		'@type': 'Question',
		name: 'HTML Test',
		category: 'Technical Details',
		acceptedAnswer: {
			'@type': 'Answer',
			text: 'This has <strong>bold</strong> and <em>italic</em> text.'
		}
	}]
};

export function createResumeWithAdditionalReferences(resumeData: any) {
	return {
		...resumeData,
		items: [{
			...resumeData.items[0],
			properties: {
				...resumeData.items[0].properties,
				references: [
					...(resumeData.items[0].properties.references || []),
					{
						properties: {
							name: ['John Manager'],
							url: ['https://johnmanager.com'],
							locality: ['Springfield'],
							region: ['IL'],
							'job-title': 'Manager',
							org: 'Previous Corp',
							email: ['john@corp.com'],
							tel: ['555-9999']
						}
					}
				]
			}
		}]
	};
}

export const minimalCarouselCard: CarouselCardType = {
	index: 0,
	cardIndex: 0,
	cardLength: 1,
	image: 'https://example.com/image.jpg',
	imageAlt: 'Minimal card image',
};

export const carouselMockCards: CarouselCardType[] = mockCarouselCardsCentralized;

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

export const tileCards: CarouselCardType[] = mockTileCardsCentralized;

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
			component: 'PageSection',
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

export const mockWordPressPosts = mockWordPressPostsCentralized;

export const mockContentfulItems = [
	{
		sys: { id: 'item-1', createdAt: '2024-01-01' },
		fields: {
			title: 'Product 1',
			images: [],
			imageUrl: 'https://example.com/image1.jpg',
			imageAlt: 'Product 1',
			price: 99.99,
			priceCurrency: 'USD',
			quantity: 1,
			weight: 1,
			weightUnit: 'lb',
			isShippable: true,
		},
	},
	{
		sys: { id: 'item-2', createdAt: '2024-01-02' },
		fields: {
			title: 'Product 2',
			images: [],
			imageUrl: 'https://example.com/image2.jpg',
			imageAlt: 'Product 2',
			price: 149.99,
			quantity: 1,
		},
	},
];

export const mockContentfulAssets = [
	{
		sys: { id: 'asset-1', createdAt: '2024-01-01' },
		fields: {
			file: { url: 'https://example.com/asset1.jpg' },
			title: 'Asset 1',
		},
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

export const mockPayPalCapture = {
	id: 'ORDER-12345',
	status: 'COMPLETED',
	purchase_units: [
		{
			payments: {
				captures: [
					{
						id: 'CAPTURE-12345',
						status: 'COMPLETED',
						amount: {
							currency_code: 'USD',
							value: '99.99',
						},
						create_time: new Date().toISOString(),
					},
				],
			},
		},
	],
};

export const gravatarProfile = {
	displayName: 'Jane Smith',
	profileUrl: 'https://gravatar.com/janesmith',
	thumbnailUrl: 'https://gravatar.com/avatar/abc123',
	aboutMe: 'Software engineer and coffee enthusiast',
	currentLocation: 'San Francisco, CA',
	job_title: 'Senior Engineer',
	company: 'Tech Corp',
	pronouns: 'she/her',
	accounts: [
		{ shortname: 'github', url: 'https://github.com/janesmith' },
		{ shortname: 'linkedin', url: 'https://linkedin.com/in/janesmith' },
		{ shortname: 'twitter', url: 'https://twitter.com/janesmith' },
	],
};

export const buzzwordBingoWords = [
	"Synergy", "Low-hanging fruit", "Paradigm shift", "Deep dive", "Leverage",
	"Action item", "Bandwidth", "Circle back", "Ecosystem", "Holistic",
	"KPI", "Logistics", "Mindshare", "Optimize", "Proactive",
	"Robust", "Scalable", "Thought leader", "Visibility", "Win-win",
	"Value-add", "Empower", "Disrupt", "Game changer", "Alignment"
];

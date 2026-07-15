import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const sampleAssessment = {
	companyName: 'Example Corp',
	companyContact: 'Jane Doe',
	date: '2024-01-01T00:00:00.000Z',
	email: 'jane@example.com',
	phone: '555-555-5555',
	address: {
		streetAddress: '123 Main St',
		addressLocality: 'Anytown',
		addressRegion: 'CA',
		postalCode: '12345',
		addressCountry: 'USA',
	},
	primaryAudience: ['Small businesses'],
	secondaryAudience: ['Enterprise clients'],
	marketOverview: ['We operate in a competitive local market.'],
	currentSocialMedia: ['Twitter'],
	advertisingPartners: ['Google Ads'],
	earnedMedia: ['Local press'],
	similarCompanyNames: [
		{ name: 'Example Corporation', url: 'https://examplecorp.com', summary: 'Similar brand' },
	],
	competitors: [
		{ name: 'Competitor One', urls: ['https://competitor.one'], summary: 'Strong local presence' },
	],
	currentState: ['State 1'],
	nextSteps: ['Next step 1'],
	aboutPixelated: ['About pixelated'],
	colorPalette: {
		primary: '#000000',
		secondary: '#ffffff',
		tertiary: '#333333',
		accent1: '#ff0000',
		accent2: '#00ff00',
		accent3: '#0000ff',
		headerFont: { name: 'Inter', url: 'https://fonts.googleapis.com/css2?family=Inter' },
		bodyFont: 'Arial',
	},
	websiteDomain: {},
	informationArchitecture: [{ route: '/home', title: 'Home', notes: ['Home note'] }],
	blogRoute: { enabled: false, route: '/blog' },
	proposedSocialMediaAccounts: ['https://twitter.com/example'],
	differentiation: ['Differentiation'],
	currentBusinessPlan: ['Business plan'],
	keywords: ['keyword1', 'keyword2'],
	logo: { url: '/logo.png', altText: 'Company logo' },
};

let mockUseFileDataResult: any = null;

vi.mock('@pixelated-tech/components', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		__esModule: true,
		...actual,
		PageSection: ({ children }: any) => <div>{children}</div>,
		useFileData: () => mockUseFileDataResult,
		smartFetch: async () => sampleAssessment,
		SmartImage: ({ alt }: any) => <img alt={alt} />,
		generateGoogleFontsUrl: () => '',
		contrastyColor: () => '#ffffff',
	};
});

describe('Assessment page', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('renders assessment content when manifest and assessment data are available', async () => {
		mockUseFileDataResult = { data: { files: ['assessment.json'] }, loading: false, error: null };
		const Page = (await import('@/app/(pages)/assessment/page')).default;
		render(<Page />);

		await waitFor(() => expect(screen.getByText('Assessment')).toBeTruthy());
		expect(screen.getByText('FOR: Example Corp')).toBeTruthy();
		expect(screen.getByText('Some Local Competitors')).toBeTruthy();
		expect(screen.getByText('No current website URL is provided.')).toBeTruthy();
	});

	it('renders an error message when the manifest fails to load', async () => {
		mockUseFileDataResult = { data: null, loading: false, error: 'Failed to load' };
		const Page = (await import('@/app/(pages)/assessment/page')).default;
		render(<Page />);

		await waitFor(() => expect(screen.getByText('Error loading assessment manifest: Failed to load')).toBeTruthy());
	});
});

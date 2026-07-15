import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

// Mocks: useFileData and smartFetch from @pixelated-tech/components
const manifest = { files: ['sample-assessment.json'] };
const sampleAssessment = {
	companyName: 'Test Co',
	companyContact: 'Owner',
	date: '2025-01-01',
	email: 'a@b.com',
	phone: '555',
	address: { streetAddress: '1 St', addressLocality: 'Town', addressRegion: 'ST', postalCode: '12345' },
	primaryAudience: ['A'],
	secondaryAudience: ['B'],
	marketOverview: ['overview'],
	currentSocialMedia: [],
	advertisingPartners: [],
	earnedMedia: [],
	similarCompanyNames: [],
	competitors: [],
	currentState: [],
	nextSteps: [],
	aboutPixelated: [],
	colorPalette: { primary: '#000', secondary: '#111', tertiary: '#222', accent1: '#333', accent2: '#444', accent3: '#555', headerFont: 'Arial', bodyFont: 'Roboto' },
	websiteDomain: { currentUrls: ['https://example.com'] },
	informationArchitecture: [{ route: '/', title: 'Home', notes: ['n'] }],
	proposedSocialMediaAccounts: [],
	differentiation: [],
	currentBusinessPlan: [],
	keywords: [],
};

let currentSample = sampleAssessment;
vi.mock('@pixelated-tech/components', async () => {
	const actual = await vi.importActual<typeof import('@pixelated-tech/components')>('@pixelated-tech/components');
	return {
		__esModule: true,
		...actual,
		useFileData: () => ({ data: manifest, loading: false, error: null }),
		smartFetch: async (_url: string) => currentSample,
	};
});

async function importPage() {
	const mod = await import('../../src/app/(pages)/assessment/page.tsx');
	return mod.default;
}

describe('Assessment page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders selection and loads assessment', async () => {
		const Page = await importPage();
		const { container } = render(<Page />);
		await waitFor(() => expect(container.querySelector('#selection-section')).toBeTruthy());
		// After fetch the assessment should render title
		await waitFor(() => expect(container.querySelector('#title-section')).toBeTruthy());
		expect(container).toHaveTextContent('Assessment');
		expect(container).toHaveTextContent('Test Co');
	});

	it('shows no website message when none provided', async () => {
		currentSample = { ...sampleAssessment, websiteDomain: {} } as any;
		const Page = await importPage();
		const { container } = render(<Page />);
		await waitFor(() => expect(container.querySelector('#title-section')).toBeTruthy());
		expect(container).toHaveTextContent('No current website URL is provided.');
	});

	it('renders existingSite strengths when present', async () => {
		currentSample = { ...sampleAssessment, existingSite: { url: 'https://x', strengths: ['s1'], areasForImprovement: [] } } as any;
		const Page = await importPage();
		const { container } = render(<Page />);
		await waitFor(() => expect(container.querySelector('#marketing-analysis-section')).toBeTruthy());
		expect(container).toHaveTextContent('Strengths');
		expect(container).toHaveTextContent('s1');
	});

	// additional branch tests can be added later; keeping focused smoke tests for now
});

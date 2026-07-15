import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

const manifest = { files: ['sample-proposal.json'] };
const sampleProposal = {
	proposalType: 'Web Site Build',
	date: '2025-01-01',
	companyName: 'Client Co',
	companyContact: 'Owner',
	address: { streetAddress: '1 St', addressLocality: 'Town', addressRegion: 'ST', postalCode: '12345' },
	phone: '555',
	goal: ['g1'],
	deliverables: ['d1'],
	features: [{ feature: 'f1', description: ['desc'] }],
	milestones: [{ date: '2025-02-01', milestone: 'Start' }],
	paymentTotal: { amount: 1000, description: ['desc'] },
};

vi.mock('@pixelated-tech/components', async () => {
	const actual = await vi.importActual<typeof import('@pixelated-tech/components')>('@pixelated-tech/components');
	return {
		__esModule: true,
		...actual,
		useFileData: () => ({ data: manifest, loading: false, error: null }),
		smartFetch: async (_url: string) => sampleProposal,
	};
});

async function importPage() {
	const mod = await import('../../src/app/(pages)/proposal/page.tsx');
	return mod.default;
}

describe('Proposal page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders and displays proposal fields', async () => {
		const Page = await importPage();
		const { container } = render(<Page />);
		await waitFor(() => expect(container.querySelector('#title-section')).toBeTruthy());
		expect(container).toHaveTextContent('Proposal - Web Site Build');
		expect(container).toHaveTextContent('Client Co');
		expect(container).toHaveTextContent('$1,000');
	});

	// branch tests for Monthly Maintenance can be added later; keeping tests focused for now
});

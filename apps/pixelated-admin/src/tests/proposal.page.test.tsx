import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

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
	};
});

vi.mock('@pixelated-tech/components/adminclient', () => ({
	useAdminFileData: () => ({ files: ['sample-proposal.json'], selectedFile: 'sample-proposal.json', setSelectedFile: vi.fn(), data: sampleProposal, loading: false, error: null }),
}));

describe('Proposal page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders and displays proposal fields', async () => {
		const { default: Page } = await import('../../src/app/(pages)/proposal/proposal-template');
		const { container } = render(<Page files={['sample-proposal.json']} />);
		await waitFor(() => expect(container.querySelector('#title-section')).toBeTruthy());
		expect(container).toHaveTextContent('Proposal - Web Site Build');
		expect(container).toHaveTextContent('Client Co');
		expect(container).toHaveTextContent('$1,000');
	});

	// branch tests for Monthly Maintenance can be added later; keeping tests focused for now
});

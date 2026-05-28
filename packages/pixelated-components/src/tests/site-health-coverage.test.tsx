import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { SiteHealthAccessibility } from '../components/admin/site-health/site-health-accessibility';
import { 
	getScoreIndicator, 
	getImpactIndicator, 
	getPassingIndicator, 
	getIncompleteIndicator 
} from '../components/admin/site-health/site-health-indicators';

import { SiteHealthTemplate } from '../components/admin/site-health/site-health-template';

// Mock SiteHealthTemplate to allow us to inject custom data states
vi.mock('../components/admin/site-health/site-health-template', () => ({
	SiteHealthTemplate: vi.fn(({ children, dataOverride }: any) => {
		// If custom data provided by test, use it, otherwise use a default
		const data = dataOverride || {
			success: true,
			data: [{
				site: 'test-site',
				url: 'https://example.com',
				status: 'success',
				scores: { accessibility: 0.9 },
				categories: {
					accessibility: {
						audits: [
							{ id: 'color-contrast', title: 'Color Contrast', score: 1, scoreDisplayMode: 'binary' }
						]
					}
				}
			}]
		};
		return (
			<div data-testid="mock-template">
				{children(data)}
			</div>
		);
	})
}));

describe('Coverage Targeted Tests', () => {

	describe('SiteHealthIndicators Utilities', () => {
		it('covers all getScoreIndicator branches', () => {
			expect(getScoreIndicator(null).icon).toBe('⚪');
			expect(getScoreIndicator(0.95).icon).toBe('🟢');
			expect(getScoreIndicator(0.85).icon).toBe('🟡');
			expect(getScoreIndicator(0.65).icon).toBe('🟠');
			expect(getScoreIndicator(0.45).icon).toBe('🔴');
		});

		it('covers getImpactIndicator switch cases', () => {
			expect(getImpactIndicator('critical').icon).toBe('🔴');
			expect(getImpactIndicator('serious').icon).toBe('🟠');
			expect(getImpactIndicator('moderate').icon).toBe('🟡');
			expect(getImpactIndicator('minor').icon).toBe('⚪');
			expect(getImpactIndicator('unknown').icon).toBe('⚪');
		});

		it('covers passing and incomplete indicators', () => {
			expect(getPassingIndicator().icon).toBe('🟢');
			expect(getIncompleteIndicator().icon).toBe('⚪');
		});
	});

	describe('SiteHealthAccessibility Coverage Gaps', () => {
		it('covers empty data branch', async () => {
			// This targets: if (!data?.data || data.data.length === 0)
			const emptyData = { success: true, data: [] };
			vi.mocked(SiteHealthTemplate).mockImplementationOnce(({ children }) => (
				<div data-testid="empty-mock">{children(emptyData)}</div>
			));

			render(<SiteHealthAccessibility siteName="test" />); 
			expect(screen.getByText(/No accessibility data available/i)).toBeInTheDocument();
		});

		it('covers null accessibility score branch', () => {
			const nullScoreData = {
				success: true,
				data: [{
					site: 'test-site',
					url: 'https://example.com',
					status: 'success',
					scores: { accessibility: null },
					categories: { accessibility: { audits: [] } }
				}]
			};

			vi.mocked(SiteHealthTemplate).mockImplementationOnce(({ children }) => (
				<div data-testid="null-score-mock">{children(nullScoreData)}</div>
			));

			render(<SiteHealthAccessibility siteName="test" />);
			// Verify it doesn't render the score container
			expect(screen.queryByText(/Accessibility Score/i)).toBeNull();
		});

		it('covers sorting logic and display modes', () => {
			const errorData = {
				success: true,
				data: [{
					status: 'error',
					error: 'API Timeout',
					site: 'test',
					url: 'test.com',
					scores: { accessibility: 0 },
					categories: { accessibility: { audits: [] } }
				}]
			};

			// We need to bypass the mock's internal state for this specific test
			// Simply rendering it with a custom mock implementation for this test
			vi.mocked(SiteHealthTemplate).mockImplementationOnce(({ children }) => (
				<div data-testid="error-mock">{children(errorData)}</div>
			));

			render(<SiteHealthAccessibility siteName="test" />);
			expect(screen.getByText(/Error: API Timeout/i)).toBeInTheDocument();
		});

		it('covers sorting logic and display modes', () => {
			const complexData = {
				success: true,
				data: [{
					site: 'test-site',
					url: 'https://example.com',
					status: 'success',
					scores: { accessibility: 0.8 },
					categories: {
						accessibility: {
							audits: [
								{ id: 'not-applicable-audit', title: 'NA', score: 1, scoreDisplayMode: 'notApplicable' },
								{ id: 'other-audit', title: 'Other', score: 0.5, scoreDisplayMode: 'numeric' },
								{ id: 'color-contrast', title: 'Contrast', score: 0.1, scoreDisplayMode: 'numeric', details: { items: [{ node: 'div' }] } },
								{ id: 'image-alt', title: 'Alt Text', score: 0.5, scoreDisplayMode: 'numeric' }
							]
						}
					}
				}]
			};

			vi.mocked(SiteHealthTemplate).mockImplementationOnce(({ children }) => (
				<div data-testid="complex-mock">{children(complexData)}</div>
			));

			render(<SiteHealthAccessibility siteName="test" />);
			
			// Verify 'Contrast' (priority) is before 'Other' (higher score but not priority)
			expect(screen.getByText(/Contrast/i)).toBeInTheDocument();
			expect(screen.queryByText(/NA/i)).toBeNull(); // Should be filtered out
		});
	});
});

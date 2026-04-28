import { describe, it, expect } from 'vitest';
import { getScoreIndicator, getImpactIndicator, getPassingIndicator, getIncompleteIndicator } from '../components/admin/site-health/site-health-indicators';

describe('site-health-indicators', () => {
	it('should return unknown indicator for null scores', () => {
		const result = getScoreIndicator(null);
		expect(result.icon).toBe('⚪');
	});

	it('should return excellent indicator for high scores', () => {
		expect(getScoreIndicator(0.95).color).toBe('#10b981');
	});

	it('should return good indicator for mid scores', () => {
		expect(getScoreIndicator(0.8).icon).toBe('🟡');
	});

	it('should return needs improvement indicator for average scores', () => {
		expect(getScoreIndicator(0.55).icon).toBe('🟠');
	});

	it('should return poor indicator for low scores', () => {
		expect(getScoreIndicator(0.1).icon).toBe('🔴');
	});

	it('should return passing indicator at exact excellent threshold', () => {
		expect(getScoreIndicator(0.9)).toMatchObject({ icon: '🟢', color: '#10b981' });
	});

	it('should return good indicator at exact good threshold', () => {
		expect(getScoreIndicator(0.7).icon).toBe('🟡');
	});

	it('should return needs improvement at exact needs improvement threshold', () => {
		expect(getScoreIndicator(0.5).icon).toBe('🟠');
	});

	it('should return critical impact indicator', () => {
		expect(getImpactIndicator('critical').color).toBe('#dc2626');
	});

	it('should return serious impact indicator', () => {
		expect(getImpactIndicator('serious').icon).toBe('🟠');
	});

	it('should return moderate impact indicator', () => {
		expect(getImpactIndicator('moderate').icon).toBe('🟡');
	});

	it('should return minor impact indicator', () => {
		expect(getImpactIndicator('minor').color).toBe('#ca8a04');
	});

	it('should return unknown impact indicator for unsupported values', () => {
		expect(getImpactIndicator('unknown').color).toBe('#6b7280');
	});

	it('should return passing indicator', () => {
		expect(getPassingIndicator()).toEqual({ icon: '🟢', color: '#10b981' });
	});

	it('should return incomplete indicator', () => {
		expect(getIncompleteIndicator()).toEqual({ icon: '⚪', color: '#6b7280' });
	});
});

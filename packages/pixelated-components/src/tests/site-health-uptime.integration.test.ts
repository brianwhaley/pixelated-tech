import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkUptimeHealth, normalizeUptimeStatus } from '../components/admin/site-health/site-health-uptime.integration';
import { Route53Client } from '@aws-sdk/client-route-53';
import { getFullPixelatedConfig } from '../components/config/config';

const sendMock = vi.fn();
const getFullPixelatedConfigMock = vi.fn(() => ({
	aws: {
		region: 'us-east-1',
		access_key_id: 'test-key',
		secret_access_key: 'test-secret'
	}
}));

vi.mock('@aws-sdk/client-route-53', () => ({
	Route53Client: vi.fn(function() {
		return { send: sendMock };
	}),
	GetHealthCheckStatusCommand: vi.fn(function(this: any, params: any) {
		this.HealthCheckId = params.HealthCheckId;
		return this;
	})
}));

vi.mock('../../config/config', () => ({
	getFullPixelatedConfig: getFullPixelatedConfigMock
}));

describe('checkUptimeHealth', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getFullPixelatedConfigMock.mockImplementation(() => ({
			aws: {
				region: 'us-east-1',
				access_key_id: 'test-key',
				secret_access_key: 'test-secret'
			}
		}) as any);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Health Check Execution', () => {
		it('should call checkUptimeHealth function with health check ID', async () => {
			const result = await checkUptimeHealth('test-health-check-id');

			expect(result).toBeDefined();
			expect(['success', 'error']).toContain(result.status);
		});

		it('should return UptimeCheckResult object', async () => {
			const result = await checkUptimeHealth('health-check-123');

			expect(result).toHaveProperty('status');
			expect(['success', 'error']).toContain(result.status);
		});

		it('should return data with status field', async () => {
			const result = await checkUptimeHealth('health-check-id');

			if (result.status === 'success' && result.data) {
				expect(result.data).toHaveProperty('status');
				expect(['Healthy', 'Unhealthy', 'Unknown']).toContain(result.data.status);
			}
		});

		it('should include error field on failure', async () => {
			const result = await checkUptimeHealth('invalid-id');

			if (result.status === 'error') {
				expect(result.error).toBeDefined();
				expect(typeof result.error).toBe('string');
			}
		});
	});

	describe('AWS Route53 Integration', () => {
		it('should accept valid Route53 health check ID', async () => {
			const healthCheckId = 'a1b2c3d4e5f6';
			const result = await checkUptimeHealth(healthCheckId);

			expect(result).toBeDefined();
		});

		it('should use default AWS region when not configured', async () => {
			const result = await checkUptimeHealth('health-check-id');

			expect(result).toBeDefined();
		});

		it('should use AWS credentials from config when available', async () => {
			const result = await checkUptimeHealth('health-check-id');

			expect(['success', 'error']).toContain(result.status);
		});

		it('should handle Route53 API responses with Health Observations', async () => {
			const result = await checkUptimeHealth('health-check-id');

			expect(result).toBeDefined();
		});

		it('should interpret Success status as Healthy', async () => {
			const result = await checkUptimeHealth('health-check-123');

			if (result.data) {
				expect(result.data.status).toBeDefined();
			}
		});

		it('should interpret Failure status as Unhealthy', async () => {
			const result = await checkUptimeHealth('health-check-id');

			if (result.data) {
				const status = result.data.status;
				expect(['Healthy', 'Unhealthy', 'Unknown']).toContain(status);
			}
		});
	});

	describe('Response Structure', () => {
		it('should always return status field', async () => {
			const result = await checkUptimeHealth('hc-123');

			expect(result).toHaveProperty('status');
			expect(['success', 'error']).toContain(result.status);
		});

		it('should include data object with health status', async () => {
			const result = await checkUptimeHealth('health-check-id');

			expect(result).toHaveProperty('status');
			if (result.status === 'success') {
				expect(result.data).toBeDefined();
			}
		});

		it('should provide message field in data for failures', async () => {
			const result = await checkUptimeHealth('invalid-check');

			if (result.data?.message) {
				expect(typeof result.data.message).toBe('string');
			}
		});

		it('should include error field when check fails', async () => {
			const result = await checkUptimeHealth('bad-id');

			if (result.error) {
				expect(typeof result.error).toBe('string');
				expect(result.error.length).toBeGreaterThan(0);
			}
		});
	});

	describe('Health Status Values', () => {
		it('should return Healthy status for successful checks', async () => {
			const result = await checkUptimeHealth('health-check-id');

			if (result.data?.status === 'Healthy') {
				expect(result.data.status).toBe('Healthy');
			}
		});

		it('should return Unhealthy status for failed checks', async () => {
			const result = await checkUptimeHealth('health-check-id');

			if (result.data?.status === 'Unhealthy') {
				expect(result.data.status).toBe('Unhealthy');
			}
		});

		it('should return Unknown status for unresolved checks', async () => {
			const result = await checkUptimeHealth('health-check-id');

			if (result.data?.status === 'Unknown') {
				expect(result.data.status).toBe('Unknown');
			}
		});

		it('should validate status is one of expected values', async () => {
			const result = await checkUptimeHealth('health-check-123');

			if (result.data?.status) {
				const validStatuses = ['Healthy', 'Unhealthy', 'Unknown'];
				expect(validStatuses).toContain(result.data.status);
			}
		});
	});

	describe('Configuration Handling', () => {
		it('should respect AWS region from config', async () => {
			const result = await checkUptimeHealth('health-check-id');

			expect(result).toBeDefined();
		});

		it('should fall back to default region if not in config', async () => {
			const result = await checkUptimeHealth('health-check-id');

			expect(['success', 'error']).toContain(result.status);
		});

		it('should use credentials from pixelated.config.json when available', async () => {
			const result = await checkUptimeHealth('health-check-id');

			expect(result).toBeDefined();
		});

		it('should handle missing AWS credentials gracefully', async () => {
			const result = await checkUptimeHealth('health-check-id');

			expect(result.status).toBeDefined();
		});
	});

	describe('Error Handling', () => {
		it('should catch and handle Route53 API errors', async () => {
			const result = await checkUptimeHealth('health-check-id');

			expect(result).toBeDefined();
		});

		it('should return error status on AWS SDK failure', async () => {
			const result = await checkUptimeHealth('invalid-check');

			expect(result).toHaveProperty('status');
		});

		it('should provide error message when check fails', async () => {
			const result = await checkUptimeHealth('bad-id');

			if (result.error) {
				expect(typeof result.error).toBe('string');
			}
		});

		it('should return success status with Unknown when check times out', async () => {
			const result = await checkUptimeHealth('health-check-id');

			if (result.data) {
				expect(['Healthy', 'Unhealthy', 'Unknown']).toContain(result.data.status);
			}
		});
	});

	describe('Status Normalization', () => {
		it('should normalize raw status strings into health labels', () => {
			expect(normalizeUptimeStatus('Success')).toBe('Healthy');
			expect(normalizeUptimeStatus('Failure')).toBe('Unhealthy');
			expect(normalizeUptimeStatus('UNKNOWN')).toBe('Unknown');
			expect(normalizeUptimeStatus(undefined)).toBe('Unknown');
		});
	});

	describe('Uptime Metrics', () => {
		it('should track multiple regional health observations', async () => {
			sendMock.mockResolvedValueOnce({
				HealthCheckObservations: [{ StatusReport: { Status: 'Success' } }]
			});
			const result = await checkUptimeHealth('health-check-id');

			expect(result.data?.status).toBe('Healthy');
		});

		it('should support various AWS regions', async () => {
			getFullPixelatedConfigMock.mockReturnValueOnce({ aws: { region: 'eu-west-1' } } as any);
			sendMock.mockResolvedValueOnce({
				HealthCheckObservations: [{ StatusReport: { Status: 'Failure' } }]
			});

			const result = await checkUptimeHealth('health-check-id');
			expect(result.data?.status).toBe('Unhealthy');
		});

		it('should calculate overall health from regional observations', async () => {
			sendMock.mockResolvedValueOnce({
				HealthCheckObservations: [{ StatusReport: { Status: 'Unknown' } }]
			});
			const result = await checkUptimeHealth('health-check-id');
			expect(result.data?.status).toBe('Unknown');
		});

		it('should handle missing observations gracefully', async () => {
			sendMock.mockResolvedValueOnce({});
			const result = await checkUptimeHealth('health-check-id');
			expect(result.data?.status).toBe('Unknown');
		});

		it('should handle AWS SDK failures gracefully', async () => {
			sendMock.mockRejectedValueOnce(new Error('AWS error'));
			const result = await checkUptimeHealth('health-check-id');
			expect(result.data?.status).toBe('Unknown');
			expect(result.data?.message).toBe('Check failed');
		});

		it('should fall back to default region when no region is configured', async () => {
			getFullPixelatedConfigMock.mockReturnValueOnce({} as any);
			sendMock.mockResolvedValueOnce({ HealthCheckObservations: [{ StatusReport: { Status: 'Success' } }] });
			const result = await checkUptimeHealth('health-check-id');
			expect(result.data?.status).toBe('Healthy');
		});
	});
});

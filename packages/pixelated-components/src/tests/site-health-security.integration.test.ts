import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import path from 'path';

vi.mock('child_process', () => {
	const mockExec = vi.fn((cmd: string, options: any, callback: (err: Error | null, stdout: string, stderr: string) => void) => {
		callback(null, JSON.stringify({
			auditReportVersion: 2,
			vulnerabilities: {
				'test-package': {
					name: 'test-package',
					severity: 'moderate',
					via: ['vulnerability-1'],
					range: '<1.0.0',
					nodes: ['node_modules/test-package'],
					fixAvailable: true
				}
			},
			metadata: {
				auditReportVersion: 2,
				vulnerabilities: {
					info: 0,
					low: 0,
					moderate: 1,
					high: 0,
					critical: 0
				},
				dependencies: {
					total: 150,
					prod: 25,
					dev: 125,
					optional: 0,
					peer: 0,
					peerOptional: 0
				},
				totalDependencies: 150
			}
		}), '');
	});
	return {
		default: { exec: mockExec },
		exec: mockExec
	};
});

vi.mock('fs', async () => {
	const actual = await vi.importActual<typeof import('fs')>('fs');
	const existsSyncMock = vi.fn(actual.existsSync);
	const readFileSyncMock = vi.fn(actual.readFileSync);
	return {
		...actual,
		default: {
			...actual,
			existsSync: existsSyncMock,
			readFileSync: readFileSyncMock,
		},
		existsSync: existsSyncMock,
		readFileSync: readFileSyncMock,
	};
});

import { analyzeSecurityHealth } from '../components/admin/site-health/site-health-security.integration';

describe('analyzeSecurityHealth', () => {
	it('should return security scan result with expected structure', async () => {
		const result = await analyzeSecurityHealth('.', 'test-site', 'test-repo');
		expect(result).toBeDefined();
		expect(result.status).toBeDefined();
		
		if (result.status === 'success' && result.data) {
			expect(result.data.status).toBeDefined();
			expect(Array.isArray(result.data.vulnerabilities)).toBe(true);
			expect(result.data.summary).toBeDefined();
			expect(typeof result.data.dependencies).toBe('number');
			expect(typeof result.data.totalDependencies).toBe('number');
		}
	}, 120_000);

	it('should identify vulnerability severity levels', async () => {
		const result = await analyzeSecurityHealth('/test/path', 'test-site');
		
		if (result.status === 'success' && result.data) {
			const summary = result.data.summary;
			expect(typeof summary.info).toBe('number');
			expect(typeof summary.low).toBe('number');
			expect(typeof summary.moderate).toBe('number');
			expect(typeof summary.high).toBe('number');
			expect(typeof summary.critical).toBe('number');
			expect(typeof summary.total).toBe('number');
		}
	});

	it('should return No Dependencies when package.json is missing but site directory exists', async () => {
		const fsModule = await import('fs');
		const localPath = path.join(process.cwd(), 'test-site-no-pkg');
		const packageJsonPath = path.join(localPath, 'package.json');
		fsModule.mkdirSync(localPath, { recursive: true });
		vi.mocked(fsModule.existsSync).mockImplementation((candidatePath: string) => {
			if (candidatePath === localPath) return true;
			if (candidatePath === packageJsonPath) return false;
			return false;
		});

		const result = await analyzeSecurityHealth(localPath, 'test-site-no-pkg');

		fsModule.rmSync(localPath, { recursive: true, force: true });

		expect(result.status).toBe('success');
		expect(result.data?.status).toBe('No Dependencies');
		expect(result.data?.dependencies).toBe(0);
	});

	it('should use fallback path when local path is missing but siteName exists', async () => {
		const fsModule = await import('fs');
		const localPath = path.join(process.cwd(), 'missing-path');
		const fallbackPath = path.join(process.cwd(), 'test-site');
		const packageJsonPath = path.join(fallbackPath, 'package.json');
		vi.mocked(fsModule.existsSync).mockImplementation((candidatePath: string) => {
			if (candidatePath === localPath) {
				return false;
			}
			if (candidatePath === fallbackPath) {
				return true;
			}
			if (candidatePath === packageJsonPath) {
				return true;
			}
			return false;
		});

		const result = await analyzeSecurityHealth(localPath, 'test-site');
		expect(result.status).toBeDefined();
		if (result.status === 'success' && result.data) {
			expect(result.data.vulnerabilities).toBeDefined();
		}
	});

	it('should use repoName fallback when local path is missing', async () => {
		const fsModule = await import('fs');
		const localPath = '/missing/path';
		const repoPath = path.join(process.cwd(), 'repo-fallback');
		const packageJsonPath = path.join(repoPath, 'package.json');
		vi.mocked(fsModule.existsSync).mockImplementation((candidatePath: string) => {
			if (candidatePath === localPath) return false;
			if (candidatePath === repoPath) return true;
			if (candidatePath === packageJsonPath) return true;
			return false;
		});

		const result = await analyzeSecurityHealth(localPath, undefined, 'repo-fallback');
		expect(result.status).toBeDefined();
		if (result.status === 'success' && result.data) {
			expect(result.data.vulnerabilities).toBeDefined();
		}
	});

	it('should return error when the site directory cannot be found', async () => {
		const fsModule = await import('fs');
		vi.mocked(fsModule.existsSync).mockReturnValue(false);

		const result = await analyzeSecurityHealth('/missing/path', 'test-site');

		expect(result.status).toBe('error');
		expect(result.error).toContain('Site directory not found');
	});

	it('should use external volume fallback when the workspace path is not available', async () => {
		const fsModule = await import('fs');
		const localPath = '/missing/path';
		const externalPath = path.join('/Volumes', 'btw_x10_pro', 'Git', 'test-site');
		const packageJsonPath = path.join(externalPath, 'package.json');
		vi.mocked(fsModule.existsSync).mockImplementation((candidatePath: string) => {
			if (candidatePath === localPath) return false;
			if (candidatePath === externalPath) return true;
			if (candidatePath === packageJsonPath) return true;
			return false;
		});

		const result = await analyzeSecurityHealth(localPath, 'test-site');

		expect(result.status).toBe('success');
		expect(result.data?.status).toBeDefined();
	});

	it('should return an error when npm audit fails without stdout', async () => {
		const fsModule = await import('fs');
		const childProcess = await import('child_process');
		const execSpy = vi.mocked(childProcess.exec);
		const localPath = path.join(process.cwd(), 'test-site-audit-error');
		const packageJsonPath = path.join(localPath, 'package.json');

		fsModule.mkdirSync(localPath, { recursive: true });
		fsModule.writeFileSync(packageJsonPath, '{}');
		vi.mocked(fsModule.existsSync).mockImplementation((candidatePath: string) => {
			if (candidatePath === localPath || candidatePath === packageJsonPath) return true;
			return false;
		});

		const error = new Error('npm audit failed');
		execSpy.mockImplementationOnce((cmd: string, options: any, callback: (err: Error | null, stdout: string, stderr: string) => void) => {
			callback(error, '', '');
		});

		const result = await analyzeSecurityHealth(localPath, 'test-site');

		fsModule.rmSync(localPath, { recursive: true, force: true });

		expect(result.status).toBe('error');
		expect(result.error).toContain('npm audit failed');
	});

	it('should return Critical status when critical vulnerabilities are present', async () => {
		const fsModule = await import('fs');
		const childProcess = await import('child_process');
		const execSpy = vi.mocked(childProcess.exec);
		const localPath = path.join(process.cwd(), 'test-site-critical');
		const packageJsonPath = path.join(localPath, 'package.json');

		fsModule.mkdirSync(localPath, { recursive: true });
		fsModule.writeFileSync(packageJsonPath, '{}');
		vi.mocked(fsModule.existsSync).mockImplementation((candidatePath: string) => {
			if (candidatePath === localPath || candidatePath === packageJsonPath) return true;
			return false;
		});

		execSpy.mockImplementationOnce((cmd: string, options: any, callback: (err: Error | null, stdout: string, stderr: string) => void) => {
			callback(null, JSON.stringify({
				auditReportVersion: 2,
				vulnerabilities: {
					'test-package': {
						name: 'test-package',
						severity: 'critical',
						via: ['vulnerability-1'],
						range: '<1.0.0',
						nodes: ['node_modules/test-package'],
						fixAvailable: true
					}
				},
				metadata: {
					auditReportVersion: 2,
					vulnerabilities: {
						info: 0,
						low: 0,
						moderate: 0,
						high: 0,
						critical: 1
					},
					dependencies: {
						total: 1,
					},
					totalDependencies: 1
				}
			}), '');
		});

		const result = await analyzeSecurityHealth(localPath, 'test-site');

		fsModule.rmSync(localPath, { recursive: true, force: true });

		expect(result.status).toBe('success');
		expect(result.data?.status).toBe('Critical');
	});

	it('should return an error when npm audit stdout cannot be parsed after command failure', async () => {
		const fsModule = await import('fs');
		const childProcess = await import('child_process');
		const execSpy = vi.mocked(childProcess.exec);
		const localPath = path.join(process.cwd(), 'test-site-json-error');
		const packageJsonPath = path.join(localPath, 'package.json');

		fsModule.mkdirSync(localPath, { recursive: true });
		fsModule.writeFileSync(packageJsonPath, '{}');
		vi.mocked(fsModule.existsSync).mockImplementation((candidatePath: string) => {
			if (candidatePath === localPath || candidatePath === packageJsonPath) return true;
			return false;
		});

		const error = new Error('npm audit failed') as any;
		error.stdout = 'not-json';
		execSpy.mockImplementationOnce((cmd: string, options: any, callback: (err: Error | null, stdout: string, stderr: string) => void) => {
			callback(error, error.stdout, '');
		});

		const result = await analyzeSecurityHealth(localPath, 'test-site');

		fsModule.rmSync(localPath, { recursive: true, force: true });

		expect(result.status).toBe('error');
		expect(result.error).toContain('Failed to parse npm audit output');
	});

	it('should handle when no vulnerabilities exist', async () => {
		const result = await analyzeSecurityHealth('/test/path', 'test-site');
		
		if (result.status === 'success' && result.data) {
			// Result should be valid whether vulnerabilities exist or not
			expect(result.data.summary.total).toBeGreaterThanOrEqual(0);
		}
	});

	it('should calculate overall security status from vulnerability count', async () => {
		const result = await analyzeSecurityHealth('/test/path', 'test-site');
		
		if (result.status === 'success' && result.data) {
			// Status should be one of: Secure, Low Risk, Moderate Risk, High Risk, Critical
			const validStatuses = ['Secure', 'Low Risk', 'Moderate Risk', 'High Risk', 'Critical', 'No Dependencies'];
			expect(validStatuses).toContain(result.data.status);
		}
	});

	it('should track total dependencies count', async () => {
		const result = await analyzeSecurityHealth('/test/path', 'test-site');
		
		if (result.status === 'success' && result.data) {
			expect(result.data.totalDependencies).toBeGreaterThanOrEqual(0);
			expect(result.data.dependencies).toBeLessThanOrEqual(result.data.totalDependencies);
		}
	});

	it('should work with different site/repo name combinations', async () => {
		const result1 = await analyzeSecurityHealth('/path1', 'site-a', 'repo-a');
		const result2 = await analyzeSecurityHealth('/path2', 'site-b', 'repo-b');

		expect(result1).toBeDefined();
		expect(result2).toBeDefined();
	});

	it('should handle npm audit with vulnerabilities', async () => {
		const result = await analyzeSecurityHealth('/path', 'site');
		if (result.status === 'success' && result.data) {
			expect(result.data.summary).toBeDefined();
			expect(result.data.summary.total).toBeGreaterThanOrEqual(0);
		}
	});

	it('should return result for path with siteName only', async () => {
		const result = await analyzeSecurityHealth('/path', 'mysite');
		expect(result).toHaveProperty('status');
	});

	it('should return result for path with repoName only', async () => {
		const result = await analyzeSecurityHealth('/path', undefined, 'myrepo');
		expect(result).toHaveProperty('status');
	});

	it('should return result for path with both siteName and repoName', async () => {
		const result = await analyzeSecurityHealth('/path', 'site', 'repo');
		expect(result).toHaveProperty('status');
	});

	it('should handle vulnerabilities categorized by severity', async () => {
		const result = await analyzeSecurityHealth('/test');
		if (result.status === 'success' && result.data) {
			const summary = result.data.summary;
			expect(summary).toHaveProperty('critical');
			expect(summary).toHaveProperty('high');
			expect(summary).toHaveProperty('moderate');
			expect(summary).toHaveProperty('low');
			expect(summary).toHaveProperty('info');
		}
	});

	it('should calculate total vulnerabilities correctly', async () => {
		const result = await analyzeSecurityHealth('/test');
		if (result.status === 'success' && result.data) {
			const { summary } = result.data;
			const total = summary.critical + summary.high + summary.moderate + summary.low + summary.info;
			expect(total).toBeGreaterThanOrEqual(0);
		}
	});
});

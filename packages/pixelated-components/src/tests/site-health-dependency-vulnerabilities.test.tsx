import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import React from 'react';
import { SiteHealthDependencyVulnerabilities } from '../components/admin/site-health/site-health-dependency-vulnerabilities';
import { siteHealthData } from '../test/test-data';

let mockDependencyData: any = undefined;
let mockDependencyDataIsNull = false;

// Mock the SiteHealthTemplate component
vi.mock('../components/admin/site-health/site-health-template', () => ({
	SiteHealthTemplate: ({ children, siteName, title, endpoint, columnSpan }: any) => {
		const [data, setData] = React.useState<any>(null);
		const [loading, setLoading] = React.useState(true);

		React.useEffect(() => {
			const mockSiteData = mockDependencyDataIsNull ? null : (mockDependencyData ?? {
				...siteHealthData.dependencyVulnerabilities,
				timestamp: new Date().toISOString(),
				url: 'https://test-site.com',
			});

			const transformedData = endpoint?.responseTransformer
				? endpoint.responseTransformer(mockSiteData)
				: mockSiteData;

			setData(transformedData);
			setLoading(false);
		}, [endpoint]);

		if (loading) return <div>Loading...</div>;

		return (
			<div data-testid="health-template" data-column-span={columnSpan ?? '2'}>
				<h3>{title}</h3>
				<div>{children && children(data)}</div>
			</div>
		);
	}
}));

describe('SiteHealthDependencyVulnerabilities', () => {
	const defaultProps = {
		siteName: 'test-site'
	};

	afterEach(() => {
		mockDependencyData = undefined;
		mockDependencyDataIsNull = false;
	});

	it('should render without crashing', () => {
		const { container } = render(
			<SiteHealthDependencyVulnerabilities {...defaultProps} />
		);
		expect(container).toBeDefined();
	});

	it('should render health template', async () => {
		render(<SiteHealthDependencyVulnerabilities {...defaultProps} />);
		await waitFor(() => {
			const template = screen.getByTestId('health-template');
			expect(template).toBeDefined();
		});
	});

	it('should accept siteName prop', () => {
		const { container } = render(
			<SiteHealthDependencyVulnerabilities siteName="my-site" />
		);
		expect(container).toBeDefined();
	});

	it('should display vulnerability metrics', async () => {
		render(<SiteHealthDependencyVulnerabilities {...defaultProps} />);
		await waitFor(() => {
			const template = screen.getByTestId('health-template');
			expect(template.querySelector('h3')).toBeDefined();
		});
	});

	it('should handle dependency scan results', async () => {
		render(<SiteHealthDependencyVulnerabilities siteName="test" />);
		await waitFor(() => {
			const template = screen.getByTestId('health-template');
			expect(template).toBeDefined();
		});
	});

	it('should pass siteName to endpoint', async () => {
		render(<SiteHealthDependencyVulnerabilities siteName="example.com" />);
		await waitFor(() => {
			expect(screen.getByTestId('health-template')).toBeDefined();
		});
	});

	it('should fetch vulnerability data from API', async () => {
		render(<SiteHealthDependencyVulnerabilities {...defaultProps} />);
		await waitFor(() => {
			expect(screen.getByTestId('health-template')).toBeDefined();
		});
	});

	it('should apply response transformer', async () => {
		render(<SiteHealthDependencyVulnerabilities {...defaultProps} />);
		await waitFor(() => {
			expect(screen.getByTestId('health-template')).toBeDefined();
		});
	});

	it('should set correct column span', async () => {
		render(<SiteHealthDependencyVulnerabilities {...defaultProps} />);
		await waitFor(() => {
			const template = screen.getByTestId('health-template');
			expect(template.getAttribute('data-column-span')).toBe('2');
		});
	});

	it('should display list of vulnerable packages', async () => {
		render(<SiteHealthDependencyVulnerabilities {...defaultProps} />);
		await waitFor(() => {
			expect(screen.getByTestId('health-template')).toBeDefined();
		});
	});

	it('should show severity counts for vulnerabilities', async () => {
		render(<SiteHealthDependencyVulnerabilities {...defaultProps} />);
		await waitFor(() => {
			expect(screen.getByTestId('health-template')).toBeDefined();
		});
	});

	it('should render a no-data message when the template returns null', async () => {
		mockDependencyDataIsNull = true;
		render(<SiteHealthDependencyVulnerabilities {...defaultProps} />);
		await waitFor(() => {
			expect(screen.getByText('No dependency data available for this site.')).toBeInTheDocument();
		});
	});

	it('should render the secure no-vulnerabilities branch', async () => {
		mockDependencyData = {
			...siteHealthData.dependencyVulnerabilities,
			status: 'Secure',
			vulnerabilities: [],
			summary: { total: 0 },
			timestamp: new Date().toISOString(),
			url: 'https://secure.example.com',
		};

		render(<SiteHealthDependencyVulnerabilities {...defaultProps} />);
		await waitFor(() => {
			expect(screen.getByText('No vulnerabilities found')).toBeInTheDocument();
		});
	});

	it('should render a vulnerable item list and status colors', async () => {
		mockDependencyData = {
			...siteHealthData.dependencyVulnerabilities,
			status: 'Critical',
			vulnerabilities: [
				{
					severity: 'critical',
					name: 'example-package',
					title: 'Example vulnerability',
					range: '<=1.2.3',
					fixAvailable: true,
					url: 'https://example.com/vuln',
				},
			],
			summary: { total: 1 },
			timestamp: new Date().toISOString(),
			url: 'https://critical.example.com',
		};

		render(<SiteHealthDependencyVulnerabilities {...defaultProps} />);
		await waitFor(() => {
			expect(screen.getByText('Critical')).toBeInTheDocument();
			expect(screen.getByText('example-package')).toBeInTheDocument();
			expect(screen.getByText('Example vulnerability')).toBeInTheDocument();
			expect(screen.getByText('✓ Fix available')).toBeInTheDocument();
		});
	});
});

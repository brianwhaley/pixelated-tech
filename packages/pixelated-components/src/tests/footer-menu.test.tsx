import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/test-utils';
import { headers } from 'next/headers';
import { getFullPixelatedConfig } from '../components/config/config';
import { FooterMenu } from '../components/elements/menu-footer';

vi.mock('next/headers', () => ({ headers: vi.fn() }));
vi.mock('../components/config/config', () => ({ getFullPixelatedConfig: vi.fn() }));

const mockedHeaders = headers as unknown as { mockReturnValue: (value: any) => void };
const mockedGetFullPixelatedConfig = getFullPixelatedConfig as unknown as { mockReturnValue: (value: any) => void };

describe('FooterMenu', () => {
	beforeEach(() => {
		mockedHeaders.mockReset();
		mockedGetFullPixelatedConfig.mockReset();
	});

	it('renders footer menu links from routes and highlights active path', async () => {
		mockedHeaders.mockReturnValue({ get: (key: string) => key === 'x-path' ? '/about' : null });
		mockedGetFullPixelatedConfig.mockReturnValue({
			routes: [
				{ name: 'Home', path: '/' },
				{ name: 'About', path: '/about' },
				{ name: 'Services', path: '/services' }
			],
		});

		const { container } = render(await FooterMenu());
		expect(screen.getByText('Home')).toBeInTheDocument();
		expect(screen.getByText('About')).toBeInTheDocument();
		expect(screen.getByText('Services')).toBeInTheDocument();
		expect(container.querySelector('a.selected')).toBeTruthy();
		expect(container.querySelector('a.selected')?.getAttribute('href')).toBe('/about');
	});

	it('skips routes with nested children when rendering footer links', async () => {
		mockedHeaders.mockReturnValue({ get: () => '/' });
		mockedGetFullPixelatedConfig.mockReturnValue({
			routes: [
				{ name: 'Home', path: '/' },
				{ name: 'About', path: '/about', routes: [{ name: 'Team', path: '/about/team' }] },
				{ name: 'Contact', path: '/contact' }
			],
		});

		const { container } = render(await FooterMenu());
		expect(screen.getByText('Home')).toBeInTheDocument();
		expect(screen.queryByText('Team')).toBeNull();
		expect(screen.getByText('Contact')).toBeInTheDocument();
	});
});
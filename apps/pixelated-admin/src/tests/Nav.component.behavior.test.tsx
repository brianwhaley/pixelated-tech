import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@pixelated-tech/components', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		__esModule: true,
		...actual,
		SidePanel: ({ children }: any) => <div>{children}</div>,
		MenuAccordion: ({ menuItems }: any) => <div>{JSON.stringify(menuItems)}</div>,
		usePixelatedConfig: () => ({ routes: [{ name: 'Home', path: '/' }] }),
	};
});

vi.mock('next-auth/react', () => ({
	useSession: () => ({ data: null, status: 'unauthenticated' }),
	signOut: vi.fn(),
}));

describe('Nav component behavior', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('renders not signed in state', async () => {
		const Nav = (await import('@/app/components/Nav')).default;
		render(<Nav />);
		expect(screen.getByText('Not signed in')).toBeTruthy();
	});
});

import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createPageComponentMocks } from '@/test/page-mocks';
import { getGravatarProfile } from '@pixelated-tech/components';
import AboutPage from '@/app/(pages)/about/page';

vi.mock('@pixelated-tech/components', () => {
	const mocks = createPageComponentMocks({
		getGravatarProfile: vi.fn(async () => null),
	});
	return mocks;
});

const mockGetGravatarProfile = getGravatarProfile as unknown as ReturnType<typeof vi.fn>;

describe('Oaktree Landscaping about page', () => {
	it('renders the About Oaktree Landscaping title', () => {
		render(<AboutPage />);
		expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain('About Oaktree Landscaping');
	});

	it('handles gravatar fetch failure gracefully', async () => {
		mockGetGravatarProfile.mockRejectedValueOnce(new Error('network error'));
		render(<AboutPage />);
		await waitFor(() => expect(screen.getByTestId('mock-pagetitleheader').textContent).toContain('About Oaktree Landscaping'));
	});
});

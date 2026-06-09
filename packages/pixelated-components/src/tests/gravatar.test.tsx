import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { GravatarCard } from '../components/integrations/gravatar.components';
import { gravatarProfile } from '../test/fixtures';
import { renderWithProviders } from '../test/test-utils';

// Mock the SmartImage component
vi.mock('../components/elements/smartimage', () => ({
	SmartImage: ({ src, alt, width, height, className }: any) => (
		<img src={src} alt={alt} width={width} height={height} className={className} data-testid="gravatar-avatar-img" />
	)
}));

describe('GravatarCard Component Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Profile Rendering', () => {
		it('should render GravatarCard with profile data', () => {
			const { container } = renderWithProviders(
				<GravatarCard profile={gravatarProfile} />
			);

			const card = container.querySelector('.gravatar-card');
			expect(card).toBeDefined();
		});

		it('should display profile name', () => {
			const { container } = renderWithProviders(
				<GravatarCard profile={gravatarProfile} />
			);

			const nameElement = container.querySelector('.gravatar-name');
			expect(nameElement).toBeDefined();
			expect(nameElement?.textContent).toContain('Jane Smith');
		});

		it('should display pronouns when available', () => {
			const { container } = renderWithProviders(
				<GravatarCard profile={gravatarProfile} />
			);

			const pronounsElement = container.querySelector('.gravatar-pronouns');
			expect(pronounsElement).toBeDefined();
			expect(pronounsElement?.textContent).toContain('she/her');
		});

		it('should handle missing pronouns gracefully', () => {
			const profileWithoutPronouns = {
				...gravatarProfile,
				pronouns: undefined
			};

			const { container } = renderWithProviders(
				<GravatarCard profile={profileWithoutPronouns} />
			);

			const pronounsElement = container.querySelector('.gravatar-pronouns');
			expect(pronounsElement).toBeNull();
		});
	});
});

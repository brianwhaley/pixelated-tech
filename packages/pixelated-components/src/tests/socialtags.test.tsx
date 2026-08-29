import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/test-utils';
import { PartnerTags, SocialTags } from '../components/elements/socialtags';

describe('SocialTags', () => {
	it('renders a social section header and callouts for each social profile', () => {
		const config = {
			siteInfo: {
				name: 'Pixelated Technologies',
				author: 'Pixelated Technologies',
				description: 'A social media presence for Pixelated',
				url: 'https://www.pixelated.tech',
				email: 'hello@pixelated.tech',
				socialProfiles: [
					{ name: 'LinkedIn', url: 'https://linkedin.com/company/pixelated', img: 'https://example.com/linkedin.png' },
					{ name: 'Facebook', url: 'https://facebook.com/pixelated', img: '' },
				],
			},
		};

		const { container } = render(<SocialTags {...({} as any)} />, { config });

		expect(screen.getByText('Follow Pixelated Technologies on Social Media')).toBeInTheDocument();

		const linkedinImage = screen.getByAltText('LinkedIn') as HTMLImageElement;
		expect(linkedinImage).toBeInTheDocument();
		expect(linkedinImage.closest('a')).toHaveAttribute('href', 'https://linkedin.com/company/pixelated');
		expect(linkedinImage.src).toContain('example.com/linkedin.png');

		const facebookImage = screen.getByAltText('Facebook') as HTMLImageElement;
		expect(facebookImage).toBeInTheDocument();
		expect(facebookImage.closest('a')).toHaveAttribute('href', 'https://facebook.com/pixelated');
		expect(facebookImage.src).toContain('/images/logos/facebook-logo.png');

		const socialLinks = container.querySelectorAll('#socialtag-section a');
		expect(socialLinks.length).toBe(2);
	});

	it('allows overriding the SocialTags section header title', () => {
		const config = {
			siteInfo: {
				name: 'Pixelated Technologies',
				author: 'Pixelated Technologies',
				description: 'A social media presence for Pixelated',
				url: 'https://www.pixelated.tech',
				email: 'hello@pixelated.tech',
				socialProfiles: [
					{ name: 'LinkedIn', url: 'https://linkedin.com/company/pixelated', img: 'https://example.com/linkedin.png' },
			],
			},
		};

		render(<SocialTags title="Connect With Us" />, { config });

		expect(screen.getByText('Connect With Us')).toBeInTheDocument();
	});
});

describe('PartnerTags', () => {
	it('renders partner badges with company partner labels and skips entries without urls', () => {
		const config = {
			siteInfo: {
				name: 'Pixelated Technologies',
				author: 'Pixelated Technologies',
				description: 'A partner showcase for Pixelated',
				url: 'https://www.pixelated.tech',
				email: 'hello@pixelated.tech',
				partners: [
					{ name: 'Pocket Casts', url: 'https://pca.st/o8v0icqv', img: '/images/logos/pocket-casts-logo.png' },
					{ name: 'No Url Partner', url: '', img: '' },
					{ name: 'Example Partner', url: 'https://example.com/partner', img: '' },
				],
			},
		};

		const { container } = render(<PartnerTags {...({} as any)} />, { config });

		expect(screen.getByText('Pixelated Technologies Partners')).toBeInTheDocument();

		const pocketCastsImage = screen.getByAltText('Pixelated Technologies on Pocket Casts') as HTMLImageElement;
		expect(pocketCastsImage).toBeInTheDocument();
		expect(pocketCastsImage.closest('a')).toHaveAttribute('href', 'https://pca.st/o8v0icqv');
		expect(pocketCastsImage.src).toContain('pocket-casts-logo.png');

		const examplePartnerImage = screen.getByAltText('Pixelated Technologies on Example Partner') as HTMLImageElement;
		expect(examplePartnerImage).toBeInTheDocument();
		expect(examplePartnerImage.closest('a')).toHaveAttribute('href', 'https://example.com/partner');
		expect(examplePartnerImage.src).toContain('/images/logos/example-logo.png');

		expect(container.querySelector('img[alt="Pixelated Technologies on No Url Partner"]')).toBeNull();
	});

	it('allows overriding the PartnerTags section header title', () => {
		const config = {
			siteInfo: {
				name: 'Pixelated Technologies',
				author: 'Pixelated Technologies',
				description: 'A partner showcase for Pixelated',
				url: 'https://www.pixelated.tech',
				email: 'hello@pixelated.tech',
				partners: [
					{ name: 'Example Partner', url: 'https://example.com/partner', img: '' },
				],
			},
		};

		render(<PartnerTags title="Featured Partners" />, { config });

		expect(screen.getByText('Featured Partners')).toBeInTheDocument();
	});
});

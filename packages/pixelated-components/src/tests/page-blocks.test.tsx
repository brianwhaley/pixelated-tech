/// <reference types="vitest" />
import React from 'react';
import { screen } from '@testing-library/react';
import { render } from '../test/test-utils';
import { PageBg, PageTitleHeader, PageSectionHeader, PageSection } from '@/components/structure/page-blocks';

// Mock SmartImage to avoid loading real images or complex element logic
vi.mock('@/components/elements/smartimage', () => ({
	SmartImage: (props: any) => {
		// Destructure to separate DOM-safe props from internal ones
		const { aboveFold, ...rest } = props;
		return <img {...rest} data-testid="smart-image" data-abovefold={aboveFold ? 'true' : 'false'} />;
	},
}));

describe('PageBg (unit)', () => {
	it('renders correctly with the page-bg class', () => {
		const { container } = render(<PageBg image="/images/test-background.png" />);
		const div = container.querySelector('.page-bg');
		expect(div).not.toBeNull();
	});

	it('renders a SmartImage with the provided image URL', () => {
		const testImage = '/images/3d-style-flowing-white-golden-wavy-background.png';
		render(<PageBg image={testImage} />);
		
		const img = screen.getByTestId('smart-image');
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute('src', testImage);
	});

	it('renders with correct default dimensions for the background image', () => {
		render(<PageBg image="/bg.png" />);
		
		const img = screen.getByTestId('smart-image');
		expect(img).toHaveAttribute('width', '1920');
		expect(img).toHaveAttribute('height', '1080');
	});

	it('marks the background image as above fold', () => {
		render(<PageBg image="/bg.png" />);
		
		const img = screen.getByTestId('smart-image');
		// aboveFold is passed as a prop, and in our mock it should be rendered as data-abovefold
		expect(img.getAttribute('data-abovefold')).toBe('true');
	});

	it('renders within a div having the correct CSS class for styling', () => {
		const { container } = render(<PageBg image="/bg.png" />);
		const div = container.firstChild as HTMLElement;
		expect(div.className).toBe('page-bg');
		expect(div.querySelector('.page-bg-image')).not.toBeNull();
	});
});

describe('PageTitleHeader (unit)', () => {
	it('renders as an h1 with the title text', () => {
		render(<PageTitleHeader title="Welcome to My Site" />);
		const header = screen.getByText('Welcome to My Site');
		expect(header.tagName).toBe('H1');
		expect(header.className).toBe('page-title-header');
	});

	it('renders as a link when url is provided', () => {
		render(<PageTitleHeader title="Linked Title" url="/home" />);
		const link = screen.getByRole('link');
		expect(link).toHaveAttribute('href', '/home');
		expect(link.querySelector('h1')).toHaveTextContent('Linked Title');
	});

	it('renders children if title is missing', () => {
		render(<PageTitleHeader>Child Title</PageTitleHeader>);
		expect(screen.getByText('Child Title')).toBeInTheDocument();
	});
});

describe('PageSectionHeader (unit)', () => {
	it('renders as an h2 with the title text', () => {
		render(<PageSectionHeader title="Section Info" />);
		const header = screen.getByText('Section Info');
		expect(header.tagName).toBe('H2');
		expect(header.className).toBe('page-section-header');
	});

	it('renders as a link when url is provided', () => {
		render(<PageSectionHeader title="Linked Section" url="/section" />);
		const link = screen.getByRole('link');
		expect(link).toHaveAttribute('href', '/section');
		expect(link.querySelector('h2')).toHaveTextContent('Linked Section');
	});
});

describe('PageSection (unit)', () => {
	it('renders as a section with children', () => {
		const { container } = render(
			<PageSection id="test-section">
				<div data-testid="child">Child Content</div>
			</PageSection>
		);
		const section = container.querySelector('section');
		expect(section).toBeInTheDocument();
		expect(section?.id).toBe('test-section');
		expect(screen.getByTestId('child')).toBeInTheDocument();
	});

	it('applies background color style when provided', () => {
		const { container } = render(<PageSection background="red" />);
		const section = container.querySelector('section');
		expect(section?.style.background).toBe('red');
	});

	it('renders with flex layout class when layoutType is flex', () => {
		const { container } = render(<PageSection layoutType="flex" />);
		const section = container.querySelector('section');
		expect(section?.className).toContain('page-section-flex');
	});
});



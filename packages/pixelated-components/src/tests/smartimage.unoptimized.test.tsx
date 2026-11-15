import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@/test/test-utils';

vi.mock('next/image', () => ({
	default: vi.fn((props: any) => {
		const { unoptimized, ...rest } = props;
		return React.createElement('img', { 'data-nimg': true, ...rest });
	})
}));

vi.mock('@/components/integrations/cloudinary', () => ({
	buildCloudinaryUrl: vi.fn(),
}));

import nextImage from 'next/image';
import { SmartImage } from '@/components/elements/smartimage';
import { buildCloudinaryUrl } from '@/components/integrations/cloudinary';
import { mockCloudinary, pixelatedConfig } from '@/test/test-data';

const mockedNextImage = vi.mocked(nextImage);
const mockBuildCloudinaryUrl = vi.mocked(buildCloudinaryUrl);

const renderSmartImage = (ui: React.ReactElement, options = {}) => {
	const config = {
		...pixelatedConfig,
		integrations: {
			...pixelatedConfig.integrations,
			cloudinary: mockCloudinary
		}
	};
	return render(ui, { config: config as any, ...options });
};

describe('SmartImage Cloudinary loader', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockBuildCloudinaryUrl.mockReturnValue('https://res.cloudinary.com/test/image/upload/f_auto,c_limit,q_75/https://example.com/test-image.jpg');
	});

	it('should pass a Cloudinary loader to next/image for cloudinary variant', () => {
		renderSmartImage(<SmartImage src="https://example.com/test-image.jpg" alt="Test image" variant="cloudinary" />);
		expect(mockedNextImage).toHaveBeenCalled();
		expect(mockedNextImage.mock.calls[0][0]).toEqual(expect.objectContaining({
			src: 'https://res.cloudinary.com/test/image/upload/f_auto,c_limit,q_75/https://example.com/test-image.jpg',
			loader: expect.any(Function),
		}));
	});

	it('should generate requested Cloudinary widths through the Next loader', () => {
		mockBuildCloudinaryUrl.mockImplementation(({ width, quality }) =>
			`https://res.cloudinary.com/test/image/upload/f_auto,c_limit,q_${quality ?? 75}/w_${width}/https://example.com/test-image.jpg`
		);
		renderSmartImage(<SmartImage src="https://example.com/test-image.jpg" alt="Test image" variant="cloudinary" />);
		expect(mockedNextImage).toHaveBeenCalled();
		const loader = mockedNextImage.mock.calls[0][0].loader;
		expect(loader).toEqual(expect.any(Function));
		expect(loader?.({
			src: 'ignored-by-cloudinary-loader',
			width: 960,
			quality: 80,
		})).toBe('https://res.cloudinary.com/test/image/upload/f_auto,c_limit,q_80/w_960/https://example.com/test-image.jpg');
	});

	it('should not pass a Cloudinary loader when the builder returns the original src', () => {
		mockBuildCloudinaryUrl.mockReturnValue('https://example.com/test-image.jpg');
		renderSmartImage(<SmartImage src="https://example.com/test-image.jpg" alt="Test image" variant="cloudinary" />);
		expect(mockedNextImage).toHaveBeenCalled();
		expect(mockedNextImage.mock.calls[0][0]).not.toHaveProperty('loader');
		expect(mockedNextImage.mock.calls[0][0].src).toBe('https://example.com/test-image.jpg');
	});

	it('should not pass unoptimized to next/image for nextjs variant', () => {
		renderSmartImage(<SmartImage src="https://example.com/test-image.jpg" alt="Test image" variant="nextjs" />);
		expect(mockedNextImage).toHaveBeenCalled();
		expect(mockedNextImage.mock.calls[0][0]).not.toHaveProperty('unoptimized', true);
		expect(mockedNextImage.mock.calls[0][0]).not.toHaveProperty('loader');
	});

	it('should render plain img for img variant without calling next/image', () => {
		renderSmartImage(<SmartImage src="https://example.com/test-image.jpg" alt="Test image" variant="img" />);
		expect(mockedNextImage).not.toHaveBeenCalled();
	});
});

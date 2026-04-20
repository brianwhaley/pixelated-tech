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
import { SmartImage } from '@/components/general/smartimage';
import { buildCloudinaryUrl } from '@/components/integrations/cloudinary';
import { mockCloudinary } from '@/test/test-data';

const mockedNextImage = vi.mocked(nextImage);
const mockBuildCloudinaryUrl = vi.mocked(buildCloudinaryUrl);

const renderSmartImage = (ui: React.ReactElement, options = {}) => {
	return render(ui, { config: { cloudinary: mockCloudinary }, ...options });
};

describe('SmartImage unoptimized regression', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockBuildCloudinaryUrl.mockReturnValue('https://res.cloudinary.com/test/image/upload/f_auto,c_limit,q_75/https://example.com/test-image.jpg');
	});

	it('should pass unoptimized to next/image for cloudinary variant', () => {
		renderSmartImage(<SmartImage src="https://example.com/test-image.jpg" alt="Test image" variant="cloudinary" />);
		expect(mockedNextImage).toHaveBeenCalled();
		expect(mockedNextImage.mock.calls[0][0]).toEqual(expect.objectContaining({
			unoptimized: true,
			src: 'https://res.cloudinary.com/test/image/upload/f_auto,c_limit,q_75/https://example.com/test-image.jpg',
		}));
	});

	it('should use a direct Cloudinary URL for cloudinary variant', () => {
		renderSmartImage(<SmartImage src="https://example.com/test-image.jpg" alt="Test image" variant="cloudinary" />);
		expect(mockedNextImage).toHaveBeenCalled();
		expect(mockedNextImage.mock.calls[0][0].src).toBe('https://res.cloudinary.com/test/image/upload/f_auto,c_limit,q_75/https://example.com/test-image.jpg');
	});

	it('should not pass unoptimized to next/image for nextjs variant', () => {
		renderSmartImage(<SmartImage src="https://example.com/test-image.jpg" alt="Test image" variant="nextjs" />);
		expect(mockedNextImage).toHaveBeenCalled();
		expect(mockedNextImage.mock.calls[0][0]).not.toHaveProperty('unoptimized', true);
	});

	it('should render plain img for img variant without calling next/image', () => {
		renderSmartImage(<SmartImage src="https://example.com/test-image.jpg" alt="Test image" variant="img" />);
		expect(mockedNextImage).not.toHaveBeenCalled();
	});
});

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithConfig } from '@/test/test-utils';
import { SmartImage } from '@/components/elements/smartimage';
import { pixelatedConfig } from '@/test/test-data';

vi.mock('next/image', () => ({
	default: React.forwardRef<HTMLImageElement, Record<string, any>>((props, ref) => {
		const { loader, onError, ...imageProps } = props;
		React.useLayoutEffect(() => {
			if (loader) {
				onError?.(new Event('error'));
			}
		}, [loader, onError]);
		return <img {...imageProps} ref={ref} data-nimg="1" />;
	}),
}));

vi.mock('@/components/integrations/cloudinary', () => ({
	buildCloudinaryUrl: vi.fn(() => 'https://res.cloudinary.com/test/invalid-image.jpg'),
	DEFAULT_CLOUDINARY_DOMAIN: 'https://res.cloudinary.com/',
	DEFAULT_CLOUDINARY_TRANSFORMS: 'f_auto,c_limit,q_auto,dpr_auto',
}));

describe('SmartImage fallback lifecycle', () => {
	it('keeps the Next.js fallback when Cloudinary fails before the initial effect runs', () => {
		renderWithConfig(
			<SmartImage
				src="/images/logo/three-muses-color-round.png"
				alt="Three Muses logo"
			/>,
			pixelatedConfig as any,
		);

		const image = screen.getByAltText('Three Muses logo');
		expect(image).toHaveAttribute('data-nimg');
		expect(image).toHaveAttribute('src', '/images/logo/three-muses-color-round.png');
	});
});

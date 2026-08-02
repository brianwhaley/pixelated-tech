import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { renderWithProviders } from '../test/test-utils';
import { FacebookPixel } from '../components/integrations/facebookpixel';

describe('FacebookPixel component', () => {
	afterEach(() => {
		document.head.innerHTML = '';
		document.body.innerHTML = '';
	});

	it('injects the Facebook Pixel init script and tracks PageView by default', async () => {
		renderWithProviders(<FacebookPixel pixelId="123456789012345" />);

		const script = await document.head.querySelector('#facebook-pixel-init');
		expect(script).not.toBeNull();
		if (script) {
			expect(script.tagName).toBe('SCRIPT');
			expect(script.textContent).toContain("fbq('init', '123456789012345')");
			expect(script.textContent).toContain("fbq('track', 'PageView')");
		}
	});

	it('does not render a noscript fallback when PageView tracking is disabled', async () => {
		renderWithProviders(<FacebookPixel pixelId="987654321098765" trackPageView={false} />);

		const noscript = document.querySelector('noscript');
		expect(noscript).toBeNull();
	});
});

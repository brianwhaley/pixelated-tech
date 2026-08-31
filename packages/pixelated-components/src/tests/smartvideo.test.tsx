import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@/test/test-utils';
import { screen, fireEvent } from '@testing-library/react';
import { SmartVideo } from '@/components/elements/smartvideo';

vi.mock('@/components/integrations/cloudinary', () => ({
	buildCloudinaryUrl: vi.fn(),
}));

import { buildCloudinaryUrl } from '@/components/integrations/cloudinary';
const mockBuildCloudinaryUrl = vi.mocked(buildCloudinaryUrl);

const cloudinaryConfig = {
	integrations: {
		cloudinary: {
			product_env: 'test-env',
			baseUrl: 'https://res.cloudinary.com/test/',
			transforms: 'f_auto,c_limit,q_auto,dpr_auto',
		},
	},
};

const renderSmartVideo = (ui: React.ReactElement, options = {}) =>
	render(ui, { config: cloudinaryConfig, ...options });

describe('SmartVideo Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockBuildCloudinaryUrl.mockImplementation(({ src }) => `https://res.cloudinary.com/test/video/f_auto,c_limit,q_75/${src}`);
	});

	it('renders a video element with the provided src', () => {
		const { container } = renderSmartVideo(
			<SmartVideo src="https://example.com/test-video.mp4" poster="https://example.com/poster.jpg" variant="html" />
		);
		const video = container.querySelector('video');
		expect(video).not.toBeNull();
		expect(video).toHaveAttribute('src', 'https://example.com/test-video.mp4');
		expect(video).toHaveAttribute('poster', 'https://example.com/poster.jpg');
	});

	it('uses Cloudinary for cloudinary variant when config is available', () => {
		const { container } = renderSmartVideo(
			<SmartVideo src="https://example.com/test-video.mp4" poster="https://example.com/poster.jpg" variant="cloudinary" />
		);
		const video = container.querySelector('video');
		expect(video).not.toBeNull();
		expect(mockBuildCloudinaryUrl).toHaveBeenCalledTimes(2);
		expect(video).toHaveAttribute('src', 'https://res.cloudinary.com/test/video/f_auto,c_limit,q_75/https://example.com/test-video.mp4');
		expect(video).toHaveAttribute('poster', 'https://res.cloudinary.com/test/video/f_auto,c_limit,q_75/https://example.com/poster.jpg');
	});

	it('falls back to html variant when Cloudinary config is missing', () => {
		const { container } = render(
			<SmartVideo src="https://example.com/test-video.mp4" poster="https://example.com/poster.jpg" variant="cloudinary" />,
			{ config: { integrations: { cloudinary: undefined } } }
		);
		const video = container.querySelector('video');
		expect(video).not.toBeNull();
		expect(video).toHaveAttribute('src', 'https://example.com/test-video.mp4');
		expect(mockBuildCloudinaryUrl).not.toHaveBeenCalled();
	});

	it('normalizes protocol-relative URLs to https', () => {
		const { container } = renderSmartVideo(
			<SmartVideo src="//example.com/test-video.mp4" variant="html" />
		);
		const video = container.querySelector('video');
		expect(video).not.toBeNull();
		expect(video?.getAttribute('src')).toContain('https://example.com/test-video.mp4');
	});

	it('sets preload to auto when aboveFold is true', () => {
		const { container } = renderSmartVideo(
			<SmartVideo src="https://example.com/test-video.mp4" variant="html" aboveFold />
		);
		const video = container.querySelector('video');
		expect(video).not.toBeNull();
		expect(video).toHaveAttribute('preload', 'auto');
	});

	it('falls back from Cloudinary to html on video error', () => {
		const { container } = renderSmartVideo(
			<SmartVideo src="https://example.com/test-video.mp4" poster="https://example.com/poster.jpg" variant="cloudinary" />
		);
		const video = container.querySelector('video');
		expect(video).not.toBeNull();
		fireEvent.error(video!);
		// After fallback, src should update to the plain source.
		const updated = container.querySelector('video');
		expect(updated).not.toBeNull();
		expect(updated).toHaveAttribute('src', 'https://example.com/test-video.mp4');
	});

	it('renders JSON-LD schema with caption when caption prop is provided', () => {
		const { container } = renderSmartVideo(
			<SmartVideo
				src="https://example.com/test-video.mp4"
				poster="https://example.com/poster.jpg"
				variant="html"
				title="Test Video"
				description="A sample video"
				uploadDate="2025-01-01"
				duration="PT2M"
				caption="Sample caption"
			/>
		);
		const script = container.querySelector('script[type="application/ld+json"]');
		expect(script).not.toBeNull();
		const json = JSON.parse(script!.textContent || '{}');
		expect(json.caption).toBe('Sample caption');
		expect(json.name).toBe('Test Video');
		expect(json.duration).toBe('PT2M');
	});

	it('renders JSON-LD schema with title, description, uploadDate, and duration', () => {
		const { container } = renderSmartVideo(
			<SmartVideo
				src="https://example.com/test-video.mp4"
				poster="https://example.com/poster.jpg"
				variant="html"
				title="Test Video"
				description="A sample video"
				uploadDate="2025-01-01"
				duration="PT2M"
			/>
		);
		const script = container.querySelector('script[type="application/ld+json"]');
		expect(script).not.toBeNull();
		const json = JSON.parse(script!.textContent || '{}');
		expect(json.name).toBe('Test Video');
		expect(json.description).toBe('A sample video');
		expect(json.uploadDate).toBe('2025-01-01');
		expect(json.duration).toBe('PT2M');
	});

	it('supports optional controls and loop props', () => {
		const { container } = renderSmartVideo(
			<SmartVideo src="https://example.com/test-video.mp4" variant="html" controls loop muted />
		);
		const video = container.querySelector('video');
		expect(video).toHaveAttribute('controls');
		expect(video).toHaveAttribute('loop');
		expect(video?.muted).toBe(true);
	});
});

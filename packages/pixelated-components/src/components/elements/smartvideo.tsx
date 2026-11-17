'use client';

import React from 'react';
import PropTypes, { InferProps } from 'prop-types';
import {
	buildCloudinaryUrl,
	buildCloudinaryVideoPosterUrl,
	DEFAULT_CLOUDINARY_DOMAIN,
	DEFAULT_CLOUDINARY_TRANSFORMS,
} from '../integrations/cloudinary';
import { usePixelatedConfig } from '../config/config.client';
import {
	parseNumber,
	safeString,
	sanitizeMediaString,
	normalizeProtocolRelativeUrl,
	deriveMediaId,
	SmartMediaUtilsPropTypes,
} from './smartmediautils';
import { SchemaVideoObject } from '../foundation/schema';

const debug = false;


export type SmartVideoVariant = 'cloudinary' | 'html';


/**
 * SmartVideo — selects Cloudinary or browser HTML video delivery before rendering.
 *
 * @param {string} [props.cloudinaryEnv] - Cloudinary environment key for URL generation.
 * @param {string} [props.cloudinaryDomain] - Cloudinary domain override.
 * @param {string} [props.cloudinaryTransforms] - Optional Cloudinary transform presets.
 * @param {string} props.src - Source URL or path for the video.
 * @param {string} [props.poster] - Poster image URL shown before playback starts.
 * @param {boolean} [props.autoPlay] - Whether the video should autoplay.
 * @param {boolean} [props.muted] - Whether the video should start muted.
 * @param {boolean} [props.loop] - Whether the video should loop playback.
 * @param {boolean} [props.controls] - Whether playback controls should be visible.
 * @param {boolean} [props.playsInline] - Whether the video should play inline on mobile.
 * @param {oneOf} [props.preload] - The preload option: 'auto', 'metadata', or 'none'.
 * @param {string} [props.captionsSrc] - Optional captions track source URL.
 * @param {string} [props.className] - Optional CSS class name for the rendered video element.
 */
SmartVideo.propTypes = {
	...SmartMediaUtilsPropTypes,
	poster: PropTypes.string,
	autoPlay: PropTypes.bool,
	muted: PropTypes.bool,
	loop: PropTypes.bool,
	controls: PropTypes.bool,
	playsInline: PropTypes.bool,
	preload: PropTypes.oneOf(['auto', 'metadata', 'none']),
	captionsSrc: PropTypes.string,
	title: PropTypes.string,
	description: PropTypes.string,
	uploadDate: PropTypes.string,
	duration: PropTypes.string,
	caption: PropTypes.string,
	className: PropTypes.string,
};
export type SmartVideoType = InferProps<typeof SmartVideo.propTypes> & React.VideoHTMLAttributes<HTMLVideoElement>;
export function SmartVideo(props: SmartVideoType) {
	const config = usePixelatedConfig();
	const cloudCfg = config?.integrations?.cloudinary;
	const normalizedSrc = normalizeProtocolRelativeUrl(safeString(props.src) ?? '');
	const normalizedPoster = props.poster ? normalizeProtocolRelativeUrl(safeString(props.poster) ?? '') : undefined;
	const cloudinaryEnv = safeString(props.cloudinaryEnv ?? cloudCfg?.product_env);
	const cloudinaryDomain = safeString(props.cloudinaryDomain ?? cloudCfg?.baseUrl) ?? DEFAULT_CLOUDINARY_DOMAIN;
	const hasCloudinary = Boolean(cloudinaryEnv);
	const variant: SmartVideoVariant = props.variant === 'html' || !hasCloudinary ? 'html' : 'cloudinary';
	const width = parseNumber(props.width ?? 1280);
	const height = parseNumber(props.height ?? 720);
	const quality = parseNumber(props.quality ?? 75);
	const transforms = safeString(props.cloudinaryTransforms) || DEFAULT_CLOUDINARY_TRANSFORMS;
	const preload = safeString(props.preload) as 'auto' | 'metadata' | 'none' | undefined;
	const id = deriveMediaId({ id: props.id, name: safeString(props.name), title: props.title, alt: undefined, src: normalizedSrc });
	const posterSrc = normalizedPoster;
	const title = safeString(props.title) || undefined;

	const videoSrc = variant === 'cloudinary'
		? buildCloudinaryUrl({
			src: normalizedSrc,
			productEnv: cloudinaryEnv,
			cloudinaryDomain,
			quality,
			width,
			transforms,
			origin: config?.siteInfo?.url,
		})
		: normalizedSrc;
	const posterUrl = variant === 'cloudinary'
		? normalizedPoster
			? buildCloudinaryUrl({
				src: normalizedPoster,
				productEnv: cloudinaryEnv,
				cloudinaryDomain,
				quality,
				width,
				transforms,
				origin: config?.siteInfo?.url,
			})
			: buildCloudinaryVideoPosterUrl({
				src: normalizedSrc,
				productEnv: cloudinaryEnv,
				cloudinaryDomain,
				quality,
				width,
				seconds: 1,
				origin: config?.siteInfo?.url,
			})
		: normalizedPoster;

	const videoProps: React.VideoHTMLAttributes<HTMLVideoElement> = {
		id: id || undefined,
		className: safeString(props.className) || 'smart-video',
		style: props.style,
		title,
		src: videoSrc,
		poster: posterUrl,
		autoPlay: props.autoPlay ?? false,
		muted: props.muted ?? false,
		loop: props.loop ?? false,
		controls: props.controls ?? true,
		playsInline: props.playsInline ?? true,
		preload: preload || (props.aboveFold ? 'auto' : 'metadata'),
		width: width,
		height: height,
		onError: (event) => {
			if (debug) console.warn(`SmartVideo: ${variant} video failed for "${videoSrc}"`, event);
			if (props.onError) props.onError(event);
		},
	};

	const videoKey = `variant-${variant}-${id || 'video'}`;

	return (
		<>
			<SchemaVideoObject
				contentUrl={videoSrc}
				title={props.title || title}
				name={props.title || title}
				description={props.description}
				thumbnailUrl={posterUrl}
				uploadDate={props.uploadDate}
				duration={props.duration}
				caption={props.caption}
			/>
			<video key={videoKey} suppressHydrationWarning={true} {...videoProps}>
				<track
					kind="captions"
					src={props.captionsSrc ?? undefined}
					srcLang="en"
					label="English captions"
					default
				/>
				Your browser does not support the HTML5 Video element.
			</video>
		</>
	);
}

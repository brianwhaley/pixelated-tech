import PropTypes, { InferProps } from 'prop-types';

/* 
https://cloudinary.com/blog/transparent_webp_format_cdn_delivery_based_on_visitors_browsers
https://cloudinary.com/blog/delivering_all_your_websites_images_through_a_cdn
*/

export const DEFAULT_CLOUDINARY_DOMAIN = 'https://res.cloudinary.com/';
export const DEFAULT_CLOUDINARY_TRANSFORMS = 'f_auto,c_limit,q_auto,dpr_auto';
const cloudinary_props = `/image/fetch/${DEFAULT_CLOUDINARY_TRANSFORMS}`;


function joinWithSlash(a: string, b: string) {
	return `${a.replace(/\/+$/,'')}/${b.replace(/^\/+/, '')}`;
}

function isAbsoluteUrl(value: string) {
	return /^https?:\/\//i.test(value) || /^\/\//.test(value);
}

export function buildCloudinaryUrl(params: { src: string; productEnv: string | null | undefined; cloudinaryDomain?: string; quality?: number | null; width?: number | null; transforms?: string | null; origin?: string; }) {
	const { src, productEnv, cloudinaryDomain = DEFAULT_CLOUDINARY_DOMAIN, quality = 75, width, transforms, origin: configuredOrigin } = params;

	// Must have cloudinary product env to build URL
	if (!productEnv) return src;

	const origin = typeof window !== 'undefined' ? window.location.origin : configuredOrigin ?? '';
	if (!(isAbsoluteUrl(src)) && !origin) return src;

	// Don't fetch from cloudinary during local dev
	// if (origin.includes("localhost") || origin.includes("127.0.0.1") || origin.includes("192.168")) return src;

	let url = src;
	if (!(isAbsoluteUrl(src))) {
		url = src.startsWith('/') ? `${origin}${src}` : `${origin}/${src}`;
	}

	if (/^\/\//.test(url)) { url = `https:${url}`; }

	const q = typeof quality === 'number' ? quality : 75;
	const parts: string[] = ['f_auto', 'c_limit', `q_${q}`, 'dpr_auto'];
	if (typeof width === 'number' && Number.isFinite(width)) parts.push(`w_${width}`);
	// split transforms by comma and clean empty and whitespace
	const transformArray = transforms ? transforms.split(',').map(s => s.trim()).filter(Boolean) : [];
	for (const transform of transformArray) {
		if (!transform) continue;
		// If the exact transform already exists, nothing to do.
		if (parts.includes(transform)) continue;
		// Check for a prefix match (anything before and including the first underscore).
		const underscoreIndex = transform.indexOf('_');
		if (underscoreIndex !== -1) {
			const prefix = transform.slice(0, underscoreIndex + 1); // e.g. 'q_' or 'w_'
			const prefixIdx = parts.findIndex(p => p.startsWith(prefix));
			if (prefixIdx !== -1) {
				// Replace the existing part that shares the same prefix.
				parts[prefixIdx] = transform;
				continue;
			}
		}
		// No exact or prefix match found — append.
		parts.push(transform);
	}
	const t = parts.length ? parts.join(',') : '';
	const domainAndCloud = productEnv ? joinWithSlash(cloudinaryDomain, productEnv) : cloudinaryDomain;
	const encodedUrl = url.includes("?") ? encodeURIComponent(url) : url;

	// Decide whether this is a video or an image by extension and use the appropriate Cloudinary fetch endpoint.
	// Use `/video/fetch` for common video types, `/image/fetch` for images and other content.
	const videoExtRe = /\.(mp4|webm|mov|m4v)(?:\?.*)?$/i;
	const isVideo = videoExtRe.test(url);
	const fetchType = isVideo ? 'video' : 'image';
	return `${domainAndCloud}/${fetchType}/fetch/${t}/${encodedUrl}`;
}

export function buildCloudinaryVideoPosterUrl(params: {
	src: string;
	productEnv: string | null | undefined;
	cloudinaryDomain?: string;
	quality?: number | null;
	width?: number | null;
	seconds?: number | null;
	origin?: string;
}) {
	const {
		src,
		productEnv,
		cloudinaryDomain = DEFAULT_CLOUDINARY_DOMAIN,
		quality = 75,
		width,
		seconds = 1,
		origin: configuredOrigin,
	} = params;

	if (!productEnv) return src;

	const origin = typeof window !== 'undefined' ? window.location.origin : configuredOrigin ?? '';
	if (!isAbsoluteUrl(src) && !origin) return src;

	let url = src;
	if (!isAbsoluteUrl(src)) {
		url = src.startsWith('/') ? `${origin}${src}` : `${origin}/${src}`;
	}

	if (/^\/\//.test(url)) {
		url = `https:${url}`;
	}

	const frame = typeof seconds === 'number' && Number.isFinite(seconds) && seconds >= 0 ? seconds : 1;
	const parts = [`so_${frame}`, 'f_jpg', 'c_limit', `q_${typeof quality === 'number' ? quality : 75}`];
	if (typeof width === 'number' && Number.isFinite(width)) {
		parts.push(`w_${width}`);
	}

	const domainAndCloud = joinWithSlash(cloudinaryDomain, productEnv);
	const encodedUrl = encodeURIComponent(url);
	return `${domainAndCloud}/video/fetch/${parts.join(',')}/${encodedUrl}.jpg`;
}



/**
 * getCloudinaryRemoteFetchURL — Build a Cloudinary remote fetch URL for a provided image path.
 *
 * @param {string} [props.url] - Image URL or path to convert to Cloudinary fetch URL.
 * @param {string} [props.product_env] - Cloudinary product environment (cloud name) to use when building the URL.
 */
getCloudinaryRemoteFetchURL.propTypes = {
/** Image URL or path to transform via Cloudinary */
	url: PropTypes.string.isRequired,
	/** Cloudinary product environment (cloud name) */
	product_env: PropTypes.string.isRequired
};
export type getCloudinaryRemoteFetchURLType = InferProps<typeof getCloudinaryRemoteFetchURL.propTypes>;
export function getCloudinaryRemoteFetchURL(props: getCloudinaryRemoteFetchURLType) {
	const domainAndCloud = joinWithSlash(DEFAULT_CLOUDINARY_DOMAIN, props.product_env);
 	const cloudinary_prefix = domainAndCloud + cloudinary_props;
 	const result = cloudinary_prefix + '/' + props.url;
 	return result;
}


export function userIsMobile() {
	let match = false;
	if (typeof window !== 'undefined') {
		const mediaQuery = window.matchMedia('(max-width: 768px)'); // Example breakpoint
		match = mediaQuery.matches;
	}
	return match;
}


/**
 * loadAllImagesFromCloudinary — Replace <img> sources with Cloudinary-built remote fetch URLs for improved delivery in production.
 *
 * @param {string} [props.origin] - Optional origin to validate local development environments (ignored in local dev).
 * @param {string} [props.product_env] - Cloudinary product environment (cloud name) to use when building URLs.
 */
loadAllImagesFromCloudinary.propTypes = {
/** Optional origin string to detect local dev */
	origin: PropTypes.string,
	/** Cloudinary product environment (cloud name) */
	product_env: PropTypes.string.isRequired
};
export type loadAllImagesFromCloudinaryType = InferProps<typeof loadAllImagesFromCloudinary.propTypes>;
export function loadAllImagesFromCloudinary(props: loadAllImagesFromCloudinaryType){
	const origin = typeof window !== 'undefined' ? window.location.origin : document.location.origin;
	if(origin && origin.includes("localhost")) { return; } // do nothing in local dev 
	const images = document.querySelectorAll('img');
	images.forEach(img => {
		const currentSrc = img.getAttribute('src') || '';
		if (!currentSrc) return;

		// Use the shared builder so all Cloudinary URLs are consistent.
		const built = buildCloudinaryUrl({
			src: currentSrc,
			productEnv: props.product_env,
			cloudinaryDomain: DEFAULT_CLOUDINARY_DOMAIN,
			// keep other options default (quality/width/transforms) for now
		});

		// If builder returned a new URL, update the image src.
		if (built && built !== currentSrc) {
			img.setAttribute('src', built);
		}
	});
}

"use server";

import { buildCloudinaryUrl } from './cloudinary';
import { smartFetch } from '../foundation/smartfetch';

export type CloudinaryTransformedImage = {
	url: string;
	buffer: Buffer;
	mimeType: 'image/webp';
};

export async function downloadCloudinaryTransformedImage(input: {
	sourceUrl: string;
	productEnv: string;
	cloudinaryDomain?: string;
}): Promise<CloudinaryTransformedImage> {
	if (!input.sourceUrl || !input.productEnv) {
		throw new Error('Cloudinary image transformation requires sourceUrl and productEnv');
	}
	const url = buildCloudinaryUrl({
		src: input.sourceUrl,
		productEnv: input.productEnv,
		cloudinaryDomain: input.cloudinaryDomain,
		width: 2500,
		transforms: 'h_2500,c_limit,f_webp,q_auto',
	});
	const source = await smartFetch(url, {
		responseType: 'arrayBuffer',
		timeout: 60000,
		retries: 0,
	});
	return {
		url,
		buffer: Buffer.from(source as ArrayBuffer),
		mimeType: 'image/webp',
	};
}

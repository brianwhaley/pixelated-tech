import type { NextConfig } from "next";
import { getBaseNextConfig } from '../../shared/configs/next.config.base';

const nextConfig: NextConfig = {
	...getBaseNextConfig(),
	serverExternalPackages: ['ssh2'],
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{
						key: 'X-Frame-Options',
						value: 'DENY',
					},
					{
						key: 'X-Content-Type-Options',
						value: 'nosniff',
					},
					{
						key: 'Referrer-Policy',
						value: 'strict-origin-when-cross-origin',
					},
					{
						key: 'Permissions-Policy',
						value: 'camera=(), microphone=(), geolocation=()',
					},
				],
			},
		];
	},
	async redirects() {
		return [];
	},
};

export default nextConfig;

import type { NextConfig } from "next";
import path from 'path';
import { getBaseNextConfig } from '../../shared/configs/next.config.base';

const nextConfig: NextConfig = {
	...getBaseNextConfig(),
	// Admin deployment tracing is intentionally narrower than the shared monorepo root.
	// Keep this app-specific until every server route has been verified after deployment.
	outputFileTracingRoot: path.resolve(__dirname),
	serverExternalPackages: ['ssh2'],
	env: {
		NEXTAUTH_URL: process.env.NEXTAUTH_URL,
	},
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

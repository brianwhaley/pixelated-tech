import type { NextConfig } from "next";
import { getBaseNextConfig } from '../../shared/configs/next.config.base';

const nextConfig: NextConfig = {
	...getBaseNextConfig(),
	reactStrictMode: true,
	async headers() {
		return [
			{
				source: '/events/report',
				headers: [{
					key: 'Cache-Control',
					value: 'no-store, no-cache, max-age=0, s-maxage=0, must-revalidate',
				},{
					key: 'Pragma',
					value: 'no-cache',
				},{
					key: 'Expires',
					value: '0',
				}],
			},
			{
				source: '/events/report/:path*',
				headers: [{
					key: 'Cache-Control',
					value: 'no-store, no-cache, max-age=0, s-maxage=0, must-revalidate',
				},{
					key: 'Pragma',
					value: 'no-cache',
				},{
					key: 'Expires',
					value: '0',
				}],
			},
		];
	},
	async redirects() {
		return [
			{
				source: '/:path*',
				has: [
					{ type: 'host', value: 'main.d17pj30yytnnjd.amplifyapp.com' },
				],
				destination: 'https://www.thethreemusesofbluffton.com/:path*',
				permanent: true,
			},
    	];
	},
};

export default nextConfig;

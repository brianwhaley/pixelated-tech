import type { NextConfig } from "next";
import path from "path";
import { getBaseNextConfig } from '../../shared/configs/next.config.base';

const baseConfig = getBaseNextConfig();
const nextConfig: NextConfig = {
	...baseConfig,
	webpack: (config: any, options: any) => {
		config = baseConfig.webpack?.(config, options) ?? config;
		if (!config.resolve) config.resolve = {};
		if (!config.resolve.alias) config.resolve.alias = {};
		config.resolve.alias['@'] = path.resolve(__dirname, 'src');
		return config;
	},
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

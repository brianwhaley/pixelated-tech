import type { NextConfig } from "next";
import { getBaseNextConfig } from '../../shared/configs/next.config.base';

const nextConfig: NextConfig = {
	...getBaseNextConfig(),
	reactStrictMode: true,
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

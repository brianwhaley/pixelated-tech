import type { NextConfig } from "next";
import path from "path";
import { getBaseNextConfig } from '../../shared/configs/next.config.base';
import { withAmplifyHosting } from '@aws-amplify/adapter-nextjs';

const nextConfig: NextConfig = {
	...getBaseNextConfig(),
	webpack: (config: any) => {
		config.resolve.fallback = { fs: false, path: false };
		if (!config.resolve) config.resolve = {};
		if (!config.resolve.alias) config.resolve.alias = {};
		config.resolve.alias['@'] = path.resolve(__dirname, 'src');
		return config;
	},
	async redirects() {
		return [
			{ source: '/cart', destination: '/', permanent: true, },
			{ source: '/home', destination: '/', permanent: true, },
			{ source: '/donate', destination: '/', permanent: true, },
			{ source: '/services-5', destination: '/', permanent: true, },
			{ source: '/projects/category/Culture', destination: '/projects', permanent: true, },
			{ source: '/projects/category/Health', destination: '/projects', permanent: true, },
			{ source: '/projects/category/Relationships', destination: '/projects', permanent: true, },
			{ source: '/projects/tag/Jobs', destination: '/projects', permanent: true, },
			{ source: '/projects/the-beauty-vault-salon-june-2024', destination: '/projects/the%20beauty%20vault%20salon%20june%202024', permanent: true, },
		];
	},
};

export default withAmplifyHosting(nextConfig);

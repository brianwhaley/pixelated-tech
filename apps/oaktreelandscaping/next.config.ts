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
		return [];
	},
};

export default withAmplifyHosting(nextConfig);

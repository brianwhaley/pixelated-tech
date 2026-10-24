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
	async redirects() {
		return [];
	},
};

export default nextConfig;

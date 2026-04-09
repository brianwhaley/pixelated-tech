import type { NextConfig } from "next";
import { getBaseNextConfig } from '../../shared/configs/next.config.base';

const nextConfig: NextConfig = {
	...getBaseNextConfig(),
	reactStrictMode: true,
	async redirects() {
		return [];
	},
};

export default nextConfig;

import type { NextConfig } from "next";
import { getBaseNextConfig } from '../../shared/configs/next.config.base';

const nextConfig: NextConfig = {
	...getBaseNextConfig(),
	async redirects() {
		return [];
	},
};

export default nextConfig;

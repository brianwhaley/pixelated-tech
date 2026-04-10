import type { NextConfig } from "next";
import { getBaseNextConfig } from '../../shared/configs/next.config.base';
import { withAmplifyHosting } from '@aws-amplify/adapter-nextjs';

const nextConfig: NextConfig = {
	...getBaseNextConfig(),
	reactStrictMode: true,
	async redirects() {
		return [];
	},
};

export default withAmplifyHosting(nextConfig);

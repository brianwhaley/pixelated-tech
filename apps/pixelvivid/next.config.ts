import type { NextConfig } from "next";
import { getBaseNextConfig } from '../../shared/configs/next.config.base';
import { withAmplifyHosting } from '@aws-amplify/adapter-nextjs';

const nextConfig: NextConfig = {
	...getBaseNextConfig(),
	async redirects() {
		return [];
	},
};

export default withAmplifyHosting(nextConfig);

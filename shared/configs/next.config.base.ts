import type { NextConfig } from "next";
import path from "path";

/**
 * Base Next.js configuration shared by all apps in the monorepo
 * Apps should import and extend this with their app-specific settings
 * 
 * Note: webpack alias '@' must be configured by each app with correct path
 */
export function getBaseNextConfig(): NextConfig {
	return {
		experimental: {
			optimizeCss: false,
		},
		outputFileTracingRoot: path.resolve(__dirname, '../../'),
		outputFileTracingIncludes: {
			'/**': ['./src/app/config/pixelated.config.json.enc'],
		},
		transpilePackages: ['@pixelated-tech/components'],
		trailingSlash: false,
		typescript: {
			ignoreBuildErrors: true,
		},
		env: {
			PIXELATED_CONFIG_KEY: process.env.PIXELATED_CONFIG_KEY,
			AMPLIFY_MONOREPO_APP_ROOT: process.env.AMPLIFY_MONOREPO_APP_ROOT,
			AMPLIFY_DIFF_DEPLOY: process.env.AMPLIFY_DIFF_DEPLOY,
		},
		productionBrowserSourceMaps: true,
		images: {
			minimumCacheTTL: 2592000, // 1 month
			qualities: [25, 50, 75, 100],
			remotePatterns: [
				{
					protocol: 'https',
					hostname: '**',
					port: '',
					pathname: '**',
				},
			],
		},
	};
}

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
		return [
			{ source: '/promo.html', destination: '/', permanent: true },
			{ source: '/coronavirus.html', destination: '/', permanent: true },
			{ source: '/about-us.html', destination: '/about', permanent: true },
			{ source: '/painting-process.html', destination: '/our-process', permanent: true },
			{ source: '/reviews.html', destination: '/testimonials', permanent: true },
			{ source: '/appreciation-letters.html', destination: '/testimonials', permanent: true },
			{ source: '/gallery.html', destination: '/gallery', permanent: true },
			{ source: '/contact-us.html', destination: '/contact', permanent: true },
			{ source: '/services.html', destination: '/services', permanent: true },
			{ source: '/service-areas.html', destination: '/service-areas', permanent: true },
			{ source: '/exterior-painting-services-new-jersey.html', destination: '/services/exterior-painting', permanent: true },
			{ source: '/interior-painting-services-new-jersey.html', destination: '/services/interior-painting', permanent: true },
			{ source: '/crown-molding-wainscoting-services-new-jersey.html', destination: '/services/crown-molding-and-wainscoting', permanent: true },
			{ source: '/deck-staining-services-new-jersey.html', destination: '/services/deck-staining-and-restoration', permanent: true },
			{ source: '/custom-carpentry-services-new-jersey.html', destination: '/services/custom-carpentry', permanent: true },
			{ source: '/interior-painters-new-jersey.html', destination: '/about', permanent: true },
			{ source: '/professional-painters-new-jersey.html', destination: '/our-process', permanent: true },
			{ source: '/commercial-residential-painters-new-jersey.html', destination: '/gallery', permanent: true },
			{ source: '/best-painters-new-jersey.html', destination: '/contact', permanent: true },
			{ source: '/color-selection.html', destination: '/contact', permanent: true },
			{ source: '/commitment-to-quality.html', destination: '/about', permanent: true },
			{ source: '/:city-painters-carpenters.html', destination: '/service-areas/:city', permanent: true },
		];
	},
};

export default nextConfig;

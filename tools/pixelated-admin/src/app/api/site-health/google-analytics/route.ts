import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAnalyticsData, GoogleAnalyticsConfig } from '@pixelated-tech/components/adminserver';
import { getFullPixelatedConfig, getSiteConfig } from '@pixelated-tech/components/server';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const siteName = searchParams.get('siteName');
		const startDate = searchParams.get('startDate');
		const endDate = searchParams.get('endDate');

		if (!siteName) {
			return NextResponse.json({ success: false, error: 'siteName required' }, { status: 400 });
		}

		const site = await getSiteConfig(siteName);
		if (!site) {
			return NextResponse.json({ success: false, error: 'Site not found' }, { status: 404 });
		}

		const fullConfig = getFullPixelatedConfig();
		const integrations = (fullConfig.integrations || {}) as any;
		const googleCfg = (integrations.google || {}) as any;
		const gaCfg = (integrations.googleAnalytics || {}) as any;

		const config: GoogleAnalyticsConfig = {
			ga4PropertyId: site.ga4PropertyId,
			serviceAccountKey: gaCfg.serviceAccountKey || googleCfg.serviceAccountKey,
			clientId: googleCfg.client_id,
			clientSecret: googleCfg.client_secret,
			refreshToken: googleCfg.refresh_token,
		};

		if (!config.serviceAccountKey && !(config.clientId && config.clientSecret && config.refreshToken)) {
			return NextResponse.json({ success: false, error: 'Google credentials not configured in pixelated.config.json' }, { status: 500 });
		}

		// Call the integration
		const result = await getGoogleAnalyticsData(config, siteName, startDate || undefined, endDate || undefined);

		if (!result.success) {
			return NextResponse.json({ success: false, error: result.error }, { status: 500 });
		}

		return NextResponse.json({ success: true, data: result.data });

	} catch (error) {
		console.error('Google Analytics API error:', error);
		return NextResponse.json({
			success: false,
			error: error instanceof Error ? error.message : 'Failed to fetch analytics data'
		}, { status: 500 });
	}
}
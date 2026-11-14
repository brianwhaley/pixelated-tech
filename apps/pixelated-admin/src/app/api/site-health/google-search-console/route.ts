import { NextRequest, NextResponse } from 'next/server';
import { getSearchConsoleData, SearchConsoleConfig } from '@pixelated-tech/components/adminserver';
import { getFullPixelatedConfig, getSiteConfig } from '@pixelated-tech/components/server';

function getMonthRange(startDate: string, endDate: string) {
	const startMatch = /^(\d{4})-(0[1-9]|1[0-2])-01$/.exec(startDate);
	const endMatch = /^(\d{4})-(0[1-9]|1[0-2])-(\d{2})$/.exec(endDate);
	if (!startMatch || !endMatch || startMatch[1] !== endMatch[1] || startMatch[2] !== endMatch[2]) {
		throw new Error('startDate and endDate must describe a complete calendar month');
	}

	const year = Number(startMatch[1]);
	const month = Number(startMatch[2]);
	const expectedEndDate = new Date(Date.UTC(year, month, 0)).toISOString().split('T')[0];
	if (endDate !== expectedEndDate) {
		throw new Error('startDate and endDate must describe a complete calendar month');
	}

	const previousMonthDate = new Date(Date.UTC(year, month - 2, 1));
	const previousYear = previousMonthDate.getUTCFullYear();
	const previousMonth = previousMonthDate.getUTCMonth() + 1;
	const formatMonth = (monthNumber: number) => String(monthNumber).padStart(2, '0');
	const getEndDate = (rangeYear: number, rangeMonth: number) =>
		new Date(Date.UTC(rangeYear, rangeMonth, 0)).toISOString().split('T')[0];

	return {
		current: {
			label: startDate.slice(0, 7),
			startDate,
			endDate: getEndDate(year, month),
		},
		previous: {
			label: `${previousYear}-${formatMonth(previousMonth)}`,
			startDate: `${previousYear}-${formatMonth(previousMonth)}-01`,
			endDate: getEndDate(previousYear, previousMonth),
		},
	};
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const siteName = searchParams.get('siteName');
		const startDate = searchParams.get('startDate');
		const endDate = searchParams.get('endDate');

		if (!siteName || !startDate || !endDate) {
			return NextResponse.json({ success: false, error: 'siteName, startDate, and endDate are required' }, { status: 400 });
		}

		const site = await getSiteConfig(siteName);
		if (!site) {
			return NextResponse.json({ success: false, error: 'Site not found' }, { status: 404 });
		}

		const fullConfig = getFullPixelatedConfig();
		const integrations = (fullConfig.integrations || {}) as Record<string, Record<string, string>>;
		const googleCfg = integrations.google || {};
		const gscCfg = integrations.googleSearchConsole || {};
		const config: SearchConsoleConfig = {
			siteUrl: site.gscSiteUrl || site.searchConsoleUrl || '',
			serviceAccountKey: gscCfg.serviceAccountKey || googleCfg.serviceAccountKey,
			clientId: googleCfg.client_id,
			clientSecret: googleCfg.client_secret,
			refreshToken: googleCfg.refresh_token,
		};

		if (!config.serviceAccountKey && !(config.clientId && config.clientSecret && config.refreshToken)) {
			return NextResponse.json({ success: false, error: 'Google credentials not configured in pixelated.config.json' }, { status: 500 });
		}

		const ranges = getMonthRange(startDate, endDate);
		const [currentResult, previousResult] = await Promise.all([
			getSearchConsoleData(config, siteName, ranges.current.startDate, ranges.current.endDate),
			getSearchConsoleData(config, siteName, ranges.previous.startDate, ranges.previous.endDate),
		]);

		if (!currentResult.success || !previousResult.success) {
			const failedResult = !currentResult.success ? currentResult : previousResult;
			return NextResponse.json({ success: false, error: failedResult.error }, { status: failedResult.code === 403 ? 403 : 500 });
		}

		const currentClicks = (currentResult.data || []).reduce((total, point) => total + point.currentClicks, 0);
		const previousClicks = (previousResult.data || []).reduce((total, point) => total + point.currentClicks, 0);
		const change = currentClicks - previousClicks;
		const percentChange = previousClicks === 0
			? (currentClicks === 0 ? 0 : null)
			: Math.round(((change / previousClicks) * 100) * 10) / 10;

		return NextResponse.json({
			success: true,
			data: {
				currentMonth: ranges.current.label,
				previousMonth: ranges.previous.label,
				currentClicks,
				previousClicks,
				change,
				percentChange,
				chartData: currentResult.data || [],
			},
		});
	} catch (error) {
		console.error('Google Search Console summary API error:', error);
		return NextResponse.json({
			success: false,
			error: error instanceof Error ? error.message : 'Failed to fetch Search Console summary',
		}, { status: 500 });
	}
}

import { createTimesheetAuthHandlers } from '@pixelated-tech/components/server';
import { getFullPixelatedConfig } from '@pixelated-tech/components/server';

export async function GET(request: Request) {
	const config = await getFullPixelatedConfig();
	if (!config.siteInfo) throw new Error('Site information is required for timesheet authentication.');
	const domain = new URL(config.siteInfo.url).hostname.replace(/^www\./, '');
	const handlers = await createTimesheetAuthHandlers(domain, config.siteInfo.name);
	return handlers.GET(request);
}

export async function POST(request: Request) {
	const config = await getFullPixelatedConfig();
	if (!config.siteInfo) throw new Error('Site information is required for timesheet authentication.');
	const domain = new URL(config.siteInfo.url).hostname.replace(/^www\./, '');
	const handlers = await createTimesheetAuthHandlers(domain, config.siteInfo.name);
	return handlers.POST(request);
}

import { smartFetch } from '../foundation/smartfetch';
import type { USPSConfig } from '../config/config.types';

export type UspsRateOption = {
	serviceId: string;
	serviceName: string;
	rate: number;
	deliveryTime?: string;
	serviceType?: string;
};

function normalizeUspsServiceId(serviceName: string) {
	return serviceName
		.toString()
		.trim()
		.toUpperCase()
		.replace(/[^A-Z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function getUspsApiUrl(config?: USPSConfig) {
	if (config?.environment === 'sandbox') {
		return config.sandboxBaseURL?.trim() || 'https://apis-tem.usps.com/ShippingAPI.dll';
	}
	return config?.baseURL?.trim() || 'https://apis.usps.com/ShippingAPI.dll';
}

function buildDomesticRateRequestXml(options: { fromZip: string; toZip: string; weightOunces: number; }) {
	const pounds = Math.floor(options.weightOunces / 16);
	const ounces = options.weightOunces % 16;
	return `<?xml version="1.0" encoding="UTF-8"?>
<RateV4Request>
	<Revision>2</Revision>
	<Package ID="1">
		<Service>ALL</Service>
		<ZipOrigination>${options.fromZip}</ZipOrigination>
		<ZipDestination>${options.toZip}</ZipDestination>
		<Pounds>${pounds}</Pounds>
		<Ounces>${ounces}</Ounces>
		<Container>VARIABLE</Container>
		<Size>REGULAR</Size>
		<Machinable>true</Machinable>
	</Package>
</RateV4Request>`;
}

function buildInternationalRateRequestXml(options: { fromZip: string; fromCountry: string; toCountry: string; weightOunces: number; packageValue?: number; }) {
	const pounds = Math.floor(options.weightOunces / 16);
	const ounces = options.weightOunces % 16;
	return `<?xml version="1.0" encoding="UTF-8"?>
<IntlRateV2Request>
	<Revision>2</Revision>
	<Package ID="1">
		<Pounds>${pounds}</Pounds>
		<Ounces>${ounces}</Ounces>
		<MailType>Package</MailType>
		<ValueOfContents>${options.packageValue ?? 0}</ValueOfContents>
		<Country>${options.toCountry}</Country>
		<Container>VARIABLE</Container>
		<Size>REGULAR</Size>
	</Package>
</IntlRateV2Request>`;
}

function parseDomesticRates(xml: string): UspsRateOption[] {
	const options: UspsRateOption[] = [];
	const errorMatch = xml.match(/<Description>([^<]+)<\/Description>/);
	if (errorMatch) {
		throw new Error(errorMatch[1].trim());
	}

	const postageRegex = /<Postage\s+MAILSERVICE="([^"]+)">[\s\S]*?<Rate>([^<]+)<\/Rate>/g;
	let match: RegExpExecArray | null;
	while ((match = postageRegex.exec(xml)) !== null) {
		const serviceName = match[1].trim();
		const rate = Number(match[2].trim());
		if (!Number.isFinite(rate)) continue;
		options.push({
			serviceId: normalizeUspsServiceId(serviceName),
			serviceName,
			rate,
		});
	}
	return options;
}

function parseInternationalRates(xml: string): UspsRateOption[] {
	const options: UspsRateOption[] = [];
	const errorMatch = xml.match(/<Description>([^<]+)<\/Description>/);
	if (errorMatch) {
		throw new Error(errorMatch[1].trim());
	}

	const serviceRegex = /<Service\s+ID="([^"]+)">[\s\S]*?<SvcDescription>([^<]+)<\/SvcDescription>[\s\S]*?<Postage>([^<]+)<\/Postage>/g;
	let match: RegExpExecArray | null;
	while ((match = serviceRegex.exec(xml)) !== null) {
		const serviceId = match[1].trim();
		const serviceName = match[2].trim();
		const rate = Number(match[3].trim());
		if (!Number.isFinite(rate)) continue;
		options.push({
			serviceId: normalizeUspsServiceId(serviceId || serviceName),
			serviceName,
			rate,
		});
	}
	return options;
}

export async function getUspsRates(params: {
	config?: USPSConfig;
	fromZip: string;
	fromCountry: string;
	toZip: string;
	toCountry: string;
	weightOunces: number;
	packageValue?: number;
}) {
	const uspsConfig = params.config;
	if (!uspsConfig) {
		throw new Error('USPS configuration is required to fetch rates.');
	}

	const fromZip = params.fromZip?.trim();
	const toZip = params.toZip?.trim();
	const fromCountry = (params.fromCountry || 'US').trim().toUpperCase();
	const toCountry = (params.toCountry || 'US').trim().toUpperCase();

	if (!fromZip || !toZip) {
		throw new Error('Origin and destination postal codes are required.');
	}

	const weightOunces = Math.max(1, Math.round(params.weightOunces));
	const isDomestic = fromCountry === 'US' && toCountry === 'US';
	const apiName = isDomestic ? 'RateV4' : 'IntlRateV2';
	const xml = isDomestic
		? buildDomesticRateRequestXml({ fromZip, toZip, weightOunces })
		: buildInternationalRateRequestXml({ fromZip, fromCountry, toCountry, weightOunces, packageValue: params.packageValue });

	const url = `${getUspsApiUrl(params.config)}?API=${apiName}&XML=${encodeURIComponent(xml)}`;
	const responseText = await smartFetch(url, {
		responseType: 'text',
		proxy: params.config?.proxyUrl ? { url: params.config.proxyUrl, fallbackOnCors: true } : undefined,
	});

	if (typeof responseText !== 'string') {
		throw new Error('Invalid USPS response format.');
	}

	return isDomestic ? parseDomesticRates(responseText) : parseInternationalRates(responseText);
}

import { smartFetch } from '../foundation/smartfetch';
import type { USPSConfig } from '../config/config.types';

export type UspsRateOption = {
	rateId: string;
	serviceId: string;
	serviceName: string;
	rate: number;
	deliveryTime?: string;
	serviceType?: string;
};

function getUspsBaseUrl(config?: USPSConfig) {
	const defaultUrl = config?.environment === 'sandbox' ? 'https://apis-tem.usps.com' : 'https://apis.usps.com';
	return (config?.environment === 'sandbox'
		? config?.sandboxBaseURL?.trim()
		: config?.baseURL?.trim()) || defaultUrl;
}


async function fetchUspsAccessToken(config?: USPSConfig) {
	const consumerKey = (config?.consumerKey || '').toString().trim();
	const consumerSecret = (config?.consumerSecret || '').toString().trim();

	if (!consumerKey) {
		throw new Error('USPS consumerKey is required to fetch rates.');
	}
	if (!consumerSecret) {
		throw new Error('USPS consumerSecret is required to fetch rates.');
	}

	const tokenUrl = (() => {
		const baseUrl = getUspsBaseUrl(config).replace(/\/+$/, '');
		if (baseUrl.toLowerCase().includes('/oauth2/v3/token')) {
			return baseUrl;
		}
		return baseUrl.replace(/\/ShippingAPI\.dll$/i, '').replace(/\/+$/, '') + '/oauth2/v3/token';
	})();
	const tokenRequestBody = {
		grant_type: 'client_credentials',
		client_id: consumerKey,
		client_secret: consumerSecret,
	};

	const tokenResponse = await smartFetch(tokenUrl, {
		responseType: 'json',
		proxy: config?.proxyUrl ? { url: config.proxyUrl, fallbackOnCors: true } : undefined,
		requestInit: {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json;charset=UTF-8',
			},
			body: JSON.stringify(tokenRequestBody),
		},
	});

	if (!tokenResponse || typeof tokenResponse.access_token !== 'string') {
		throw new Error('Invalid USPS authentication response.');
	}

	return tokenResponse.access_token;
}

function buildTotalRatesRequestBody(params: {
	fromZip: string;
	fromCountry: string;
	toZip: string;
	toCountry: string;
	weightOunces: number;
	isDomestic: boolean;
}) {
	const weightPounds = Math.max(0.1, params.weightOunces / 16);
	return {
		originZIPCode: params.fromZip,
		destinationZIPCode: params.toZip,
		weight: Number(weightPounds.toFixed(2)),
		length: 0.1,
		width: 0.1,
		height: 0.1,
		mailClass: 'USPS_GROUND_ADVANTAGE',
		processingCategory: 'MACHINABLE',
		rateIndicator: 'SP',
		destinationEntryFacilityType: 'NONE',
		priceType: 'COMMERCIAL',
		mailingDate: new Date().toISOString().slice(0, 10),
		hasNonstandardCharacteristics: false,
	};
}

function parseTotalRatesResponse(response: any): UspsRateOption[] {
	if (!response) {
		throw new Error('Invalid USPS response format.');
	}

	if (Array.isArray(response.errors) && response.errors.length > 0) {
		const errorMessage = response.errors
			.map((error: any) => error.detail || error.title || error.message || JSON.stringify(error))
			.join('; ');
		throw new Error(errorMessage || 'USPS returned an error response.');
	}

	if (response.error) {
		throw new Error(typeof response.error === 'string' ? response.error : 'USPS returned an error response.');
	}

	const ratesSource = Array.isArray(response.rateOptions)
		? response.rateOptions
		: Array.isArray(response.totalRates)
			? response.totalRates
			: null;

	if (!Array.isArray(ratesSource)) {
		throw new Error('Invalid USPS response format.');
	}

	const rateEntries = ratesSource.flatMap((item: any) => {
		if (Array.isArray(item.rates)) {
			return item.rates;
		}
		return [item];
	});

	const parsedRates: Array<UspsRateOption | null> = rateEntries.map((rate: any, index: number) => {
		const serviceName = String(rate?.description ?? rate?.service?.name ?? rate?.service?.id ?? rate?.mailClass ?? '').trim();
		const serviceId = String(rate?.service?.id ?? rate?.mailClass ?? serviceName)
			.toString()
			.trim()
			.toUpperCase()
			.replace(/[^A-Z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
		const rawCharge = rate?.price ?? rate?.summary?.totalCharge?.value ?? rate?.summary?.totalCharge?.amount ?? rate?.totalPrice ?? rate?.totalBasePrice;
		const charge = Number(rawCharge);
		if (!serviceName || !Number.isFinite(charge)) {
			return null;
		}
		return {
			rateId: `${serviceId}-${index}`,
			serviceId,
			serviceName,
			rate: charge,
			deliveryTime: rate?.summary?.deliveryDays ? `${rate.summary.deliveryDays} days` : undefined,
			serviceType: rate?.serviceType ?? rate?.service?.type,
		};
	});

	const filteredRates: UspsRateOption[] = parsedRates.filter((item: UspsRateOption | null): item is UspsRateOption => item !== null);
	return filteredRates.sort((a, b) => a.rate - b.rate);
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
	const accessToken = await fetchUspsAccessToken(uspsConfig);
	const apiBaseUrl = (() => {
		const baseUrl = getUspsBaseUrl(uspsConfig).replace(/\/+$/, '');
		if (baseUrl.toLowerCase().includes('/prices/v3')) {
			return baseUrl;
		}
		return baseUrl.replace(/\/ShippingAPI\.dll$/i, '').replace(/\/+$/, '') + '/prices/v3';
	})();
	const url = `${apiBaseUrl}/total-rates/search`;
	const requestBody = buildTotalRatesRequestBody({
		fromZip,
		fromCountry,
		toZip,
		toCountry,
		weightOunces,
		isDomestic,
	});

	const response = await smartFetch(url, {
		responseType: 'json',
		proxy: uspsConfig?.proxyUrl ? { url: uspsConfig.proxyUrl, fallbackOnCors: true } : undefined,
		requestInit: {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${accessToken}`,
			},
			body: JSON.stringify(requestBody),
		},
	});

	return parseTotalRatesResponse(response);
}

"use server";

import { getFullPixelatedConfig } from '../config/config';
import { getUspsRates, type UspsRateOption } from './usps.functions';

export type FetchUspsRatesParams = {
	fromZip: string;
	fromCountry: string;
	toZip: string;
	toCountry: string;
	weightOunces: number;
};

export async function fetchUspsRatesServer(params: FetchUspsRatesParams): Promise<UspsRateOption[]> {
	const uspsConfig = getFullPixelatedConfig()?.integrations?.usps;
	if (!uspsConfig || !uspsConfig.consumerKey || !uspsConfig.consumerSecret) {
		throw new Error('USPS configuration is required on the server.');
	}

	return await getUspsRates({
		config: uspsConfig,
		fromZip: params.fromZip,
		fromCountry: params.fromCountry,
		toZip: params.toZip,
		toCountry: params.toCountry,
		weightOunces: params.weightOunces,
	});
}

export const STATE_MAP: Record<string, string> = {
	AL: 'Alabama',
	AK: 'Alaska',
	AZ: 'Arizona',
	AR: 'Arkansas',
	CA: 'California',
	CO: 'Colorado',
	CT: 'Connecticut',
	DE: 'Delaware',
	FL: 'Florida',
	GA: 'Georgia',
	HI: 'Hawaii',
	ID: 'Idaho',
	IL: 'Illinois',
	IN: 'Indiana',
	IA: 'Iowa',
	KS: 'Kansas',
	KY: 'Kentucky',
	LA: 'Louisiana',
	ME: 'Maine',
	MD: 'Maryland',
	MA: 'Massachusetts',
	MI: 'Michigan',
	MN: 'Minnesota',
	MS: 'Mississippi',
	MO: 'Missouri',
	MT: 'Montana',
	NE: 'Nebraska',
	NV: 'Nevada',
	NH: 'New_Hampshire',
	NJ: 'New_Jersey',
	NM: 'New_Mexico',
	NY: 'New_York',
	NC: 'North_Carolina',
	ND: 'North_Dakota',
	OH: 'Ohio',
	OK: 'Oklahoma',
	OR: 'Oregon',
	PA: 'Pennsylvania',
	RI: 'Rhode_Island',
	SC: 'South_Carolina',
	SD: 'South_Dakota',
	TN: 'Tennessee',
	TX: 'Texas',
	UT: 'Utah',
	VT: 'Vermont',
	VA: 'Virginia',
	WA: 'Washington',
	WV: 'West_Virginia',
	WI: 'Wisconsin',
	WY: 'Wyoming'
};

export function formatWikipediaLocation(city: string, stateFull: string): string {
	let cityFormatted = city.trim();
	const stateFormatted = stateFull.trim().replace(/\s+/g, '_');
	
	// Special cases/custom Wikipedia pages for NJ/known locations
	if (stateFormatted === 'New_Jersey') {
		if (cityFormatted.toLowerCase() === 'parsippany') {
			cityFormatted = 'Parsippany-Troy Hills';
		} else if (['denville', 'randolph', 'montville', 'east hanover', 'hanover', 'roxbury', 'jefferson', 'rockaway'].includes(cityFormatted.toLowerCase())) {
			cityFormatted = `${cityFormatted} Township`;
		}
	}
	
	const cityUnderscores = cityFormatted.replace(/\s+/g, '_');
	return `https://en.wikipedia.org/wiki/${cityUnderscores},_${stateFormatted}`;
}

export function getWikipediaCityObject(rawName: string | null | undefined) {
	if (!rawName || typeof rawName !== 'string') return null;
	const trimmed = rawName.trim();
	// Match trailing 2-letter state abbreviation
	const match = trimmed.match(/^(.+?)\s+([A-Z]{2})$/i);
	if (match) {
		const city = match[1].trim();
		const stateAbbr = match[2].toUpperCase();
		const fullState = STATE_MAP[stateAbbr];
		if (fullState) {
			const url = formatWikipediaLocation(city, fullState);
			return {
				'@type': 'City',
				name: city,
				sameAs: url
			};
		}
	}
	return {
		'@type': 'City',
		name: trimmed
	};
}

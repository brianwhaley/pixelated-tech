import { sanitizeString, US_STATES } from '../foundation/utilities';

export const STATE_MAP: Record<string, string> = Object.fromEntries(
	US_STATES.map((state) => [state.value, state.text.replace(/\s+/g, '_')])
);

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

export function getWikipediaCityObject(rawName: string | null | undefined, type?: string | null) {
	if (!rawName || typeof rawName !== 'string') return null;
	const trimmed = sanitizeString(rawName);
	const normalizedType = (type ?? 'City').trim().toLowerCase();

	if (normalizedType === 'state') {
		return {
			'@type': 'State',
			name: trimmed,
			sameAs: `https://en.wikipedia.org/wiki/${trimmed.replace(/\s+/g, '_')}`
		};
	}

	if (normalizedType === 'administrativearea') {
		const match = trimmed.match(/^(.+? County)(?:,)?\s+(.+)$/i);
		const name = match ? match[1].trim() : trimmed;
		const sameAs = match ? `https://en.wikipedia.org/wiki/${name.replace(/\s+/g, '_')},_${STATE_MAP[match[2].toUpperCase()] ?? match[2].trim().replace(/\s+/g, '_')}` : undefined;
		return {
			'@type': 'AdministrativeArea',
			name,
			...(sameAs ? { sameAs } : {})
		};
	}

	const cityMatch = trimmed.match(/^(.+?)\s+([A-Z]{2})$/i);
	if (cityMatch) {
		const cityName = cityMatch[1].trim();
		const fullState = STATE_MAP[cityMatch[2].toUpperCase()];
		if (fullState) {
			return {
				'@type': 'City',
				name: cityName,
				sameAs: formatWikipediaLocation(cityName, fullState)
			};
		}
	}
	return {
		'@type': 'City',
		name: trimmed
	};
}

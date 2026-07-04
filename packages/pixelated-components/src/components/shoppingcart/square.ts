import PropTypes, { InferProps } from 'prop-types';

export const SquareStoreItemShape = {
	itemID: PropTypes.string.isRequired,
	itemURL: PropTypes.string.isRequired,
	itemTitle: PropTypes.string.isRequired,
	itemDescription: PropTypes.string,
	itemImageURL: PropTypes.string,
	itemImageURLs: PropTypes.arrayOf(PropTypes.string),
	// itemQuantity - from contentful item component 
	itemPrice: PropTypes.number.isRequired, // was itemCost in Contentful
	itemCurrency: PropTypes.string.isRequired,
	itemInventory: PropTypes.number.isRequired,
	itemIsShippable: PropTypes.bool.isRequired,
	itemWeight: PropTypes.number,
	itemWeightUnit: PropTypes.string,
	// itemType = "product" from Contentful Item Component
	itemSKU: PropTypes.string,
	itemDurationHours: PropTypes.number,
	itemStartDate: PropTypes.string,
	itemStartTime: PropTypes.string,
	itemEndDate: PropTypes.string,
	itemEndTime: PropTypes.string,
	itemAvailableSeats: PropTypes.number,
	itemMaxSeats: PropTypes.number,
	properties: PropTypes.objectOf(PropTypes.string),
	categories: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			name: PropTypes.string.isRequired,
		})
	),
	itemCategory: PropTypes.arrayOf(PropTypes.string),
	categoryPath: PropTypes.arrayOf(PropTypes.string),
};
export type SquareStoreItemShapeType = InferProps<typeof SquareStoreItemShape>;



export type SquareFilterValues = {
	propertyName: string;
	propertyValue: string;
};

export type SquareStoreFilterValue = { 
	label: string; 
	value: string 
};

export type SquareStoreFilter = {
  name: string;
  values: SquareStoreFilterValue[];
};

export type SquareStoreFilters = SquareStoreFilter[] 


export const squareStorePriceBuckets = [
	{ min: 0, max: 25, label: 'Under $25' },
	{ min: 25, max: 50, label: '$25 - $50' },
	{ min: 50, max: 100, label: '$50 - $100' },
	{ min: 100, max: 200, label: '$100 - $200' },
	{ min: 200, max: 500, label: '$200 - $500' },
	{ min: 500, max: 1000, label: '$500 - $1000' },
	{ min: 1000, max: Infinity, label: '$1000+' },
] as const;

export function getSquareStorePriceRanges(items: SquareStoreItemShapeType[]) {
	const prices = items
		.map((item) => item.itemPrice)
		.filter((price) => Number.isFinite(price));
	if (prices.length === 0) return [];

	return squareStorePriceBuckets
		.filter((bucket) => prices.some((price) => bucket.max === Infinity ? price >= bucket.min : price >= bucket.min && price <= bucket.max))
		.map((bucket) => bucket.label);
}

export function matchesSquareStorePriceRange(price: number, rangeLabel: string) {
	if (!Number.isFinite(price)) return false;
	const bucket = squareStorePriceBuckets.find((bucket) => bucket.label === rangeLabel);
	if (!bucket) return false;
	return bucket.max === Infinity ? price >= bucket.min : price >= bucket.min && price <= bucket.max;
}

export function buildSquareStoreFilters(items: SquareStoreItemShapeType[]) {
	const gather: Record<string, Map<string, string>> = {};

	function addFilter(name: string, value: string, label: string) {
		if (!value || !label) return;
		if (!gather[name]) gather[name] = new Map<string, string>();
		gather[name].set(value, label);
	}

	for (const item of items) {
		if (item.categories) {
			for (const category of item.categories) {
				if (!category?.id || !category?.name) continue;
				addFilter('Category', category.id, category.name);
			}
		}
	}

	for (const priceRange of getSquareStorePriceRanges(items)) {
		addFilter('Price Range', priceRange, priceRange);
	}

	const orderedFilters = Object.entries(gather)
		.sort(([a], [b]) => {
			const order = ['Category', 'Price Range'];
			const aIndex = order.indexOf(a);
			const bIndex = order.indexOf(b);
			if (aIndex !== -1 || bIndex !== -1) {
				return (aIndex === -1 ? order.length : aIndex) - (bIndex === -1 ? order.length : bIndex);
			}
			return a.localeCompare(b);
		})
		.map(([name, values]) => ({
			name,
			values: Array.from(values.entries())
				.map(([value, label]) => ({ value, label }))
				.sort((a, b) => a.label.localeCompare(b.label)),
		}));

	return orderedFilters;
}

function getSquarePaymentErrorDetails(error: unknown) {
	const message = error instanceof Error ? error.message : String(error || '');
	const responseBodyStart = message.indexOf('{');
	const responseBodyEnd = message.lastIndexOf('}');
	const responseBody = responseBodyStart >= 0 && responseBodyEnd > responseBodyStart
		? message.slice(responseBodyStart, responseBodyEnd + 1)
		: '';

	if (!responseBody) {
		return undefined;
	}

	try {
		return JSON.parse(responseBody);
	} catch {
		return undefined;
	}
}

export class SquarePaymentError extends Error {
	code: string;
	userMessage: string;
	retryable: boolean;

	constructor(code: string, userMessage: string, retryable = false) {
		super(userMessage);
		this.name = 'SquarePaymentError';
		this.code = code;
		this.userMessage = userMessage;
		this.retryable = retryable;
	}
}

export function getSquarePaymentErrorMessage(error: unknown) {
	if (error instanceof SquarePaymentError) {
		return error.userMessage;
	}

	const details = getSquarePaymentErrorDetails(error);
	if (typeof details?.error === 'string' && details.error.trim().length > 0) {
		return details.error.trim();
	}

	const message = error instanceof Error ? error.message : String(error || '');
	if (message.includes('Please re-enter your card details and try again.')) {
		return 'Please re-enter your card details and try again.';
	}

	if (message.includes('Card verification failed. Please check the CVV and try again.')) {
		return 'Card verification failed. Please check the CVV and try again.';
	}

	return undefined;
}

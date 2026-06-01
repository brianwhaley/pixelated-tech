import type { SquareStoreItemShapeType } from './square.components';
import { getFullPixelatedConfig } from '../config/config';
import { CacheManager } from '../foundation/cache-manager';
import { smartFetch } from '../foundation/smartfetch';
import { sanitizeString, normalizeEmail } from '../foundation/utilities';
import type { CheckoutType } from './shoppingcart.functions';

const debug = false;

export type SquareStoreFilterValue = { label: string; value: string };
export type SquareStoreFilters = Array<{ name: string; values: SquareStoreFilterValue[] }>;

export interface SquareStoreItemsResponse {
	items: SquareStoreItemShapeType[];
	filters: SquareStoreFilters;
}

export interface SquareStoreQueryOptions {
	featuredOnly?: boolean;
	propertyName?: string;
	propertyValue?: string;
}

const squareStoreCache = new CacheManager({ mode: 'memory', domain: 'pixelated-components', namespace: 'square-store', ttl: 10 * 60 * 1000 });

export function clearSquareStoreCache() {
	squareStoreCache.clear();
}

function isSandboxSquareConfig(squareConfig: any) {
	return squareConfig?.environment === 'sandbox';
}

function getSquareBaseUrl(squareConfig: any) {
	return isSandboxSquareConfig(squareConfig)
		? 'https://connect.squareupsandbox.com'
		: 'https://connect.squareup.com';
}

function getSquareCatalogUrl() {
	const params = new URLSearchParams({ types: 'ITEM,ITEM_VARIATION,IMAGE,CATEGORY' });
	return `/v2/catalog/list?${params.toString()}`;
}

function getSquareInventoryUrl() {
	return '/v2/inventory/batch-retrieve-counts';
}

function getPropertyValue(value: any) {
	if (typeof value === 'string') return value;
	if (typeof value === 'boolean') return value ? 'true' : 'false';
	if (typeof value === 'number') return String(value);
	return '';
}

function getCategoryPath(categoryMap: Map<string, any>, categoryId?: string) {
	const path: string[] = [];
	let currentId = categoryId;
	while (currentId) {
		const category = categoryMap.get(currentId);
		if (!category || path.includes(currentId)) break;
		path.unshift(currentId);
		currentId = category.parent_category_id;
	}
	return path;
}

function getItemCategoryIds(itemData: any) {
	const ids: string[] = [];
	if (typeof itemData.category_id === 'string') ids.push(itemData.category_id);
	if (Array.isArray(itemData.category_ids)) {
		for (const id of itemData.category_ids) {
			if (typeof id === 'string') ids.push(id);
		}
	}
	if (Array.isArray(itemData.categories)) {
		for (const category of itemData.categories) {
			if (typeof category === 'string') {
				ids.push(category);
			} else if (category?.id) {
				ids.push(category.id);
			}
		}
	}
	return ids;
}

function getItemProperties(itemData: any, variationObjects: any[] = []) {
	const properties: Record<string, string> = {};
	function collectAttributes(attributeSource: any) {
		if (!Array.isArray(attributeSource)) {
			return;
		}
		for (const attr of attributeSource) {
			const name = attr?.name || attr?.custom_attribute_definition_id;
			const value = attr?.string_value ?? attr?.boolean_value ?? attr?.number_value ?? attr?.type_annotation;
			if (name && value !== undefined && value !== null) {
				properties[name] = getPropertyValue(value);
			}
		}
	}

	collectAttributes(itemData?.custom_attribute_values);
	for (const variationObject of variationObjects) {
		collectAttributes(variationObject?.custom_attribute_values);
		collectAttributes(variationObject?.item_variation_data?.custom_attribute_values);
	}
	return properties;
}

const squareStorePriceBuckets = [
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

		if (item.properties) {
			for (const [key, value] of Object.entries(item.properties)) {
				if (typeof value !== 'string' || value.trim() === '') continue;
				addFilter(key, value, value);
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

function filterSquareStoreItems(
	items: SquareStoreItemShapeType[],
	squareItemCategoryId?: string,
	squareFeaturedCategoryId?: string,
	options: SquareStoreQueryOptions = {}
) {
	return items.filter((item) => {
		if (item.itemInventory <= 0) return false;
		if (squareItemCategoryId && !(item.categoryPath || []).includes(squareItemCategoryId)) return false;
		if (options.featuredOnly && squareFeaturedCategoryId && !(item.categoryPath || []).includes(squareFeaturedCategoryId)) return false;
		if (options.propertyName && options.propertyValue) {
			const actual = item.properties?.[options.propertyName];
			if (sanitizeString(actual) !== sanitizeString(options.propertyValue)) return false;
		}
		return true;
	});
}

function getUniqueImageIdsFromItemObjects(objects: any[]) {
	const imageIds = new Set<string>();
	for (const object of objects) {
		if (object?.type !== 'ITEM') continue;
		const itemData = object.item_data;
		if (!itemData) continue;
		const ids = Array.isArray(itemData.image_ids) ? itemData.image_ids : [];
		for (const id of ids) {
			if (typeof id === 'string' && id.trim()) {
				imageIds.add(id);
			}
		}
	}
	return Array.from(imageIds);
}

async function fetchSquareCatalogImageObjects(squareConfig: any, imageIds: string[]) {
	if (!imageIds?.length) return [];

	const accessToken = squareConfig?.squareAccessToken || squareConfig?.sandboxSquareAccessToken;
	if (!accessToken) {
		throw new Error('Square access token is not configured.');
	}

	const url = `${getSquareBaseUrl(squareConfig)}/v2/catalog/batch-retrieve`;
	const response = await smartFetch(url, {
		responseType: 'json',
		requestInit: {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				Authorization: `Bearer ${accessToken}`,
				'Square-Version': '2026-05-20',
			},
			body: JSON.stringify({
				object_ids: imageIds,
				include_related_objects: false,
			}),
		},
	});

	return Array.isArray(response?.objects) ? response.objects : [];
}

async function fetchSquareCatalogCategoryObjects(squareConfig: any, categoryIds: string[]) {
	if (!categoryIds?.length) return [];

	const accessToken = squareConfig?.squareAccessToken || squareConfig?.sandboxSquareAccessToken;
	if (!accessToken) {
		throw new Error('Square access token is not configured.');
	}

	const url = `${getSquareBaseUrl(squareConfig)}/v2/catalog/list?types=CATEGORY`;
	const response = await smartFetch(url, {
		responseType: 'json',
		requestInit: {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${accessToken}`,
				'Square-Version': '2026-05-20',
			},
		},
	});

	const objects = Array.isArray(response?.objects) ? (response.objects as any[]) : [];
	return objects.filter((object: any) => object?.type === 'CATEGORY' && categoryIds.includes(object.id));
}

async function fetchSquareCatalogObjects(squareConfig: any) {
	const cacheKey = `catalog_${squareConfig?.squareItemCategoryId || 'all'}`;
	const cached = squareStoreCache.get<any>(cacheKey);
	if (cached) {
		return cached;
	}

	const accessToken = squareConfig?.squareAccessToken || squareConfig?.sandboxSquareAccessToken;
	if (!accessToken) {
		throw new Error('Square access token is not configured.');
	}

	const categoryId = squareConfig?.squareItemCategoryId;
	if (!categoryId) {
		throw new Error('square.squareItemCategoryId is required to fetch Square boutique items.');
	}

	const url = `${getSquareBaseUrl(squareConfig)}/v2/catalog/search-catalog-items`;
	const collectedObjects: any[] = [];
	let cursor: string | undefined;

	do {
		const body: any = {
			category_ids: [categoryId],
			include_related_objects: true,
		};
		if (cursor) {
			body.cursor = cursor;
		}

		const response = await smartFetch(url, {
			responseType: 'json',
			requestInit: {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					Authorization: `Bearer ${accessToken}`,
					'Square-Version': '2026-05-20',
				},
				body: JSON.stringify(body),
			},
		});

		const pageObjects = Array.isArray(response?.objects)
			? response.objects
			: [
				...(Array.isArray(response?.items) ? response.items : []),
				...(Array.isArray(response?.related_objects) ? response.related_objects : []),
			];
		collectedObjects.push(...pageObjects);
		cursor = response?.cursor;
	} while (cursor);

	const referencedCategoryIds = new Set<string>();
	for (const object of collectedObjects) {
		if (object?.type !== 'ITEM') continue;
		const itemData = object.item_data || {};
		for (const categoryId of getItemCategoryIds(itemData)) {
			referencedCategoryIds.add(categoryId);
		}
	}

	const existingCategoryIds = new Set<string>(
		collectedObjects
			.filter((object) => object?.type === 'CATEGORY')
			.map((object) => object?.id)
			.filter((id): id is string => typeof id === 'string')
	);

	const missingCategoryIds = [...referencedCategoryIds].filter((id) => !existingCategoryIds.has(id));
	if (missingCategoryIds.length > 0) {
		const categoryObjects = await fetchSquareCatalogCategoryObjects(squareConfig, missingCategoryIds);
		collectedObjects.push(...categoryObjects);
	}

	const existingImageIds = new Set(
		collectedObjects
			.filter((object) => object?.type === 'IMAGE')
			.map((object) => object?.id)
			.filter((id): id is string => typeof id === 'string')
	);

	const missingImageIds = getUniqueImageIdsFromItemObjects(collectedObjects).filter(
		(id) => !existingImageIds.has(id)
	);

	if (missingImageIds.length > 0) {
		const imageObjects = await fetchSquareCatalogImageObjects(squareConfig, missingImageIds);
		collectedObjects.push(...imageObjects);
	}

	squareStoreCache.set(cacheKey, collectedObjects);
	return collectedObjects;
}

async function fetchSquareInventoryCounts(squareConfig: any, variationIds: string[]) {
	if (!variationIds?.length) return new Map<string, number>();
	const accessToken = squareConfig?.squareAccessToken || squareConfig?.sandboxSquareAccessToken;
	if (!accessToken) {
		throw new Error('Square access token is not configured.');
	}

	const url = `${getSquareBaseUrl(squareConfig)}${getSquareInventoryUrl()}`;
	const response = await smartFetch(url, {
		responseType: 'json',
		requestInit: {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				Authorization: `Bearer ${accessToken}`,
			},
			body: JSON.stringify({ catalog_object_ids: variationIds }),
		},
	});

	const counts = new Map<string, number>();
	for (const count of response?.counts || []) {
		const id = count?.catalog_object_id;
		const quantity = Number(count?.quantity ?? '0');
		if (typeof id === 'string' && Number.isFinite(quantity)) {
			counts.set(id, quantity);
		}
	}
	return counts;
}

function buildPriceFromVariations(variationObjects: any[]) {
	if (!variationObjects || variationObjects.length === 0) return { amount: 0, currency: 'USD' };
	const variation = variationObjects[0];
	const money = variation?.item_variation_data?.price_money;
	return {
		amount: typeof money?.amount === 'number' ? money.amount / 100 : 0,
		currency: money?.currency || 'USD',
	};
}

function slugifyValue(value: string) {
	return value
		.toString()
		.toLowerCase()
		.trim()
		.replace(/['’]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function buildSquareStoreItem(
	itemObject: any,
	variationMap: Map<string, any>,
	albumImageMap: Map<string, string>,
	countsMap: Map<string, number>,
	categoryMap: Map<string, any>
): SquareStoreItemShapeType {
	const itemData = itemObject?.item_data || {};
	const variationRefs = Array.isArray(itemData?.variations) ? itemData.variations : [];
	const variationIds = variationRefs.map((ref: any) => ref?.id).filter(Boolean);
	let variationObjects = variationIds.map((variationId: string) => variationMap.get(variationId)).filter(Boolean);
	if (variationObjects.length === 0) {
		variationObjects = variationRefs.filter((ref: any) => ref?.item_variation_data);
	}
	const { amount, currency } = buildPriceFromVariations(variationObjects);

	const itemImageIds = Array.isArray(itemData?.image_ids) ? itemData.image_ids : [];
	const itemImageURLs = itemImageIds.map((imageId: string) => albumImageMap.get(imageId)).filter(Boolean);
	const primaryImageURL = itemImageURLs[0];

	const categoryIds = getItemCategoryIds(itemData);
	const categoryPathIds = new Set<string>();
	for (const categoryId of categoryIds) {
		const path = getCategoryPath(categoryMap, categoryId);
		if (path.length > 0) {
			for (const pathId of path) {
				categoryPathIds.add(pathId);
			}
		} else if (categoryId) {
			categoryPathIds.add(categoryId);
		}
	}
	const categoryPath = Array.from(categoryPathIds);
	const categories = Array.from(new Set(categoryIds))
		.map((id) => {
			const category = categoryMap.get(id);
			if (!category?.name) return undefined;
			return { id, name: category.name };
		})
		.filter((category): category is { id: string; name: string } => Boolean(category));

	const properties = getItemProperties(itemData, variationObjects);
	const itemInventory = variationIds.reduce((total: number, id: string) => total + (countsMap.get(id) ?? 0), 0);

	const itemTitle = itemData?.name || 'Untitled Item';
	const itemSlug = slugifyValue(itemTitle);
	const itemId = itemObject?.id || '';
	const variationWeight = variationObjects.length > 0 ? variationObjects[0]?.item_variation_data?.item_weight : undefined;
	const variationWeightUnit = variationObjects.length > 0 ? variationObjects[0]?.item_variation_data?.item_weight_unit : undefined;
	return {
		itemID: itemId,
		itemURL: `/store/${itemSlug}`,
		itemTitle,
		itemDescription: itemData?.description || '',
		itemImageURL: primaryImageURL,
		itemImageURLs: itemImageURLs.length ? itemImageURLs : undefined,
		itemPrice: amount,
		itemCurrency: currency,
		itemInventory,
		itemIsShippable: true,
		itemWeightUnit: itemData?.item_weight_unit || variationWeightUnit || 'lb',
		itemWeight:
			typeof itemData?.item_weight === 'number'
				? itemData.item_weight
				: typeof variationWeight === 'number'
					? variationWeight
					: undefined,
		properties: Object.keys(properties).length ? properties : undefined,
		categories: categories.length ? categories : undefined,
		categoryPath: categoryPath.length ? categoryPath : undefined,
	};
}

async function normalizeSquareCatalogObjects(squareConfig: any) {
	const objects = await fetchSquareCatalogObjects(squareConfig);
	const categoryMap = new Map<string, any>();
	const variationMap = new Map<string, any>();
	const imageMap = new Map<string, string>();
	const itemObjects: any[] = [];

	for (const object of objects) {
		if (object?.type === 'CATEGORY') {
			categoryMap.set(object.id, object.category_data || {});
			continue;
		}
		if (object?.type === 'ITEM_VARIATION') {
			variationMap.set(object.id, object);
			continue;
		}
		if (object?.type === 'IMAGE') {
			imageMap.set(object.id, object.image_data?.url || '');
			continue;
		}
		if (object?.type === 'ITEM') {
			itemObjects.push(object);
		}
	}

	const allVariationIds = itemObjects.flatMap((item) => {
		const itemData = item?.item_data || {};
		return Array.isArray(itemData?.variations) ? itemData.variations.map((ref: any) => ref?.id).filter(Boolean) : [];
	});

	const countsMap = await fetchSquareInventoryCounts(squareConfig, Array.from(new Set(allVariationIds)));

	const items = itemObjects.map((item) => buildSquareStoreItem(item, variationMap, imageMap, countsMap, categoryMap));
	return { items, categoryMap };
}

export async function getSquareStoreItems(options: SquareStoreQueryOptions = {}) {
	const squareConfig = getFullPixelatedConfig()?.square;
	if (!squareConfig) {
		throw new Error('Square configuration is required for store items.');
	}
	const squareItemCategoryId = squareConfig.squareItemCategoryId;
	if (!squareItemCategoryId) {
		throw new Error('square.squareItemCategoryId is required to fetch Square boutique items.');
	}
	const squareFeaturedCategoryId = squareConfig.squareFeaturedCategoryId;

	const cacheKey = `store_${squareItemCategoryId}_${squareFeaturedCategoryId || 'none'}_${options.featuredOnly ? 'featured' : 'all'}_${options.propertyName || ''}_${options.propertyValue || ''}`;
	const cached = squareStoreCache.get<SquareStoreItemsResponse>(cacheKey);
	if (cached) return cached;

	const { items } = await normalizeSquareCatalogObjects(squareConfig);
	const filtered = filterSquareStoreItems(items, squareItemCategoryId, squareFeaturedCategoryId, options);
	const filters = buildSquareStoreFilters(filtered);
	const response = { items: filtered, filters };
	squareStoreCache.set(cacheKey, response);
	return response;
}

export async function getSquareStoreItemById(itemId?: string) {
	if (!itemId) { return undefined; }

	const response = await getSquareStoreItems();
	const directMatch = response.items.find((item) => item.itemID === itemId);
	if (directMatch) {
		return directMatch;
	}

	const slugMatch = response.items.find((item) => item.itemURL?.endsWith(`/${itemId}`));
	if (slugMatch) {
		return slugMatch;
	}

	const parsedId = itemId.split('-').pop();
	if (parsedId && parsedId !== itemId) {
		return response.items.find((item) => item.itemID === parsedId);
	}

	return undefined;
}

const DEFAULT_SQUARE_ORDERS_URL = 'https://connect.squareup.com/v2/orders';
const DEFAULT_SQUARE_PAYMENTS_URL = 'https://connect.squareup.com/v2/payments';
const DEFAULT_SQUARE_SANDBOX_ORDERS_URL = 'https://connect.squareupsandbox.com/v2/orders';
const DEFAULT_SQUARE_SANDBOX_PAYMENTS_URL = 'https://connect.squareupsandbox.com/v2/payments';

const REGISTRATION_FIELD_NAMES = [
	'child_name',
	'child_birthdate',
	'birthdate',
	'emergency_contact_name',
	'emergency_contact_telephone',
	'full_payment',
	'cancellation_policy',
	'photo_consent',
	'closed_toe_shoes',
	'class_materials',
	'minimum_students',
	'food_allergies',
	'bleeding_disorder',
	'injury_liability',
] as const;

function maskToken(token?: string) {
	return typeof token === 'string' && token.length > 8 ? `${token.slice(0, 8)}...${token.slice(-4)}` : token || '';
}

interface SelectedSquareCredentials {
	applicationId: string;
	locationId: string;
	accessToken: string;
	useSandbox: boolean;
	ordersUrl: string;
	paymentsUrl: string;
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

function formatMoneyAmount(value: any) {
	const parsed = Number(value ?? 0);
	return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

function selectObjectFields(source: Record<string, any>, fields: ReadonlyArray<string>) {
	return fields.reduce((result, field) => {
		if (source[field] !== undefined) {
			result[field] = source[field];
		}
		return result;
	}, {} as Record<string, any>);
}

function getRegistrationData(checkoutData?: CheckoutType) {
	return selectObjectFields(checkoutData?.shippingTo || {}, REGISTRATION_FIELD_NAMES);
}

function resolveSquareCredentials(squareConfig: any, checkoutData?: CheckoutType): SelectedSquareCredentials | undefined {
	if (!squareConfig) {
		return undefined;
	}

	const checkoutEmail = normalizeEmail(checkoutData?.shippingTo?.email);
	const sandboxEmails = Array.isArray(squareConfig?.sandboxSquareEmails)
		? squareConfig.sandboxSquareEmails.map((value: any) => normalizeEmail(value))
		: [];
	const explicitSandbox = squareConfig?.environment === 'sandbox';
	const useSandbox = explicitSandbox || Boolean(checkoutEmail && sandboxEmails.includes(checkoutEmail));

	const productionApplicationId = squareConfig?.squareApplicationId;
	const productionLocationId = squareConfig?.squareLocationId;
	const productionAccessToken = squareConfig?.squareAccessToken;

	const sandboxApplicationId = squareConfig?.sandboxSquareApplicationId;
	const sandboxLocationId = squareConfig?.sandboxSquareLocationId;
	const sandboxAccessToken = squareConfig?.sandboxSquareAccessToken;

	const selected = {
		applicationId: useSandbox ? sandboxApplicationId : productionApplicationId,
		locationId: useSandbox ? sandboxLocationId : productionLocationId,
		accessToken: useSandbox ? sandboxAccessToken : productionAccessToken,
		useSandbox,
		ordersUrl: useSandbox
			? squareConfig?.sandboxSquareOrdersUrl || DEFAULT_SQUARE_SANDBOX_ORDERS_URL
			: squareConfig?.squareOrdersUrl || DEFAULT_SQUARE_ORDERS_URL,
		paymentsUrl: useSandbox
			? squareConfig?.sandboxSquarePaymentsUrl || DEFAULT_SQUARE_SANDBOX_PAYMENTS_URL
			: squareConfig?.squarePaymentsUrl || DEFAULT_SQUARE_PAYMENTS_URL,
	};

	if (debug) {
		console.log('resolveSquareCredentials', {
			useSandbox,
			explicitSandbox,
			checkoutEmail,
			sandboxEmails,
			selected: {
				applicationId: selected.applicationId,
				locationId: selected.locationId,
				accessToken: maskToken(selected.accessToken),
				paymentsUrl: selected.paymentsUrl,
			},
		});
	}

	if (!selected.applicationId || !selected.locationId || !selected.accessToken) {
		return undefined;
	}

	return selected;
}

export function getSquareConfig(checkoutData?: CheckoutType): SelectedSquareCredentials | undefined {
	const cfg = getFullPixelatedConfig();
	return resolveSquareCredentials(cfg?.square, checkoutData);
}

function requireSquareConfig(checkoutData?: CheckoutType): SelectedSquareCredentials {
	const squareConfig = getSquareConfig(checkoutData);
	if (!squareConfig) {
		throw new Error('Square is not configured. Add square.squareApplicationId, square.squareLocationId, and square.squareAccessToken to pixelated.config.json.');
	}
	return squareConfig;
}

function buildBillingAddress(shippingTo: CheckoutType['shippingTo']) {
	return {
		address_line_1: shippingTo.street1,
		locality: shippingTo.city,
		administrative_district_level_1: shippingTo.state,
		postal_code: shippingTo.zip,
		country: shippingTo.country || 'US',
	};
}

function buildSquareLineItems(checkoutData: CheckoutType, currency: string) {
	const cartLineItems = checkoutData.items.map((item) => ({
		name: item.itemTitle,
		quantity: String(item.itemQuantity),
		base_price_money: {
			amount: formatMoneyAmount(item.itemCost),
			currency,
		},
		...(item.itemDescription ? { note: item.itemDescription } : {}),
	}));

	const registrationData = getRegistrationData(checkoutData);
	if (Object.keys(registrationData).length <= 0) {
		return cartLineItems;
	}

	return [
		...cartLineItems,
		{
			name: 'registration-data',
			quantity: '1',
			base_price_money: {
				amount: 0,
				currency,
			},
			note: JSON.stringify(registrationData),
		},
	];
}

function buildSquareDiscounts(checkoutData: CheckoutType, currency: string) {
	const subtotalDiscount = Number(checkoutData.subtotal_discount ?? 0);
	if (!Number.isFinite(subtotalDiscount) || subtotalDiscount <= 0) {
		return [];
	}

	return [{
		uid: 'SUBTOTAL_DISCOUNT',
		name: 'Subtotal discount',
		scope: 'ORDER',
		amount_money: {
			amount: formatMoneyAmount(subtotalDiscount),
			currency,
		},
	}];
}

function buildSquareServiceCharges(checkoutData: CheckoutType, currency: string) {
	const serviceCharges: Array<Record<string, any>> = [];
	if (Number(checkoutData.shippingCost ?? 0) > 0) {
		serviceCharges.push({
			name: 'Shipping',
			amount_money: {
				amount: formatMoneyAmount(checkoutData.shippingCost),
				currency,
			},
			calculation_phase: 'TOTAL_PHASE',
		});
	}

	if (Number(checkoutData.handlingFee ?? 0) > 0) {
		serviceCharges.push({
			name: 'Handling',
			amount_money: {
				amount: formatMoneyAmount(checkoutData.handlingFee),
				currency,
			},
			calculation_phase: 'TOTAL_PHASE',
		});
	}

	return serviceCharges;
}

function hasShippableItems(checkoutData: CheckoutType) {
	return checkoutData.items.some((item) => item?.itemIsShippable !== false);
}

function buildSquareTaxes(checkoutData: CheckoutType) {
	const config = getFullPixelatedConfig();
	const taxRateValue = Number(config?.shoppingcart?.taxRate ?? 0);
	if (!Number.isFinite(taxRateValue) || taxRateValue <= 0) {
		return [];
	}

	return [{
		name: 'Sales Tax',
		percentage: String(Number((taxRateValue * 100).toFixed(4))),
		scope: 'ORDER',
	}];
}

function buildSquareFulfillment(checkoutData: CheckoutType) {
	if (!hasShippableItems(checkoutData)) {
		return undefined;
	}

	const shippingTo = checkoutData.shippingTo;
	if (!shippingTo?.street1 || !shippingTo?.city || !shippingTo?.state || !shippingTo?.zip) {
		return undefined;
	}

	return {
		type: 'SHIPMENT',
		state: 'PROPOSED',
		shipment_details: {
			recipient: {
				display_name: shippingTo.name || 'Customer',
				address: buildBillingAddress(shippingTo),
				...(shippingTo.phone ? { phone_number: shippingTo.phone } : {}),
				...(shippingTo.email ? { email_address: shippingTo.email } : {}),
			},
		},
	};
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

function createSquarePaymentError(error: unknown) {
	const details = getSquarePaymentErrorDetails(error);
	if (typeof details?.error === 'string' && details.error.trim().length > 0) {
		return new SquarePaymentError('SQUARE_PAYMENT_FAILED', details.error.trim());
	}
	const codes = Array.isArray(details?.errors)
		? details.errors.map((item: any) => item?.code).filter(Boolean)
		: [];
	const code = codes[0] || 'SQUARE_PAYMENT_FAILED';

	if (code === 'CVV_FAILURE') {
		return new SquarePaymentError(code, 'Card verification failed. Please check the CVV and try again.');
	}

	if (code === 'CARD_TOKEN_USED') {
		return new SquarePaymentError(code, 'Please re-enter your card details and try again.');
	}

	if (code === 'GENERIC_DECLINE') {
		return new SquarePaymentError(code, 'Your card was declined. Please try a different card or contact your bank.');
	}

	if (debug && details) {
		console.error('Square payment failed with details:', details);
	}

	return new SquarePaymentError(code, 'Your payment could not be processed. Please try again.');
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

export function buildSquarePaymentBody(sourceId: string, checkoutData: CheckoutType, idempotencyKey: string) {
	return buildSquarePaymentBodyWithOrder(sourceId, checkoutData, idempotencyKey);
}

export function buildSquarePaymentBodyWithOrder(sourceId: string, checkoutData: CheckoutType, idempotencyKey: string, orderId?: string, paymentAmount = checkoutData.total) {
	const squareConfig = requireSquareConfig(checkoutData);
	const currency = checkoutData.currency || 'USD';
	const billingAddress = buildBillingAddress(checkoutData.shippingTo);
	const shippingAddress = buildBillingAddress(checkoutData.shippingTo);
	const shippingEmail = checkoutData.shippingTo?.email;
	const shippingPhone = typeof checkoutData.shippingTo?.phone === 'string' ? checkoutData.shippingTo.phone.trim() : '';
	let buyerEmail: string | undefined;
	if (typeof shippingEmail === 'string' && shippingEmail.trim().length > 0) {
		buyerEmail = shippingEmail.trim();
	}
	return {
		source_id: sourceId,
		idempotency_key: idempotencyKey,
		amount_money: {
			amount: Math.round(paymentAmount * 100),
			currency,
		},
		location_id: squareConfig.locationId,
		autocomplete: true,
		...(buyerEmail ? { buyer_email_address: buyerEmail } : {}),
		...(shippingPhone ? { buyer_phone_number: shippingPhone } : {}),
		...(orderId ? { order_id: orderId } : {}),
		billing_address: billingAddress,
		shipping_address: shippingAddress,
		note: 'Online order from Three Muses of Bluffton shopping cart',
		statement_description_identifier: 'ThreeMusesCart',
	};
}

export function buildSquareOrderBody(checkoutData: CheckoutType, idempotencyKey: string) {
	const squareConfig = requireSquareConfig(checkoutData);
	const currency = checkoutData.currency || 'USD';
	const lineItems = buildSquareLineItems(checkoutData, currency);
	const discounts = buildSquareDiscounts(checkoutData, currency);
	const serviceCharges = buildSquareServiceCharges(checkoutData, currency);
	const taxes = buildSquareTaxes(checkoutData);
	const fulfillment = buildSquareFulfillment(checkoutData);
	return {
		idempotency_key: idempotencyKey,
		order: {
			location_id: squareConfig.locationId,
			line_items: lineItems,
			...(discounts.length > 0 ? { discounts } : {}),
			...(serviceCharges.length > 0 ? { service_charges: serviceCharges } : {}),
			...(taxes.length > 0 ? { taxes } : {}),
			...(fulfillment ? { fulfillments: [fulfillment] } : {}),
		},
	};
}

export async function createSquareOrder(checkoutData: CheckoutType, idempotencyKey: string) {
	const squareConfig = requireSquareConfig(checkoutData);
	const body = buildSquareOrderBody(checkoutData, idempotencyKey);
	return await smartFetch(squareConfig.ordersUrl, {
		responseType: 'json',
		cacheStrategy: 'none',
		retries: 0,
		requestInit: {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				Authorization: `Bearer ${squareConfig.accessToken}`,
			},
			body: JSON.stringify(body),
		},
	});
}

function createSquareIdempotencyKey(suffix: string) {
	return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}-${suffix}`;
}

function getSquarePaymentAmount(checkoutData: CheckoutType, orderResponse: any) {
	const orderTotalMoney = orderResponse?.order?.total_money;
	return typeof orderTotalMoney?.amount === 'number'
		? orderTotalMoney.amount / 100
		: checkoutData.total;
}

export async function createSquareOrderAndCapturePayment(sourceId: string, checkoutData: CheckoutType) {
	const orderIdempotencyKey = createSquareIdempotencyKey('order');
	const paymentIdempotencyKey = createSquareIdempotencyKey('payment');
	const orderResponse = await createSquareOrder(checkoutData, orderIdempotencyKey);
	const orderId = orderResponse?.order?.id || orderResponse?.order_id || orderResponse?.id;
	const paymentAmount = getSquarePaymentAmount(checkoutData, orderResponse);
	const captureResponse = await captureSquarePayment(sourceId, checkoutData, paymentIdempotencyKey, orderId, paymentAmount);
	return {
		...captureResponse,
		orderResponse,
	};
}

export async function captureSquarePayment(sourceId: string, checkoutData: CheckoutType, idempotencyKey: string, orderId?: string, paymentAmount?: number) {
	const squareConfig = requireSquareConfig(checkoutData);
	const body = buildSquarePaymentBodyWithOrder(sourceId, checkoutData, idempotencyKey, orderId, paymentAmount);
	const paymentsUrl = squareConfig.paymentsUrl;
	if (debug) {
		console.log('captureSquarePayment', {
			paymentsUrl,
			locationId: squareConfig.locationId,
			useSandbox: squareConfig.useSandbox,
			accessToken: maskToken(squareConfig.accessToken),
			sourceId,
			idempotencyKey,
			amount: body.amount_money?.amount,
			body,
		});
	}
	try {
		const json = await smartFetch(paymentsUrl, {
			responseType: 'json',
			cacheStrategy: 'none',
			retries: 0,
			requestInit: {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					Authorization: `Bearer ${squareConfig.accessToken}`,
				},
				body: JSON.stringify(body),
			},
		});

		return json;
	} catch (error) {
		throw createSquarePaymentError(error);
	}
}

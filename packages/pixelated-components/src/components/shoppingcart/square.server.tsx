import React from 'react';
import type { SquareStoreItemShapeType } from './square';
import { Callout } from '../structure/callout';
import { SquareStoreItems } from './square.components';
import { buildSquareStoreFilters, squareStorePriceBuckets, getSquareStorePriceRanges, getSquarePaymentErrorMessage, matchesSquareStorePriceRange, SquarePaymentError, SquareFilterValues, SquareStoreFilter, SquareStoreFilters, SquareStoreFilterValue  } from './square';
import { getFullPixelatedConfig } from '../config/config';
import { CacheManager } from '../foundation/cache-manager';
import { smartFetch } from '../foundation/smartfetch';
import { sanitizeString, normalizeEmail } from '../foundation/utilities';
import { contentfulValueToSlug } from '../integrations/contentful.delivery';
import type { CheckoutType } from './shoppingcart.functions';

const debug = false;

export interface SquareStoreItemsResponse {
	items: SquareStoreItemShapeType[];
	filters: SquareStoreFilters;
}

export interface SquareStoreQueryOptions {
	featuredOnly?: boolean;
	propertyName?: string;
	propertyValue?: string;
}

export type SquareStoreEventImage = {
	image: string;
};

export type SquareStoreEventFields = {
	id: string;
	title: string;
	description?: string;
	startDate?: string;
	endDate?: string;
	duration?: number;
	maxSeats?: number;
	sku?: string;
	price?: number;
	status?: string;
	carouselImages?: SquareStoreEventImage[];
	category?: string[];
	schedule?: string;
	isShippable?: boolean;
	weight?: number;
	weightUnit?: string;
};

export interface SquareStoreEventShapeType {
	fields: SquareStoreEventFields;
}

const squareStoreCache = new CacheManager({ mode: 'memory', domain: 'pixelated-components', namespace: 'square-store', ttl: 10 * 60 * 1000 });
const squareEventCache = new CacheManager({ mode: 'memory', domain: 'pixelated-components', namespace: 'square-events', ttl: 10 * 60 * 1000 });

export function clearSquareStoreCache() {
	squareStoreCache.clear();
}

export type SquareStoreItemsWrapperProps = {
	prefilter?: SquareStoreQueryOptions;
	initialFilter?: SquareFilterValues;
	title?: string;
	intro?: string;
	emptyMessage?: string;
	errorMessage?: string;
	showFilters?: boolean;
	itemSize?: 'small' | 'large';
};

export type SquareEventWrapperProps = {
	type: 'list' | 'detail';
	eventId?: string;
};

export async function SquareStoreItemsWrapper(props: SquareStoreItemsWrapperProps) {
	const { prefilter, initialFilter, title, intro, emptyMessage, errorMessage, showFilters = true, itemSize = 'small' } = props;
	try {
		const response = await getSquareStoreItems(prefilter ?? {});
		return (
			<SquareStoreItems
				items={response.items}
				filters={response.filters}
				initialFilter={initialFilter}
				title={title}
				intro={intro}
				emptyMessage={emptyMessage}
				errorMessage={errorMessage}
				showFilters={showFilters}
				itemSize={itemSize}
			/>
		);
	} catch (error: any) {
		return (
			<Callout
				variant="boxed"
				title="Store loading error"
				subtitle={errorMessage ?? error?.message ?? 'Unable to load boutique items at this time.'}
			/>
		);
	}
}

export async function SquareEventWrapper(props: SquareEventWrapperProps): Promise<SquareStoreEventShapeType[] | SquareStoreEventShapeType | null> {
	const { type, eventId } = props;
	if (type === 'detail') {
		const item = eventId ? await getSquareEventItemById(eventId) : undefined;
		return item ?? null;
	}
	return await getSquareEventItems();
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

async function fetchSquareCustomAttributeDefinitions(squareConfig: any) {
	const accessToken = squareConfig?.squareAccessToken || squareConfig?.sandboxSquareAccessToken;
	if (!accessToken) {
		throw new Error('Square access token is not configured.');
	}
	const url = `${getSquareBaseUrl(squareConfig)}/v2/catalog/list?types=CUSTOM_ATTRIBUTE_DEFINITION`;
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
	return Array.isArray(response?.objects) ? response.objects : [];
}

function buildSquareSelectionLabelMap(definitions: any[], attributeName: string) {
	const normalizedAttributeName = sanitizeString(attributeName).toLowerCase();
	for (const def of definitions) {
		const data = def?.custom_attribute_definition_data;
		if (!data || typeof data.name !== 'string') continue;
		if (sanitizeString(data.name).toLowerCase() !== normalizedAttributeName) continue;
		const selectionMap = new Map<string, string>();
		const selections = data?.selection_config?.allowed_selections;
		if (!Array.isArray(selections)) return selectionMap;
		for (const selection of selections) {
			if (typeof selection?.uid === 'string' && typeof selection?.name === 'string') {
				selectionMap.set(selection.uid.toLowerCase(), selection.name);
			}
		}
		return selectionMap;
	}
	return new Map();
}

function getPropertyValue(value: any) {
	if (typeof value === 'string') return value;
	if (typeof value === 'boolean') return value ? 'true' : 'false';
	if (typeof value === 'number') return String(value);
	if (Array.isArray(value)) return value.filter(Boolean).join(',');
	if (value && typeof value === 'object') {
		if (Array.isArray(value.selection_uid_values)) return value.selection_uid_values.filter(Boolean).join(',');
		if (typeof value.string_value === 'string') return value.string_value;
		if (typeof value.boolean_value === 'boolean') return value.boolean_value ? 'true' : 'false';
		if (typeof value.number_value === 'number' || typeof value.number_value === 'string') return String(value.number_value);
		if (typeof value.type_annotation === 'string') return value.type_annotation;
	}
	return '';
}

function parseSquareWeight(value: any) {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string') {
		const cleaned = value.trim();
		const match = cleaned.match(/^([0-9]+(?:\.[0-9]+)?)(?:\s*(lb|lbs|kg|g|oz|ounce|ounces))?$/i);
		if (match) return Number(match[1]);
		const parsed = Number(cleaned);
		return Number.isFinite(parsed) ? parsed : undefined;
	}
	return undefined;
}

function getSquareItemWeight(
	itemData: any,
	variationWeight: any,
	variationWeightUnit: string | undefined,
	properties: Record<string, string> = {}
) {
	const normalizedProperties = Object.entries(properties).reduce((acc, [key, value]) => {
		acc[key.trim().toLowerCase()] = value;
		return acc;
	}, {} as Record<string, string>);

	const weightKey = ['weight', 'item weight', 'shippable weight', 'shipping weight']
		.find((key) => Object.prototype.hasOwnProperty.call(normalizedProperties, key));
	const propertyWeight = weightKey ? parseSquareWeight(normalizedProperties[weightKey]) : undefined;

	const unitKey = ['weight unit', 'item weight unit', 'shippable weight unit', 'shipping weight unit']
		.find((key) => Object.prototype.hasOwnProperty.call(normalizedProperties, key));
	let propertyWeightUnit: string | undefined;
	if (unitKey) {
		const rawUnit = normalizedProperties[unitKey].trim().toLowerCase();
		if (rawUnit) {
			if (rawUnit === 'lbs') propertyWeightUnit = 'lb';
			else if (rawUnit === 'ounces' || rawUnit === 'ounce') propertyWeightUnit = 'oz';
			else if (rawUnit === 'gram' || rawUnit === 'grams') propertyWeightUnit = 'g';
			else propertyWeightUnit = rawUnit;
		}
	}

	const itemWeight = parseSquareWeight(itemData?.item_weight) ?? propertyWeight ?? parseSquareWeight(variationWeight);
	const itemWeightUnit = itemWeight !== undefined
		? itemData?.item_weight_unit || propertyWeightUnit || variationWeightUnit || 'lb'
		: undefined;
	return { itemWeight, itemWeightUnit };
}

function isTruthySquareProperty(value: any, selectionLabelMap?: Map<string, string>) {
	const normalized = sanitizeString(getPropertyValue(value));
	const lowerNormalized = normalized.toLowerCase();
	if (lowerNormalized === 'true' || lowerNormalized === 'yes' || lowerNormalized === '1') return true;
	if (lowerNormalized === 'false' || lowerNormalized === 'no' || lowerNormalized === '0') return false;
	const uids = normalized.split(',').map((uid) => uid.trim()).filter(Boolean);
	if (selectionLabelMap) {
		for (const uid of uids) {
			const label = selectionLabelMap.get(uid.toLowerCase());
			if (typeof label === 'string') {
				const normalizedLabel = sanitizeString(label).toLowerCase();
				if (normalizedLabel === 'true' || normalizedLabel === 'yes' || normalizedLabel === '1') return true;
				if (normalizedLabel === 'false' || normalizedLabel === 'no' || normalizedLabel === '0') return false;
			}
		}
	}
	return false;
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

function getItemProperties(itemObject: any, variationObjects: any[] = []) {
	const properties: Record<string, string> = {};
	function collectAttributes(attributeSource: any) {
		if (!attributeSource || typeof attributeSource !== 'object') {
			return;
		}
		const entries = Array.isArray(attributeSource)
			? attributeSource
			: Object.values(attributeSource);
		for (const attr of entries) {
			const name = attr?.name || attr?.custom_attribute_definition_id;
			const value = attr?.string_value ?? attr?.boolean_value ?? attr?.number_value ?? attr?.type_annotation ?? attr?.selection_uid_values;
			if (name && value !== undefined && value !== null) {
				properties[name] = getPropertyValue(value);
			}
		}
	}

	collectAttributes(itemObject?.custom_attribute_values);
	collectAttributes(itemObject?.item_data?.custom_attribute_values);
	for (const variationObject of variationObjects) {
		collectAttributes(variationObject?.custom_attribute_values);
		collectAttributes(variationObject?.item_variation_data?.custom_attribute_values);
	}
	return properties;
}


function normalizeSquareItemCategoryIds(squareItemCategoryId?: string | string[]) {
	if (Array.isArray(squareItemCategoryId)) {
		return squareItemCategoryId.filter((id) => typeof id === 'string' && id.trim().length > 0).map((id) => id.trim());
	}
	if (typeof squareItemCategoryId === 'string' && squareItemCategoryId.trim().length > 0) {
		return [squareItemCategoryId.trim()];
	}
	return [];
}

function filterSquareStoreItems(
	items: SquareStoreItemShapeType[],
	squareItemCategoryId?: string | string[],
	squareFeaturedCategoryId?: string,
	options: SquareStoreQueryOptions = {}
) {
	const categoryIds = normalizeSquareItemCategoryIds(squareItemCategoryId);
	return items.filter((item) => {
		if (item.itemInventory <= 0) return false;
		if (categoryIds.length && !categoryIds.some((categoryId) => (item.categoryPath || []).includes(categoryId))) return false;
		if (options.featuredOnly && squareFeaturedCategoryId && !(item.categoryPath || []).includes(squareFeaturedCategoryId)) return false;
		if (options.propertyName && options.propertyValue) {
			if (options.propertyName === 'Category') {
				if (!item.categories?.some((category) => category?.id === options.propertyValue)) return false;
			} else {
				const actual = item.properties?.[options.propertyName];
				if (sanitizeString(actual) !== sanitizeString(options.propertyValue)) return false;
			}
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

function getSquareEventImageUrls(itemData: any, albumImageMap: Map<string, string>) {
	const imageIds = new Set<string>();
	if (Array.isArray(itemData?.image_ids)) {
		for (const imageId of itemData.image_ids) {
			if (typeof imageId === 'string' && imageId.trim()) {
				imageIds.add(imageId);
			}
		}
	}
	if (Array.isArray(itemData?.variations)) {
		for (const variationRef of itemData.variations) {
			const variationImageIds = variationRef?.item_variation_data?.image_ids;
			if (Array.isArray(variationImageIds)) {
				for (const imageId of variationImageIds) {
					if (typeof imageId === 'string' && imageId.trim()) {
						imageIds.add(imageId);
					}
				}
			}
		}
	}
	return Array.from(imageIds)
		.map((imageId) => albumImageMap.get(imageId))
		.filter((url): url is string => Boolean(url));
}

function buildSquareEventSchedule(startDate?: string, endDate?: string) {
	if (!startDate || !endDate) return undefined;
	try {
		const start = new Date(startDate).toLocaleString('en-US', {
			dateStyle: 'short',
			timeStyle: 'short',
		}).replace(',', '');
		const end = new Date(endDate).toLocaleString('en-US', {
			dateStyle: 'short',
			timeStyle: 'short',
		}).replace(',', '');
		return `${start} - ${end}`;
	} catch {
		return undefined;
	}
}

function isSquareEventComplete(startDate?: string, endDate?: string) {
	if (!endDate) {
		return false;
	}
	const endTime = Date.parse(endDate);
	return !Number.isNaN(endTime) && endTime < Date.now();
}

function buildSquareEventStatus(startDate?: string, endDate?: string, itemInventory?: number) {
	const now = Date.now();
	const endTime = endDate ? Date.parse(endDate) : NaN;
	if (itemInventory !== undefined && itemInventory <= 0) {
		return 'closed';
	}
	if (!Number.isNaN(endTime) && endTime < now) {
		return 'closed';
	}
	return 'open';
}

function getSquareEventDurationHours(startDate?: string, endDate?: string) {
	if (!startDate || !endDate) {
		return undefined;
	}
	const start = new Date(startDate);
	const end = new Date(endDate);
	if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
		return undefined;
	}
	const startMinutes = start.getUTCHours() * 60 + start.getUTCMinutes();
	const endMinutes = end.getUTCHours() * 60 + end.getUTCMinutes();
	const minutesDiff = ((endMinutes - startMinutes) + 24 * 60) % (24 * 60);
	return Math.round(minutesDiff / 60);
}

function buildSquareEventItem(
	itemObject: any,
	variationMap: Map<string, any>,
	albumImageMap: Map<string, string>,
	countsMap: Map<string, number>,
	selectionLabelMap?: Map<string, string>
): SquareStoreEventShapeType | undefined {
	const itemData = itemObject?.item_data || {};
	if (itemData?.product_type !== 'EVENT') return undefined;
	const variationRefs = Array.isArray(itemData?.variations) ? itemData.variations : [];
	const variationIds = variationRefs.map((ref: any) => ref?.id).filter(Boolean);
	let variationObjects = variationIds.map((variationId: string) => variationMap.get(variationId)).filter(Boolean);
	if (variationObjects.length === 0) {
		variationObjects = variationRefs.filter((ref: any) => ref?.item_variation_data);
	}
	const variationObject = variationObjects[0];
	const variationData = variationObject?.item_variation_data || {};
	const price = typeof variationData?.price_money?.amount === 'number' ? variationData.price_money.amount / 100 : undefined;
	const imageUrls = getSquareEventImageUrls(itemData, albumImageMap);
	const carouselImages = imageUrls.length ? imageUrls.map((image) => ({ image })) : undefined;
	const startDate = itemData?.event?.start_at;
	const endDate = itemData?.event?.end_at;
	if (isSquareEventComplete(startDate, endDate)) {
		return undefined;
	}
	const duration = getSquareEventDurationHours(startDate, endDate);
	const itemInventory = variationIds.reduce((total: number, id: string) => total + (countsMap.get(id) ?? 0), 0);
	const properties = getItemProperties(itemObject, variationObjects);
	return {
		fields: {
			id: itemObject?.id || '',
			title: itemData?.name || 'Untitled Event',
			description: itemData?.description || itemData?.description_plaintext || undefined,
			startDate,
			endDate,
			duration,
			maxSeats: itemInventory,
			sku: itemData?.sku || (variationObjects.length > 0 ? variationData?.sku : undefined),
			price,
			status: buildSquareEventStatus(startDate, endDate, itemInventory),
			carouselImages,
			category: ['event'],
			schedule: buildSquareEventSchedule(startDate, endDate),
			isShippable: isTruthySquareProperty(itemData?.is_shippable, selectionLabelMap)
				|| isTruthySquareProperty(properties?.isShippable, selectionLabelMap)
				|| isTruthySquareProperty(properties?.is_shippable, selectionLabelMap),
			weight: itemData?.item_weight,
			weightUnit: itemData?.item_weight_unit || variationData?.item_weight_unit || 'lb',
		},
	};
}

async function normalizeSquareEventObjects(squareConfig: any, selectionLabelMap?: Map<string, string>) {
	const objects = await fetchSquareCatalogObjects(squareConfig);
	const variationMap = new Map<string, any>();
	const imageMap = new Map<string, string>();
	const itemObjects: any[] = [];

	for (const object of objects) {
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

	return itemObjects
		.map((item) => buildSquareEventItem(item, variationMap, imageMap, countsMap, selectionLabelMap))
		.filter((item): item is SquareStoreEventShapeType => Boolean(item));
}

export async function getSquareEventItems() {
	const squareConfig = getFullPixelatedConfig()?.integrations?.square;
	if (!squareConfig) {
		throw new Error('Square configuration is required for event items.');
	}

	const cacheKey = 'square_event_items';
	const cached = squareEventCache.get<SquareStoreEventShapeType[]>(cacheKey);
	if (cached) return cached;

	const definitions = await fetchSquareCustomAttributeDefinitions(squareConfig);
	const selectionLabelMap = buildSquareSelectionLabelMap(definitions, 'isShippable');
	const items = await normalizeSquareEventObjects(squareConfig, selectionLabelMap);
	items.sort((a, b) => {
		const aTime = a.fields.startDate ? Date.parse(a.fields.startDate) : Infinity;
		const bTime = b.fields.startDate ? Date.parse(b.fields.startDate) : Infinity;
		return aTime - bTime;
	});
	squareEventCache.set(cacheKey, items);
	return items;
}

export async function getSquareEventItemById(eventId?: string) {
	if (!eventId) return undefined;
	const items = await getSquareEventItems();
	return items.find((item) => {
		if (item.fields.id === eventId) return true;
		return contentfulValueToSlug({ value: item.fields.title }) === eventId;
	});
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
	const squareItemCategoryIds = normalizeSquareItemCategoryIds(squareConfig?.squareItemCategoryId);
	const cacheKey = `catalog_${squareItemCategoryIds.length ? squareItemCategoryIds.join(',') : 'all'}`;
	const cached = squareStoreCache.get<any>(cacheKey);
	if (cached) {
		return cached;
	}

	const accessToken = squareConfig?.squareAccessToken || squareConfig?.sandboxSquareAccessToken;
	if (!accessToken) {
		throw new Error('Square access token is not configured.');
	}

	if (!squareItemCategoryIds.length) {
		throw new Error('square.squareItemCategoryId is required to fetch Square boutique items.');
	}

	const url = `${getSquareBaseUrl(squareConfig)}/v2/catalog/search-catalog-items`;
	const collectedObjects: any[] = [];
	let cursor: string | undefined;

	do {
		const body: any = {
			category_ids: squareItemCategoryIds,
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
	categoryMap: Map<string, any>,
	selectionLabelMap?: Map<string, string>
): SquareStoreItemShapeType | undefined {
	const itemData = itemObject?.item_data || {};
	const eventStartDate = itemData?.event?.start_at;
	const eventEndDate = itemData?.event?.end_at;
	if (itemData?.product_type === 'EVENT' && isSquareEventComplete(eventStartDate, eventEndDate)) {
		return undefined;
	}
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

	const properties = getItemProperties(itemObject, variationObjects);
	const itemInventory = variationIds.reduce((total: number, id: string) => total + (countsMap.get(id) ?? 0), 0);
	const itemAvailableSeats = itemData?.product_type === 'EVENT' ? itemInventory : undefined;
	const itemMaxSeats = itemData?.product_type === 'EVENT' ? itemInventory : undefined;
	const itemStartDate = eventStartDate ? new Date(eventStartDate).toLocaleDateString('en-US', { dateStyle: 'short' }) : undefined;
	const itemStartTime = eventStartDate ? new Date(eventStartDate).toLocaleTimeString('en-US', { timeStyle: 'short' }) : undefined;
	const itemEndDate = eventEndDate ? new Date(eventEndDate).toLocaleDateString('en-US', { dateStyle: 'short' }) : undefined;
	const itemEndTime = eventEndDate ? new Date(eventEndDate).toLocaleTimeString('en-US', { timeStyle: 'short' }) : undefined;
	const itemDurationHours = eventStartDate && eventEndDate ? getSquareEventDurationHours(eventStartDate, eventEndDate) : undefined;

	const itemTitle = itemData?.name || 'Untitled Item';
	const itemSlug = slugifyValue(itemTitle);
	const itemId = itemObject?.id || '';
	const variationWeight = variationObjects.length > 0 ? variationObjects[0]?.item_variation_data?.item_weight : undefined;
	const variationWeightUnit = variationObjects.length > 0 ? variationObjects[0]?.item_variation_data?.item_weight_unit : undefined;
	const itemSKU = itemData?.sku || (variationObjects.length > 0 ? variationObjects[0]?.item_variation_data?.sku : undefined);
	const { itemWeight, itemWeightUnit } = getSquareItemWeight(itemData, variationWeight, variationWeightUnit, properties);
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
		itemIsShippable: isTruthySquareProperty(itemData?.is_shippable, selectionLabelMap)
			|| isTruthySquareProperty(properties?.isShippable, selectionLabelMap)
			|| isTruthySquareProperty(properties?.is_shippable, selectionLabelMap),
		itemSKU,
		itemDurationHours,
		itemWeightUnit,
		itemWeight,
		itemStartDate,
		itemStartTime,
		itemEndDate,
		itemEndTime,
		itemAvailableSeats,
		itemMaxSeats,
		properties: Object.keys(properties).length ? properties : undefined,
		categories: categories.length ? categories : undefined,
		itemCategory: categories.length ? categories.map((cat) => cat.name) : undefined,
		categoryPath: categoryPath.length ? categoryPath : undefined,
	};
}

async function normalizeSquareCatalogObjects(squareConfig: any, selectionLabelMap?: Map<string, string>) {
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

	const items = itemObjects
		.map((item) => buildSquareStoreItem(item, variationMap, imageMap, countsMap, categoryMap, selectionLabelMap))
		.filter((item): item is SquareStoreItemShapeType => Boolean(item));
	return { items, categoryMap };
}

export async function getSquareStoreItems(options: SquareStoreQueryOptions = {}) {
	const squareConfig = getFullPixelatedConfig()?.integrations?.square;
	if (!squareConfig) {
		throw new Error('Square configuration is required for store items.');
	}
	const squareItemCategoryIds = normalizeSquareItemCategoryIds(squareConfig.squareItemCategoryId);
	if (!squareItemCategoryIds.length) {
		throw new Error('square.squareItemCategoryId is required to fetch Square boutique items.');
	}
	const squareFeaturedCategoryId = squareConfig.squareFeaturedCategoryId;

	const cacheKey = `store_${squareItemCategoryIds.join(',')}_${squareFeaturedCategoryId || 'none'}_${options.featuredOnly ? 'featured' : 'all'}_${options.propertyName || ''}_${options.propertyValue || ''}`;
	const cached = squareStoreCache.get<SquareStoreItemsResponse>(cacheKey);
	if (cached) return cached;

	const definitions = await fetchSquareCustomAttributeDefinitions(squareConfig);
	const selectionLabelMap = buildSquareSelectionLabelMap(definitions, 'isShippable');
	const { items } = await normalizeSquareCatalogObjects(squareConfig, selectionLabelMap);
	const filtered = filterSquareStoreItems(items, squareItemCategoryIds, squareFeaturedCategoryId, options);
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
	return resolveSquareCredentials(cfg?.integrations?.square, checkoutData);
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
	const taxRateValue = Number(config?.integrations?.shoppingcart?.taxRate ?? 0);
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

function maybeGetSquarePaymentErrorMessage(error: unknown) {
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

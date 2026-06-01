import { getCartItemCount, getCartSubTotal, formatAsHundredths, type CartItemType } from "@pixelated-tech/components";

function normalizeItemCategories(item: CartItemType) {
	if (!item?.itemCategory) return [];
	const categories = Array.isArray(item.itemCategory) ? item.itemCategory : [item.itemCategory];
	return Array.from(
		new Set(
			categories
				.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
				.map((value) => value.toLowerCase().trim()),
		),
	);
}

function getEventItems(cart: CartItemType[]) {
	return cart.filter((item) => normalizeItemCategories(item).includes('event'));
}

export function getThreeMusesQuantityDiscount(cart: CartItemType[]) {
	const eventItems = getEventItems(cart);
	const itemCount = getCartItemCount(eventItems);
	const subtotal = getCartSubTotal(eventItems);
	let discountPercent = 0;

	if (itemCount === 2) {
		discountPercent = 0.10;
	} else if (itemCount >= 3 && itemCount <= 4) {
		discountPercent = 0.15;
	} else if (itemCount >= 5 && itemCount <= 8) {
		discountPercent = 0.20;
	} else if (itemCount >= 9) {
		discountPercent = 0.30;
	}

	return formatAsHundredths(subtotal * discountPercent);
}

export function getThreeMusesSiblingDiscount(cart: CartItemType[]) {
	const eventItems = getEventItems(cart);
	const hasSiblingDiscount = eventItems.some((item) => {
		return typeof item === 'object' && item !== null && item.itemQuantity > 1;
	});
	return hasSiblingDiscount ? 25 : 0;
}

export function getThreeMusesSubtotalDiscount(cart: CartItemType[]) {
	return formatAsHundredths(
		getThreeMusesQuantityDiscount(cart) + getThreeMusesSiblingDiscount(cart)
	);
}

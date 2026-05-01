import { getCartItemCount, getCartSubTotal, formatAsHundredths, type CartItemType } from "@pixelated-tech/components";

export function getThreeMusesQuantityDiscount(cart: CartItemType[]) {
	const itemCount = getCartItemCount(cart);
	const subtotal = getCartSubTotal(cart);
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
	const hasSiblingDiscount = cart.some((item) => {
		return typeof item === 'object' && item !== null && item.itemQuantity > 1;
	});
	return hasSiblingDiscount ? 25 : 0;
}

export function getThreeMusesSubtotalDiscount(cart: CartItemType[]) {
	return formatAsHundredths(
		getThreeMusesQuantityDiscount(cart) + getThreeMusesSiblingDiscount(cart)
	);
}

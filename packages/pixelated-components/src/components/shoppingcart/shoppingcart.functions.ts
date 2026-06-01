
import { getContentfulDiscountCodes } from "../integrations/contentful.delivery";
import { CacheManager } from "../foundation/cache-manager";
import { getDomain, formatAsUSD, formatAsHundredths } from "../foundation/utilities";
import type { ShoppingCartConfig } from "../config/config.types";

// Migration-time verbose tracing per user request — remove after verification
const debug = false;

// Use CacheManager with domain + namespace to prevent multi-tenant cache collisions
const cartCache = new CacheManager({ mode: 'local', domain: getDomain(), namespace: 'checkout' });
/* ========== LOCALSTORAGE KEYS ========== */
export const shoppingCartKey = "pixelvividCart";
export const shippingInfoKey = "pixelvividCartShipping";
export const discountCodesKey = "pixelvividDiscountCodes";
export const checkoutInfoKey = "pixelvividCartCheckout";


// API configuration is now provided via config provider and function parameters
// See config/config.ts for contentful configuration

/* 
https://stackoverflow.com/questions/55328748/how-to-store-and-retrieve-shopping-cart-items-in-localstorage
https://michalkotowski.pl/writings/how-to-refresh-a-react-component-when-local-storage-has-changed
*/

/* ========== TYPES ========== */

/**
 * Canonical Cart Item model (data-only)
 *
 * This type is the *single source of truth* for shopping cart items used by
 * business logic, storage, and integrations. Component prop types should
 * either alias this type (e.g. `ShoppingCartItemProps = { item: CartItemType }`)
 * or use their own `...Props` names to remain UI-focused.
 */
export type CartItemType = {
    itemID: string,
    itemURL?: string,
    itemTitle: string,
	itemDescription?: string,
    itemImageURL? : string,
    itemQuantity: number,
    itemInventory: number,
    itemCost: number,
    itemCurrency?: string,
    itemIsShippable?: boolean,
    itemWeight?: number,
    itemWeightUnit?: string,
    itemType?: string,
    itemCategory?: string | string[],
}

/* Historical: legacy ShoppingCartItemType removed — use CartItemType as the canonical data type */

export type AddressType = {
    name: string,
    street1: string,
    city: string,
    state: string,
    zip: string,
    country: string,
    email?: string,
    phone?: string,
}

export type ShippingInfoType = AddressType & {
    shippingMethod?: string,
    shippingCost?: number | string,
    discountCode?: string,
    originPostalCode?: string,
    originCountry?: string,
}

export type DiscountCodeType = {
    codeName: string,
    codeDescription: string,
    codeType: string,
    codeStart: string,
    codeEnd: string,
    codeValue: number,
};

export type CheckoutType = {
    items: CartItemType[];
    subtotal: number,
    subtotal_discount: number,
    shippingTo: ShippingInfoType,
    shippingCost: number,
    handlingFee: number,
	currency?: string,
	handlingFeeCurrency?: string,
    insuranceCost?: number,
    shipping_discount?: number,
    salesTax: number;
    total: number;
    shippingWeight?: number;
}

/* ======================================= */
/* ========== BACKEND FUNCTIONS ========== */
/* ======================================= */




/* ========== SHOPPING CART FUNCTIONS ========== */


export function getCart() {
	if (debug) console.debug('ShoppingCart:getCart -> using CacheManager.get', shoppingCartKey);
	// Use CacheManager as the single source-of-truth. Legacy raw-localStorage fallbacks
	// were removed after migration completed — callers should use CacheManager APIs.
	const cached = cartCache.get<CartItemType[]>(shoppingCartKey);
	if (cached) return cached;
	// No cart found -> empty
	return [];
}


export function setCart(shoppingCartJSON: CartItemType[]) {
	if (debug) console.debug('ShoppingCart:setCart -> using CacheManager.set', shoppingCartKey, shoppingCartJSON);
	cartCache.set<CartItemType[]>(shoppingCartKey, shoppingCartJSON);
	// preserve observable contract (storage event) for listeners
	window.dispatchEvent(new Event('storage'));
}


export function alreadyInCart(cart: CartItemType[], itemID: string) {
	for (const key in cart) {
		const item = cart[key];
		if (typeof item === 'object' && item !== null && Object.prototype.hasOwnProperty.call(item, 'itemID') && item.itemID == itemID) {
			return true;
		} 
	}
	return false;
}


export function increaseQuantityCart(cart: CartItemType[], itemID: string) {
	for (const key in cart) {
		const item = cart[key];
		if (typeof item === 'object' && item !== null && Object.prototype.hasOwnProperty.call(item, 'itemID') && item.itemID == itemID) {
			const limit = Number(item.itemInventory) || 1;
			if (item.itemQuantity < limit) {
				item.itemQuantity += 1;
			}
		} 
	}
}


export function decreaseQuantityCart(cart: CartItemType[], itemID: string) {
	for (const key in cart) {
		const item = cart[key];
		if (typeof item === 'object' && item !== null && Object.prototype.hasOwnProperty.call(item, 'itemID') && item.itemID == itemID) {
			if (item.itemQuantity > 1) {
				item.itemQuantity -= 1;
			}
		} 
	}
}


export function getIndexInCart(cart: CartItemType[], itemID: string) {
	for (let i = 0; i < cart.length; i++) {
		const item = cart[i];
		if (typeof item === 'object' && item !== null && Object.prototype.hasOwnProperty.call(item, 'itemID') && item.itemID == itemID) {
			return i;
		} 
	}
	return -1;
}


export function getCartItemCount(cart: CartItemType[]) {
	let cartCount = 0 ;
	for (let i = 0; i < cart.length; i++) {
		const item = cart[i];
		if (typeof item === 'object' && item !== null && Object.prototype.hasOwnProperty.call(item, 'itemID') ) {
			cartCount = cartCount + ( item.itemQuantity );
		} 
	}
	return cartCount;
}

export function getCartSubTotal(cart: CartItemType[]) {
	let cartSubTotal = 0;
	for (let i = 0; i < cart.length; i++) {
		const item = cart[i];
		if (typeof item === 'object' && item !== null && 
            Object.prototype.hasOwnProperty.call(item, 'itemQuantity') && 
            Object.prototype.hasOwnProperty.call(item, 'itemCost') ) {
			cartSubTotal += (item.itemQuantity * item.itemCost);
		}
	}
	return formatAsHundredths(cartSubTotal);
}

function normalizeCartItemCost(item: any): number {
	const value = item?.itemCost ?? item?.itemPrice ?? item?.unit_amount?.value;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

export function addToShoppingCart(thisItem: CartItemType) {
	let cart: CartItemType[] = getCart();
	const inventoryLimit = thisItem.itemInventory ?? 1;
	
	if(alreadyInCart(cart, thisItem.itemID)){
		const index = getIndexInCart(cart, thisItem.itemID);
		// Sync latest inventory from source
		cart[index].itemInventory = inventoryLimit;
		if (!Number.isFinite(cart[index].itemCost)) {
			cart[index].itemCost = normalizeCartItemCost(thisItem);
		}

		if ( cart[index].itemQuantity < inventoryLimit) {
			if (debug) console.log("Increasing quantity in cart");
			increaseQuantityCart(cart, thisItem.itemID);
		} else {
			if (debug) console.log("Cant add more than item quantity to the cart");
			// cant add more than quantity
		}
	} else {
		// BE SURE TO ADD ONLY ONE TO THE CART
		if (debug) console.log("Adding only one to the cart");
		const cartItem = { ...thisItem };
		cartItem.itemCost = normalizeCartItemCost(thisItem);
		cartItem.itemQuantity = 1;
		cartItem.itemInventory = inventoryLimit;
		cart.push(cartItem);
	} 
	if (debug) console.debug('ShoppingCart:persisting cart -> CacheManager.set', shoppingCartKey, cart);
	cartCache.set<CartItemType[]>(shoppingCartKey, cart);
	window.dispatchEvent(new Event('storage'));
}


export function increaseQuantityInCart(thisItem: CartItemType) {
	let cart: CartItemType[] = [...getCart()];
	const index = getIndexInCart(cart, thisItem.itemID);
	if (index !== -1) {
		cart[index] = { ...cart[index], itemQuantity: cart[index].itemQuantity + 1 };
		const limit = Number(cart[index].itemInventory) || 1;
		if (cart[index].itemQuantity > limit) {
			cart[index].itemQuantity = limit;
		}
	}
	if (debug) console.debug('ShoppingCart:increaseQuantityInCart -> persisting cart via CacheManager', shoppingCartKey, cart);
	cartCache.set<CartItemType[]>(shoppingCartKey, cart);
	window.dispatchEvent(new Event('storage'));
}


export function decreaseQuantityInCart(thisItem: CartItemType) {
	let cart: CartItemType[] = [...getCart()];
	const index = getIndexInCart(cart, thisItem.itemID);
	if (index !== -1 && cart[index].itemQuantity > 1) {
		cart[index] = { ...cart[index], itemQuantity: cart[index].itemQuantity - 1 };
	}
	if (debug) console.debug('ShoppingCart:decreaseQuantityInCart -> persisting cart via CacheManager', shoppingCartKey, cart);
	cartCache.set<CartItemType[]>(shoppingCartKey, cart);
	window.dispatchEvent(new Event('storage'));
}


export function removeFromShoppingCart(thisItem: CartItemType) { 
	let cart: CartItemType[] = getCart().filter(item => item.itemID !== thisItem.itemID);
	if (debug) console.debug('ShoppingCart:removeFromShoppingCart -> persisting cart via CacheManager', shoppingCartKey, cart);
	cartCache.set<CartItemType[]>(shoppingCartKey, cart);
	window.dispatchEvent(new Event('storage'));
}


export function clearShoppingCart() {
	if (debug) console.debug('ShoppingCart:clearShoppingCart -> using CacheManager.remove', shoppingCartKey, shippingInfoKey);
	cartCache.remove(shoppingCartKey);
	cartCache.remove(shippingInfoKey);
	window.dispatchEvent(new Event('storage'));
}


export function clearShoppingCartCache() {
	if (debug) console.debug('ShoppingCart:clearShoppingCartCache -> using CacheManager.clear');
	cartCache.clear();
}

/* ========== SHIPPING INFO FUNCTIONS ========== */

export function getShippingInfo(): ShippingInfoType {
	if (debug) console.debug('ShoppingCart:getShippingInfo -> using CacheManager.get', shippingInfoKey);
	const cached = cartCache.get<ShippingInfoType>(shippingInfoKey);
	// Migration complete — don't read raw localStorage directly. Return empty when no data.
	return cached || ({} as ShippingInfoType);
}


export function setShippingInfo(shippingFormData: ShippingInfoType) {
	if (debug) console.debug('ShoppingCart:setShippingInfo -> using CacheManager.set', shippingInfoKey, shippingFormData);
	cartCache.set<ShippingInfoType>(shippingInfoKey, shippingFormData);
	window.dispatchEvent(new Event('storage'));
}


function normalizeWeightToPounds(weight: number, unit?: string): number {
	if (!weight || typeof weight !== 'number' || weight <= 0) return 0;
	const normalizedUnit = String(unit || 'lb').trim().toLowerCase();
	if (normalizedUnit === 'lb' || normalizedUnit === 'lbs') return weight;
	if (normalizedUnit === 'oz' || normalizedUnit === 'ounce' || normalizedUnit === 'ounces') return weight / 16;
	if (normalizedUnit === 'g' || normalizedUnit === 'gram' || normalizedUnit === 'grams') return weight * 0.00220462;
	return weight;
}


export function getCartShippingWeight(cart: CartItemType[]) {
	let totalWeight = 0;
	for (const item of cart) {
		if (!item || typeof item !== 'object') continue;
		const isShippable = item.itemIsShippable !== false;
		const weight = Number(item.itemWeight ?? 0);
		const quantity = Number(item.itemQuantity ?? 1);
		if (!isShippable || weight <= 0 || quantity <= 0) continue;
		const unit = item.itemWeightUnit;
		totalWeight += normalizeWeightToPounds(weight, unit) * quantity;
	}
	return formatAsHundredths(totalWeight);
}


export function getShippingInfoWithDefaults(defaultShippingInfo?: Partial<ShippingInfoType>) {
	const currentInfo = getShippingInfo();
	if (!defaultShippingInfo || typeof defaultShippingInfo !== 'object') {
		return currentInfo;
	}
	return { ...defaultShippingInfo, ...currentInfo };
}

export function getShippingCost(): number {
	const ship: any = getShippingInfo();
	const explicitShippingCost = ship?.shippingCost;
	if (explicitShippingCost != null && explicitShippingCost !== '') {
		const parsed = Number(explicitShippingCost);
		if (Number.isFinite(parsed)) {
			return formatAsHundredths(parsed);
		}
	}
	return 0;
}
/* ========== CHECKOUT FUNCTIONS ========== */


export function getCheckoutData(defaultShippingInfo?: Partial<ShippingInfoType>, shoppingcartConfig?: Partial<ShoppingCartConfig>, subtotalDiscountCustom = 0) {
	const shippingTo = getShippingInfoWithDefaults(defaultShippingInfo);
	const itemCost = getCartSubTotal(getCart());
	const subtotalDiscount = getCartSubtotalDiscount(getCart(), subtotalDiscountCustom);
	const shippingCost = getShippingCost();
	const handlingFeeType = shoppingcartConfig?.handlingFeeType === 'percentage' ? 'percentage' : 'fixed';
	const handlingFeeAmount = Number(shoppingcartConfig?.handlingFeeAmount ?? 3.99);
	const handlingFee = handlingFeeType === 'percentage'
		? formatAsHundredths((itemCost - subtotalDiscount + shippingCost) * (Number.isFinite(handlingFeeAmount) && handlingFeeAmount >= 0 ? handlingFeeAmount : 0))
		: formatAsHundredths(Number.isFinite(handlingFeeAmount) && handlingFeeAmount >= 0 ? handlingFeeAmount : 0);
	const checkoutCurrency = typeof (shoppingcartConfig?.handlingFeeCurrency || shoppingcartConfig?.currency || 'USD') === 'string' && String(shoppingcartConfig?.handlingFeeCurrency || shoppingcartConfig?.currency || 'USD').trim()
		? String(shoppingcartConfig?.handlingFeeCurrency || shoppingcartConfig?.currency || 'USD').trim().toUpperCase()
		: 'USD';
	const salesTaxRateValue = Number(shoppingcartConfig?.taxRate);
	const salesTaxRate = Number.isFinite(salesTaxRateValue) && salesTaxRateValue >= 0 ? salesTaxRateValue : 0.06675;
	const salesTaxBase = itemCost - subtotalDiscount + shippingCost;
	const salesTax = formatAsHundredths(salesTaxRate * salesTaxBase);
	const checkoutTotal = formatAsHundredths(itemCost - subtotalDiscount + shippingCost + handlingFee + salesTax);
	const checkoutObj: CheckoutType = {
		items: getCart(),
		subtotal: itemCost,
		subtotal_discount: subtotalDiscount,
		shippingTo,
		shippingCost,
		handlingFee,
		handlingFeeCurrency: checkoutCurrency,
		currency: checkoutCurrency,
		insuranceCost: undefined,
		shipping_discount: undefined,
		salesTax,
		total: checkoutTotal,
		shippingWeight: getCartShippingWeight(getCart()),
	};
	if (debug) console.log(checkoutObj);
	return checkoutObj;
}


/* ========== DISCOUNT CODE FUNCTIONS ========== */


export async function validateDiscountCode(field: { value: string ; }, apiProps?: any) { 
	try {
		const codeList = await getContentfulDiscountCodes({ apiProps: apiProps, contentType: "discountCodes" });
		if (!codeList) { return false; } // If no codes are found, return false
		if(field.value == '') { return true; } // If the field is empty, return true (no code entered)
		if ( codeList.some((code : DiscountCodeType) => code && code.codeName.toLowerCase() === field.value.toLowerCase() )) {
			// if code is in the codeList
			const foundCode = codeList.find((code : DiscountCodeType) => code.codeName.toLowerCase() === field.value.toLowerCase() );
			if(foundCode) {
				// if code is active - between start and end date
				const startDate = new Date(foundCode.codeStart);
				const endDate = new Date(foundCode.codeEnd);
				const today = new Date();
				const isActive = today >= startDate && today <= endDate;
				return isActive;
			}
		} else {
			// if code is not in the codeList
			return false;
		}
	} catch (error) {
		console.error("Error fetching discount codes:", error); // Handle potential errors
		throw error; // Or return false;
	}
}


export async function getRemoteDiscountCodes(apiProps?: any){
	if (debug) console.log("Getting Contentful Discount Codes");
	try {
		const discountCodes = await getContentfulDiscountCodes({ 
			apiProps: apiProps, 
			contentType: "discountCodes" 
		});
		if (debug) console.log("Retrieved Contentful Discount Codes: ", discountCodes);
		return discountCodes;
	} catch ( error ) {
		console.error("An error occurred getting discount codes:", error);
	};
}


export function getLocalDiscountCodes(){
	if (debug) console.debug('ShoppingCart:getLocalDiscountCodes -> using CacheManager.get', discountCodesKey);
	const cached = cartCache.get<DiscountCodeType[]>(discountCodesKey);
	if (cached) return cached;
	// Do not read raw localStorage directly after migration — return empty when absent.
	return [];
}


export function setDiscountCodes(discountCodesJSON: DiscountCodeType[]) {
	if (debug) console.debug("ShoppingCart:setDiscountCodes -> using CacheManager.set", discountCodesKey, discountCodesJSON);
	cartCache.set<DiscountCodeType[]>(discountCodesKey, discountCodesJSON);
	window.dispatchEvent(new Event('storage'));
}


export function getDiscountCode(codeString?: string){
	if (debug) console.log("Getting Discount Code Object");
	if (!codeString || codeString === '') { return undefined; } // If the code is empty, return null
	const discountCodes: DiscountCodeType[] = getLocalDiscountCodes();
	if (!discountCodes) { return undefined; } // If no codes are found, return null
	// Find the discount code in the list
	const discountCode = discountCodes.find((code: DiscountCodeType) => {
		if (code && code.codeName){
			return code.codeName.toLowerCase() === codeString.toLowerCase();
		}else {
			return undefined;
		}
	});
	return discountCode;
}


export function getCartSubtotalDiscount(cart: CartItemType[], subtotalDiscountCustom = 0) {
	if (!cart) { return 0; } // If cart is empty, return 0
	const cartSubTotal = getCartSubTotal(cart);
	const shippingInfo = getShippingInfo();
	const discountCode = getDiscountCode(shippingInfo.discountCode);
	let discountAmount = 0;
	if (discountCode) {
		if(discountCode.codeType === 'amount'){
			discountAmount = formatAsHundredths(discountCode.codeValue);
		} else if(discountCode.codeType === 'percent'){
			discountAmount = formatAsHundredths(cartSubTotal * discountCode.codeValue);
		}
	}

	const customDiscountAmount = Number(subtotalDiscountCustom);
	const additionalDiscount = Number.isFinite(customDiscountAmount) && customDiscountAmount > 0 ? formatAsHundredths(customDiscountAmount) : 0;

	return formatAsHundredths(discountAmount + additionalDiscount);
}



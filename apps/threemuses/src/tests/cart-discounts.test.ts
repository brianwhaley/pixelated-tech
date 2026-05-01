import { describe, expect, it } from 'vitest';
import { getThreeMusesQuantityDiscount, getThreeMusesSiblingDiscount, getThreeMusesSubtotalDiscount } from '@/app/lib/shoppingcart-discounts';

const baseItem = {
	itemID: '1',
	itemTitle: 'Camp One',
	itemCost: 100,
	itemURL: 'https://example.com/camp-one',
};

describe('Three Muses shopping cart discounts', () => {
	it('applies 10% discount for 2 total camp registrations', () => {
		const cart = [
			{ ...baseItem, itemQuantity: 1 },
			{ ...baseItem, itemID: '2', itemQuantity: 1 },
		];

		expect(getThreeMusesQuantityDiscount(cart)).toBe(20);
		expect(getThreeMusesSiblingDiscount(cart)).toBe(0);
		expect(getThreeMusesSubtotalDiscount(cart)).toBe(20);
	});

	it('applies 15% discount for 3 total camp registrations', () => {
		const cart = [
			{ ...baseItem, itemQuantity: 1 },
			{ ...baseItem, itemID: '2', itemQuantity: 1 },
			{ ...baseItem, itemID: '3', itemQuantity: 1 },
		];

		expect(getThreeMusesQuantityDiscount(cart)).toBe(45);
		expect(getThreeMusesSiblingDiscount(cart)).toBe(0);
		expect(getThreeMusesSubtotalDiscount(cart)).toBe(45);
	});

	it('applies 20% discount for 5 total camp registrations', () => {
		const cart = [
			{ ...baseItem, itemQuantity: 2 },
			{ ...baseItem, itemID: '2', itemQuantity: 3 },
		];

		expect(getThreeMusesQuantityDiscount(cart)).toBe(100);
		expect(getThreeMusesSiblingDiscount(cart)).toBe(25);
		expect(getThreeMusesSubtotalDiscount(cart)).toBe(125);
	});

	it('applies sibling discount only once when quantity is greater than one', () => {
		const cart = [
			{ ...baseItem, itemQuantity: 2 },
			{ ...baseItem, itemID: '2', itemQuantity: 1 },
		];

		expect(getThreeMusesSiblingDiscount(cart)).toBe(25);
		expect(getThreeMusesSubtotalDiscount(cart)).toBe(70);
	});
});

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PageTitleHeader, PageSection, ShoppingCart, getCart, type CartItemType, smartFetch, usePixelatedConfig } from "@pixelated-tech/components";
import { getThreeMusesSubtotalDiscount } from "../../lib/shoppingcart-discounts";
import baseFormData from "@/app/data/register-base-form.json";
import adultFormData from "@/app/data/register-adult-form.json";
import youthFormData from "@/app/data/register-youth-form.json";
import legalFormData from "@/app/data/register-legal-form.json";

export default function CartPage() {
	const [ cart, setCart ] = useState<CartItemType[]>([]);

	useEffect(() => {
		const updateCart = () => setCart(getCart());
		updateCart();
		window.addEventListener('storage', updateCart);
		return () => window.removeEventListener('storage', updateCart);
	}, []);

	const subtotalDiscountCustom = getThreeMusesSubtotalDiscount(cart);
	const siteInfo = usePixelatedConfig()?.siteInfo ?? {};

	const additionalInfoForm = useMemo(() => {
		const cartItemCategorySets = cart.map((item) => {
			const categories = item.itemCategory;
			const categoryArray = Array.isArray(categories) 
				? categories 
				: (categories == null ? [] : [categories]);
			
			return new Set(
				categoryArray
					.map((category) => category?.toString?.()?.toLowerCase?.()?.trim())
					.filter(Boolean)
			);
		});

		const hasEventCategoryFromSet = (categorySet: Set<string>) =>
			categorySet.has('event') || categorySet.has('events');

		const hasEventCategory = cartItemCategorySets.some(hasEventCategoryFromSet);
		
		// If no event items, show nothing
		if (!hasEventCategory) return null;

		const hasEventAdult = cartItemCategorySets.some(
			(s) => hasEventCategoryFromSet(s) && s.has('adult')
		);
		const hasEventYouth = cartItemCategorySets.some(
			(s) => hasEventCategoryFromSet(s) && (s.has('youth') || s.has('summer camp'))
		);

		const fields = [
			...(hasEventAdult ? adultFormData.fields ?? [] : []),
			...(hasEventYouth ? youthFormData.fields ?? [] : []),
			...(legalFormData.fields ?? []),
			...(baseFormData.fields ?? []),
		];

		return {
			properties: {
				...(baseFormData as any).properties ?? {},
			},
			fields,
		};
	}, [cart]) as any;

	async function handlePaymentCapture(payload: { sourceId: string; checkoutData: any; card?: any }) {
		return await smartFetch('/api/capture-payment', {
			requestInit: {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sourceId: payload.sourceId, checkoutData: payload.checkoutData }),
			},
			responseType: 'json',
		});
	}

	return (
		<>
			<PageTitleHeader title="Shopping Cart" />
			<PageSection columns={1} maxWidth="1024px" id="cart-page">
				<ShoppingCart
					subtotalDiscountCustom={subtotalDiscountCustom}
					additionalInfoForm={additionalInfoForm || undefined}
					onPaymentCapture={handlePaymentCapture}
					siteInfo={siteInfo as any}
					showDiscountForm={false}
				/>
			</PageSection>
		</>
	);
}

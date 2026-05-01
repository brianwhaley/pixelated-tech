"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PageTitleHeader, PageSection, ShoppingCart, getCart, type CartItemType, smartFetch } from "@pixelated-tech/components";
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

	const additionalInfoForm = useMemo(() => {
		const categories = new Set(
			cart
				.map((item) => item.itemCategory?.toString?.().toLowerCase?.()?.trim())
				.filter(Boolean),
		);

		const hasAdultCategory = categories.has('adult');
		const hasYouthCategory = categories.has('youth') || categories.has('summer camp');

		const fields = [
			...(hasAdultCategory ? adultFormData.fields ?? [] : []),
			...(hasYouthCategory ? youthFormData.fields ?? [] : []),
			...(legalFormData.fields ?? []),
			...(baseFormData.fields ?? []),
		];

		return {
			properties: {
				...(baseFormData.properties ?? {}),
			},
			fields,
		};
	}, [cart]);

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
			<PageSection columns={1} maxWidth="100%" id="cart-page">
				<ShoppingCart
					subtotalDiscountCustom={subtotalDiscountCustom}
					additionalInfoForm={additionalInfoForm}
					showShippingInfoSection={false}
					onPaymentCapture={handlePaymentCapture}
				/>
			</PageSection>
		</>
	);
}

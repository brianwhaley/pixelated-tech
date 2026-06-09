"use client";

import React from "react";
import { SchemaEvent, buildEventSchema, PageTitleHeader, PageSection, PageSectionHeader, SmartImage, FormButton, addToShoppingCart } from "@pixelated-tech/components";
import { useRouter } from 'next/navigation';

interface EventDetailProps {
    eventData: any;
    config: any;
}

export default function EventDetail({ eventData, config }: EventDetailProps) {
	const router = useRouter();
	const toDollars = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	});

	return (
		<>
			<SchemaEvent event={buildEventSchema(eventData, config.siteInfo)} />
			<PageTitleHeader title={eventData?.fields.title + " - " + eventData?.fields.id || ""} />
			<PageSection columns={1} id="event-callout-section">
				<PageSectionHeader title={ 
					new Date(eventData?.fields?.startDate).toLocaleString('en-US', {
						dateStyle: 'short', timeStyle: 'short'
					}).replace(',', '') + " - " + new Date(eventData?.fields?.endDate).toLocaleString('en-US', {
						dateStyle: 'short', timeStyle: 'short'
					}).replace(',', '')  
				} />
				<div className="event-image">{eventData.fields.carouselImages?.[0]?.image ? 
					<SmartImage src={eventData.fields.carouselImages[0].image} alt={eventData.fields.title} /> 
					: undefined}</div>
				<div className="event-description">{eventData?.fields?.description}</div>
				<div className="event-duration">Duration: {eventData?.fields?.duration} hours</div>
				<div className="event-schedule">Schedule: {eventData?.fields?.schedule}</div>
				<div className="event-seats">Seats Available: {eventData?.fields?.maxSeats}</div>
				<div className="event-price">Price: {toDollars.format(eventData?.fields?.price)}</div>
				{ (eventData?.fields?.status?.toLowerCase?.() === "open") ? 
					<FormButton
						id="add-to-cart-button"
						type="button"
						text="Add to Cart"
						className="pix-cart-button"
						onClick={() => {
							if (!eventData?.fields?.id || !eventData?.fields?.title) return;
							addToShoppingCart({
								itemID: eventData.fields.id,
								itemTitle: eventData.fields.title,
								itemCost: Number(eventData.fields.price) || 0,
								itemQuantity: 1,
								itemInventory: Number(eventData.fields.maxSeats) || 1,
								itemURL: `/events/${eventData.fields.id}`,
								itemCategory: [
									...(Array.isArray(eventData.fields.category)
										? eventData.fields.category
										: eventData.fields.category
											? [String(eventData.fields.category)]
											: []),
									'event',
								].filter(Boolean),
								itemImageURL: eventData.fields.carouselImages?.[0]?.image ?? undefined,
								itemIsShippable: eventData.fields.isShippable ?? false,
								itemWeight: typeof eventData.fields.weight === 'number' ? eventData.fields.weight : Number(eventData.fields.weight ?? 0),
								itemWeightUnit: eventData.fields.weightUnit || 'lb',
							});
							router.push('/cart');
						}}
					/>
					: "" }
			</PageSection>
			<br /><br />
		</>
	);
}

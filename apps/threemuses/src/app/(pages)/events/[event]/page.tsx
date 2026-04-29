 
"use client";

import React from "react";
import { use, useState, useEffect, useRef } from 'react';
import { getContentfulEntriesByType, getContentfulEntryByField, getContentfulImagesFromEntries, usePixelatedConfig, FormButton } from "@pixelated-tech/components";
import { SchemaEvent, buildEventSchema } from "@pixelated-tech/components";
import { Loading } from "@pixelated-tech/components";
import { PageTitleHeader,  PageSection, PageSectionHeader } from '@pixelated-tech/components';
import { useRouter } from 'next/navigation';

type EventCard = {
	fields: {
		id: string;
		title: string;
		description: string;
		keywords?: string;
		link?: string;
		carouselImages: any[];
		startDate: string;
		endDate: string;
		duration: number;
		maxSeats: number;
		price: number;
		status: string;
	};
};

export default function Event({params}: { params: Promise<{ event: string }> }){

	const config = usePixelatedConfig();
	const router = useRouter();

	if (!config) {
		return <Loading />;
	}

	const toDollars = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	});

	const apiProps = {
		base_url: config?.contentful?.base_url ?? "",
		space_id: config?.contentful?.space_id ?? "",
		environment: config?.contentful?.environment ?? "",
		delivery_access_token: config?.contentful?.delivery_access_token ?? "",
	};

	const [ eventData , setEventData ] = useState<EventCard | null>(null);
	const { event } = use(params);
  
	useEffect(() => {
		async function getEvent(event: string) {
			const contentType = "75OqioFABdZZ1QaQChRGic"; 
			const entries = await getContentfulEntriesByType({ apiProps: apiProps, contentType: contentType }); 
			const eventObj = await getContentfulEntryByField({
				cards: entries,
				searchField: "id",
				searchVal: event
			});
			if (!eventObj) {
				return;
			}
			setEventData(eventObj);
			const images = await getContentfulImagesFromEntries({ images: eventObj.fields.carouselImages ?? [], assets: entries.includes.Asset });
			setEventData({ ...eventObj, fields: { ...eventObj.fields, carouselImages: images } });
		}
		getEvent(event);
	}, [event]);

	const isMounted = useRef(false);
	useEffect(() => {
		isMounted.current = true;
		return () => {
			isMounted.current = false;
		};
	}, []);


	return (
		<>
			{ isMounted.current && eventData ? (
	      		<>
					<SchemaEvent event={buildEventSchema(eventData, config.siteInfo)} />
					<PageTitleHeader title={eventData?.fields.title + " - " + eventData?.fields.id || ""} />
					<PageSection columns={1} id="event-callout-section">
						<PageSectionHeader title={ new Date(eventData?.fields.startDate).toLocaleString() + " - " + new Date(eventData?.fields.endDate).toLocaleString() } />
						<div>{eventData?.fields?.description}</div>
						<div>Duration: {eventData?.fields?.duration} hours</div>
						<div>Seats Available: {eventData?.fields?.maxSeats}</div>
						<div>Price: {toDollars.format(eventData?.fields?.price)}</div>
						{ (eventData?.fields?.status?.toLowerCase?.() === "open") ? 
							<FormButton
								id="register-event-button"
								type="button"
								text="Register for this event"
								className="pix-cart-button"
								onClick={() => {
									if (!eventData?.fields?.id) return;
									router.push(`/register?event=${eventData.fields.id}`);
								}}
							/>
							: "" }
					</PageSection>
					<br /><br />
				</>
			) : (
				<PageSection columns={1} id="event-callout-section">
					<div>Loading event data...</div>
				</PageSection>
			)
			}
		</>
	);
}

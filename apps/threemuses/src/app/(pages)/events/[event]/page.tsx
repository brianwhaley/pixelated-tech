 
"use client";

import React from "react";
import { use, useState, useEffect, useRef } from 'react';
import { getContentfulEntriesByType, getContentfulEntryByField, getContentfulImagesFromEntries, usePixelatedConfig } from "@pixelated-tech/components";
import { Loading } from "@pixelated-tech/components";
import { PageSection } from '@pixelated-tech/components';
import EventDetail from "../../../elements/eventdetail";
import "./event-details.css";

const debug = false; 

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

	if (!config) {
		return <Loading />;
	}

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

			if (debug) console.log("Entries fetched: ", await entries);

			const eventObj = await getContentfulEntryByField({
				cards: entries,
				searchField: "id",
				searchVal: event
			});

			if (debug) console.log("Event object found: ", await eventObj);

			if (!eventObj) {
				return;
			}
			const contentfulImageRefs = eventObj.fields.carouselImages?.length
				? eventObj.fields.carouselImages
				: eventObj.fields.image
					? [eventObj.fields.image]
					: [];
			const images = await getContentfulImagesFromEntries({ images: contentfulImageRefs, assets: entries.includes.Asset });

			if (debug) console.log("Event images found: ", await images);

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
	      		<EventDetail eventData={eventData} config={config} />
			) : (
				<PageSection columns={1} id="event-callout-section">
					<div>Loading event data...</div>
				</PageSection>
			)
			}
		</>
	);
}

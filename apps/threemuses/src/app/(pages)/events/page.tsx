"use client";

import React, { useState, useEffect } from "react";
import { usePixelatedConfig, getContentfulEntriesByType, getContentfulImagesFromEntries } from "@pixelated-tech/components";
import { SchemaEvent, buildEventSchema } from "@pixelated-tech/components";
import { Callout } from "@pixelated-tech/components";
import type { CalloutType } from "@pixelated-tech/components";
import { Loading } from "@pixelated-tech/components";
import { PageTitleHeader, PageSection } from "@pixelated-tech/components";


export default function Events() {

	const [ events , setEvents ] = useState<CalloutType[]>([]);
	const [ eventSchemas, setEventSchemas ] = useState<any>(null);

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

	useEffect(() => {
		async function getCarouselCards() {
			const contentType = "event"; 
			const eventObjects: CalloutType[] = [];
			const events = await getContentfulEntriesByType({ apiProps: apiProps, contentType: contentType }); 
			const eventSchemasRaw: any[] = [];
			const sortedItems = [...events.items].sort((a: any, b: any) => {
				return new Date(a.fields.startDate).getTime() - new Date(b.fields.startDate).getTime();
			});
			for (const event of sortedItems) {
				if ( event.sys.contentType.sys.id == contentType ) {
					const images = await getContentfulImagesFromEntries({ images: [event.fields.image], assets: events.includes.Asset });
					eventObjects.push({
						variant: "grid",
						layout: "horizontal",
						img: images[0]?.image,
						imgAlt: event.fields.title,
						title: event.fields.title,
						subtitle: new Date(event.fields.startDate).toLocaleDateString() + " - " + new Date(event.fields.endDate).toLocaleDateString(),
						content: event.fields.description,
						url: "/events/" + event.fields.id,
						urlTarget: "_self",
						buttonText: "More Details"
					});
					eventSchemasRaw.push(buildEventSchema(event));
				}
			}

			setEvents(eventObjects);
			setEventSchemas(eventSchemasRaw.length > 0 ? { '@context': 'https://schema.org', '@graph': eventSchemasRaw } : null);
		}
		getCarouselCards();
	}, []);

	return (
		<>
			{eventSchemas && <SchemaEvent event={eventSchemas} />}
			<PageTitleHeader title="Events" />
			
			<PageSection columns={1} className="" id="projects-section">
				{ events.map((event, index) => (
					<Callout {...event} key={index} />
				))}
			</PageSection>
		</>
	);
}

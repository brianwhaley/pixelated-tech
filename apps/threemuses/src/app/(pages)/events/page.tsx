"use client";

import React, { useState, useEffect } from "react";
import { usePixelatedConfig, getContentfulEntriesByType, getContentfulImagesFromEntries } from "@pixelated-tech/components";
import { Loading } from "@pixelated-tech/components";
import { PageTitleHeader, PageSection } from "@pixelated-tech/components";
import EventCallout from "../../elements/eventcallout";

export default function EventsPage() {

	const [ events , setEvents ] = useState<{ event: any, calloutProps: any }[]>([]);

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
			const contentType = "75OqioFABdZZ1QaQChRGic"; 
			const eventObjects: { event: any, calloutProps: any }[] = [];
			const events = await getContentfulEntriesByType({ apiProps: apiProps, contentType });
			const sortedItems = [...events.items].sort((a: any, b: any) => {
				return new Date(a.fields.startDate).getTime() - new Date(b.fields.startDate).getTime();
			});
			for (const event of sortedItems) {
				if ( event.sys.contentType.sys.id == contentType ) {
					const status = event.fields.status?.toString?.().toLowerCase?.();
					if (status === 'archived') {
						continue;
					}
					const images = await getContentfulImagesFromEntries({ images: [event.fields.image], assets: events.includes.Asset });
					eventObjects.push({
						event: event,
						calloutProps: {
							variant: "grid",
							layout: "horizontal",
							img: images[0]?.image,
							imgAlt: event.fields.title,
							title: event.fields.title,
							subtitle: new Date(event.fields.startDate).toLocaleString('en-US', {
								dateStyle: 'short', timeStyle: 'short'
							}).replace(',', '') + " - " + new Date(event.fields.endDate).toLocaleString('en-US', {
								dateStyle: 'short', timeStyle: 'short'
							}).replace(',', ''),
							content: event.fields.description,
							url: "/events/" + event.fields.id,
							urlTarget: "_self",
							buttonText: "More Details"
						}
					});
				}
			}

			setEvents(eventObjects);
		}
		getCarouselCards();
	}, []);

	return (
		<>
			<PageTitleHeader title="Events" />
			
			<PageSection columns={1} className="" id="projects-section">
				{ events.map((eventObj, index) => (
					<EventCallout key={index} event={eventObj.event} calloutProps={eventObj.calloutProps} siteInfo={config.siteInfo} />
				))}
			</PageSection>
		</>
	);
}

"use client";

import React from "react";
import { SchemaEvent, buildEventSchema, Callout, type CalloutType } from "@pixelated-tech/components";

interface EventCalloutProps {
    event: any;
    calloutProps: CalloutType;
    siteInfo?: any;
}

export default function EventCallout({ event, calloutProps, siteInfo }: EventCalloutProps) {
	const eventSchema = buildEventSchema(event, siteInfo);
    
	return (
		<>
			{eventSchema && <SchemaEvent event={eventSchema} />}
			<Callout {...calloutProps} />
		</>
	);
}

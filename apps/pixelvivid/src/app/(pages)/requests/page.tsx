 
"use client";

import React, { useState, useEffect } from "react";
import { PageTitleHeader, getContentfulEntriesByType } from "@pixelated-tech/components";
import { HubspotTrackingCode /* , getHubspotFormSubmissions */ } from "@pixelated-tech/components";
import { FormEngine } from "@pixelated-tech/components";
import { Table } from "@pixelated-tech/components";
import { Loading, usePixelatedConfig } from "@pixelated-tech/components";
import formData from "@/app/data/requestform.json";
import "./requests.css";

export default function Requests() {
	const pixelatedConfig = usePixelatedConfig();

	if (!pixelatedConfig) {
		return <Loading />;
	}

	/* MANAGE CONTENTFUL CUSTOM REQUESTDATA FETCHING */

	type CustomRequestType = {
		name: string;
		source: string;
		description: string; 
		email?: string; // Optional property
		phone?: string; // Optional property
		status: string;
		requestDate: Date;
	};

	const [ customRequests , setCustomRequests ] = useState<CustomRequestType[]>([]);
	const apiProps = {
		base_url: pixelatedConfig?.contentful?.base_url || "",
		space_id: pixelatedConfig?.contentful?.space_id || "",
		environment: pixelatedConfig?.contentful?.environment || "",
		delivery_access_token: pixelatedConfig?.contentful?.delivery_access_token || "",
	};
	useEffect(() => {
		async function getCustomRequests() {
			const contentType = "customRequest"; 
			const customRequestEntries = await getContentfulEntriesByType({ apiProps: apiProps, contentType: contentType }); 
			const items = customRequestEntries.items.filter((card: any) => card.sys.contentType.sys.id === contentType);
			const entriesJSON = items.map(function (card: any) {
				return {
					name: card.fields.name,
					source: card.fields.source,
					description: card.fields.description,
					// email: card.fields.email,
					// phone: card.fields.phone,
					status: card.fields.status,
					requestDate: card.fields.requestDate,
				};
			});
			entriesJSON.sort(function (a: any, b: any) { return a.requestDate > b.requestDate ? 1 : -1; });
			setCustomRequests(entriesJSON);
		}
		getCustomRequests();
	}, []);


	/* RENDER THE COMPONENT */

	return (
		<>
			<section id="custom-request-section">
				<div className="section-container">
					<HubspotTrackingCode hubID={"243048355"} />
					<PageTitleHeader title="Request Your Custom Sunglasses" />
					<div className="new-request-form-wrapper">
						<FormEngine formData={formData} />
					</div>
					<br /><br />
				</div>
			</section>

			<section style={{backgroundColor: "var(--accent2-color)"}} id="request-list-section">
				<div className="section-container">
					<PageTitleHeader title="Custom Sunglass Request Work List" />
					{ customRequests.length > 0 ? (
						<Table data={customRequests} id="customRequests" sortable={true}/>
					) : (
						<p>No custom requests found.</p>
					)}
				</div>
			</section>
		</>
	);
}

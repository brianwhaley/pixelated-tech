 
"use client";

import React, { useState } from "react";
import { PageTitleHeader, PageSection, useFileData } from "@pixelated-tech/components";
import { Table } from "@pixelated-tech/components";
import "./prospects.css";

export default function Requests() {
	const { data: jsonData } = useFileData<any[]>('/data/prospects.json', 'json');
	const [prospectData, setProspectData] = useState<any[]>([]);

	// Transform the loaded JSON into table format
	React.useEffect(() => {
		if (jsonData) {
			const trimmedData: any[] = Array.isArray(jsonData)
				? jsonData.map((item: any, index: number) => ({
					"#": index + 1,
					company: String(item.company || ""),
					address: `${item["street address"] || ""} ${item.city || ""} ${item.state || ""} ${item.zip || ""}`.trim(),
					emails: item.emails.toString(),
					contact: `${item["first name"] || ""} ${item["last name"] || ""}`,
				}))
				: [];
			setProspectData(trimmedData);
		}
	}, [jsonData]); 


	return (
		<>
			
			<PageSection maxWidth="100%" columns={1} id="prospect-list-section">
				<div className="section-container">
					<PageTitleHeader title="Custom Sunglass Request Work List" />
					{ prospectData.length > 0 ? (
						<Table data={prospectData} id="customRequests" sortable={true}/>
					) : (
						<p>No custom requests found.</p>
					)}
				</div>
			</PageSection>
		</>
	);
}

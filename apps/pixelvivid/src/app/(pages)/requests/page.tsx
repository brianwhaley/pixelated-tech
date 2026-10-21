import React from "react";
import { HubspotTrackingCode } from "@pixelated-tech/components";
import { FormEngine } from "@pixelated-tech/components";
import { Table } from "@pixelated-tech/components";
import { PageTitleHeader, PageSectionHeader } from "@pixelated-tech/components";
import {
	DEFAULT_PIXELATED_FORM_SUBMISSIONS_TABLE,
	listPixelatedFormSubmissionReportRows,
} from "@pixelated-tech/components/server";
import formData from "@/app/data/requestform.json";
import "./requests.css";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type CustomRequestType = {
	name: string;
	source: string;
	description: string;
	status: string;
	requestDate: string;
};

export default async function Requests() {
	let customRequests: CustomRequestType[] = [];
	let requestLoadError = false;

	try {
		const rows = await listPixelatedFormSubmissionReportRows({
			tableName: DEFAULT_PIXELATED_FORM_SUBMISSIONS_TABLE,
			domain: "pixelvivid.com",
			formName: "custom-request",
		});

		customRequests = rows
			.filter((row) => {
				const status = String(row.Status ?? row.status ?? "").trim().toLowerCase();
				return status !== "submitted" && status !== "completed";
			})
			.map((row) => {
				const firstName = String(row.firstname ?? "").trim();
				const lastNameInitial = String(row.lastname ?? "").trim().charAt(0);
				const rawRequestDate = String(row.timestamp ?? row.created_at ?? "");
				const parsedRequestDate = new Date(rawRequestDate);
				const formattedRequestDate = Number.isNaN(parsedRequestDate.getTime())
					? rawRequestDate
					: `${parsedRequestDate.getUTCFullYear()}-${String(parsedRequestDate.getUTCMonth() + 1).padStart(2, "0")}-${String(parsedRequestDate.getUTCDate()).padStart(2, "0")}`;
				return {
					name: `${firstName}${lastNameInitial ? ` ${lastNameInitial}.` : ""}`.trim(),
					source: String(row.source ?? ""),
					description: String(row.message ?? ""),
					status: String(row.Status ?? row.status ?? ""),
					requestDate: formattedRequestDate,
				};
			});

		customRequests.sort((left, right) => left.requestDate.localeCompare(right.requestDate));
	} catch (error) {
		console.error("Unable to load custom requests:", error);
		requestLoadError = true;
	}

	return (
		<>
			<PageTitleHeader title="Custom Sunglass Requests" />
			<section id="custom-request-section">
				<div className="section-container">
					<HubspotTrackingCode />
					<PageSectionHeader title="Request Your Custom Sunglasses" />
					<div className="new-request-form-wrapper">
						<FormEngine formData={formData} />
					</div>
					<br /><br />
				</div>
			</section>

			<section style={{backgroundColor: "var(--accent2-color)"}} id="request-list-section">
				<div className="section-container">
					<PageSectionHeader title="Custom Sunglass Request Work List" />
					{ requestLoadError ? (
						<p>Unable to load custom requests.</p>
					) : customRequests.length > 0 ? (
						<Table data={customRequests} id="customRequests" sortable={true}/>
					) : (
						<p>No custom requests found.</p>
					)}
				</div>
			</section>
		</>
	);
}

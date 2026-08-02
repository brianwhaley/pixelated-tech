"use client";

import React, { useState } from "react";
import PropTypes, { InferProps } from "prop-types";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { FormEngine } from "@pixelated-tech/components";
import { PageSection, PageGridItem } from "@pixelated-tech/components";
import "./flooring-estimator.css";
import formData from "@/app/data/flooring-estimator.json";


const pricing = {
	"minimum": 1200.00,
	"epoxy_garage_floors": { 
		"solid": 4.00,
		"flake": 5.00,
		"metallic": 7.00,
		"matte": 8.00,
		"gloss": 8.00
	},
	"driveway_coating": 3.00,
	"paver_sealing": 2.00,
	"concrete_polishing": 6.00,
	"condition_multiplier": {
		"good-condition": 1.00,
		"moderate-wear": 1.15,
		"heavy-wear": 1.35,
		"old-coating": 1.50
	},
	"addons": {
		"stem-wall": 450.00,
		"moisture-barrier": 650.00,
		"uv-resistant": 850.00,
		"slip-resistant": 300.00
	}
};


export default function ContactPage() {
	const [estimate, setEstimate] = useState<any>(null);

	const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const form = event.currentTarget;
		const data = new FormData(form);

		const projectType = String(data.get("project-type") ?? "");
		const length = Math.max(0, Math.ceil(Number(data.get("length") ?? 0)));
		const width = Math.max(0, Math.ceil(Number(data.get("width") ?? 0)));
		const condition = String(data.get("flooring-condition") ?? "good-condition");
		const floorOptions = data.getAll("flooring-options").map((value) => String(value)).filter(Boolean);
		const addons = data.getAll("flooring-addons").map((value) => String(value)).filter(Boolean);

		const baseRate =
			projectType === "epoxy_garage_floors"
				? pricing.epoxy_garage_floors[floorOptions[0] ?? "solid"] ?? pricing.epoxy_garage_floors.solid
				: typeof (pricing as any)[projectType] === "number"
					? (pricing as any)[projectType]
					: 0;

		const multiplier = pricing.condition_multiplier[condition as keyof typeof pricing.condition_multiplier] ?? 1.0;

		const area = length * width;
		const subtotal = area * baseRate * multiplier;
		const addonCost = addons.reduce((sum, addon) => {
			return sum + ((pricing.addons as any)[addon] ?? 0);
		}, 0);

		const total = Math.max(pricing.minimum, subtotal + addonCost);

		setEstimate({
			projectType,
			length,
			width,
			condition,
			floorOptions,
			addons,
			baseRate,
			multiplier,
			area,
			subtotal,
			addonCost,
			total,
		});
	};

	return (
		<>
			<CalloutLibrary.PageTitle title="Palmetto Epoxy Flooring Estimator" />
			<PageSection columns={1} className="" maxWidth="1024px" id="floor-estimator-section">
				<PageGridItem>
					<div>
						Please fill out the form below. 
						We would LOVE to answer any questions or to setup 
						an appointment to talk about our favorite subject… 
						Epoxy Flooring! 
						<br /><br />
					</div>
					<FormEngine formData={formData} 
						onSubmitHandler={handleFormSubmit} />
					{estimate ? <FlooringEstimate estimate={estimate} /> : null}
				</PageGridItem>
				{ /* <PageGridItem>
					<iframe src={`https://calendar.google.com/calendar/embed?src=${calendarID}&mode=WEEK`} style={{ border: 0 }} width="100%" height="600px" frameBorder="0" scrolling="no"></iframe>
				</PageGridItem> */ }
			</PageSection>
		</>
	);
}

/**
 * FlooringEstimate — Component to display the flooring estimate.
 * 
 * @param {FlooringEstimateType} props
 * @param {FlooringEstimateType['estimate']} props.estimate
 * @returns {JSX.Element}
 */
FlooringEstimate.propTypes = {
	estimate: PropTypes.object,
};
export type FlooringEstimateType = InferProps<typeof FlooringEstimate.propTypes>;
export function FlooringEstimate({ estimate }: FlooringEstimateType) {
	return (
		<>
			<br /><hr /><br />
			<div>
				<h2>Flooring Estimate</h2>
				<ul>
					<li>Project Type: {estimate.projectType}</li>
					<li>Area: {estimate.area} sq ft ({estimate.length} ft × {estimate.width} ft)</li>
					<li>Condition: {estimate.condition}</li>
					{ /*<li>Rate: ${estimate.baseRate.toFixed(2)} / sq ft</li> */}
					{ /*<li>Multiplier: {estimate.multiplier.toFixed(2)}</li> */ }
					<li>Floor Options: {estimate.floorOptions.length > 0 ? estimate.floorOptions.join(", ") : "None"}</li>
					<li>Add-Ons: {estimate.addons.length > 0 ? estimate.addons.join(", ") : "None"}</li>
					{ /*<li>Add-On Cost: ${estimate.addonCost.toFixed(2)}</li> */}
					{ /*<li>Subtotal: ${estimate.subtotal.toFixed(2)}</li> */ }
					<li><strong>Total: ${estimate.total.toFixed(2)}</strong></li>
				</ul>
			</div>
		</>
	);
}
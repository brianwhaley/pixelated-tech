"use client";

import React, { useState } from "react";
import PropTypes, { InferProps } from "prop-types";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { emailFormData, FormEngine } from "@pixelated-tech/components";
import { Loading, ToggleLoading } from "@pixelated-tech/components";
import { PageSection, PageGridItem } from "@pixelated-tech/components";
import "./flooring-estimator.css";
import formData from "@/app/data/flooring-estimator.json";


const pricing = {
	"minimum": 1200.00,
	"epoxy_garage_floors": { 
		"solid": 5.00,
		"flake": 7.50,
		"metallic": 8.50
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
		"stem-wall": {"type": "flat-fee", "amount": 450.00},
		"moisture-barrier": {"type": "sqft", "amount": 2.00},
		"uv-resistant": {"type": "sqft", "amount": 2.50},
		"slip-resistant": {"type": "sqft", "amount": 1.00},
		"additional-topcoat": {"type": "sqft", "amount": 3.50 }
	}
};


export default function ContactPage() {
	const [estimate, setEstimate] = useState<FlooringEstimateType["estimate"] | null>(null);

	const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		ToggleLoading({ show: true });
		const form = event.currentTarget;
		const data = new FormData(form);

		const projectType = String(data.get("project-type") ?? "");
		const length = Math.max(0, Math.ceil(Number(data.get("length") ?? 0)));
		const width = Math.max(0, Math.ceil(Number(data.get("width") ?? 0)));
		const condition = String(data.get("flooring-condition") ?? "good-condition");
		const floorOptions = data.getAll("flooring-options").map((value) => String(value)).filter(Boolean);
		const flooringFinishes = data.getAll("flooring-finishes").map((value) => String(value)).filter(Boolean);
		const addons = data.getAll("flooring-addons").map((value) => String(value)).filter(Boolean);

		const selectedFloorOption = (floorOptions[0] ?? "solid") as keyof typeof pricing.epoxy_garage_floors;
		const baseRate =
			projectType === "epoxy_garage_floors"
				? pricing.epoxy_garage_floors[selectedFloorOption] ?? pricing.epoxy_garage_floors.solid
				: typeof (pricing as any)[projectType] === "number"
					? (pricing as any)[projectType]
					: 0;

		const multiplier = pricing.condition_multiplier[condition as keyof typeof pricing.condition_multiplier] ?? 1.0;

		const area = length * width;
		const subtotal = area * baseRate * multiplier;
		const addonCost = addons.reduce((sum, addon) => {
			const addonConfig = (pricing.addons as Record<string, { type: string; amount: number }>)[addon];
			if (!addonConfig) {
				return sum;
			}
			return sum + (addonConfig.type === "sqft" ? addonConfig.amount * area : addonConfig.amount);
		}, 0);

		const total = Math.max(pricing.minimum, subtotal + addonCost);
		const totalValue = total.toFixed(2);

		const totalField = form.querySelector<HTMLInputElement>('input[name="total"]');
		if (totalField) { totalField.value = totalValue; }

		const estimateResult = {
			projectType,
			length,
			width,
			condition,
			floorOptions,
			flooringFinishes,
			addons,
			baseRate,
			multiplier,
			area,
			subtotal,
			addonCost,
			total,
		};

		const nativeEvent = event.nativeEvent as unknown as Event;
		const emailResult = await emailFormData(nativeEvent);
		if (!emailResult.success) {
			console.error('Flooring estimator email submission failed', emailResult.error);
		}

		setEstimate(estimateResult);
		ToggleLoading({ show: false });
	};

	return (
		<>
			<CalloutLibrary.PageTitle title="Palmetto Epoxy Flooring Estimator" />
			<PageSection columns={1} className="" maxWidth="1024px" id="floor-estimator-section">
				<PageGridItem>
					<div>
						<p>Please fill out the form below to receive a rough estimate for a Palmetto Epoxy flooring treatment. </p>
						<p><strong>Please Note:</strong> This calculation provides a <strong>rough, preliminary estimate</strong> based on the information you provide. Every concrete slab is unique, so a Palmetto Epoxy representative will contact you shortly to schedule an on-site visit. Final pricing is confirmed in person after evaluating surface conditions to guarantee a lifetime bond.</p>
					</div>
					<FormEngine formData={formData} 
						onSubmitHandler={handleFormSubmit} />
					{estimate ? <FlooringEstimate estimate={estimate} /> : null}
					<br />
					<p><strong>Please Note:</strong> This calculation provides a rough, preliminary estimate based on your inputs. Every concrete slab is unique, so a Palmetto Epoxy representative will contact you shortly to schedule an on-site visit. Final pricing is confirmed in person after evaluating surface conditions to guarantee a lifetime bond.</p>
				</PageGridItem>
				{ /* <PageGridItem>
					<iframe src={`https://calendar.google.com/calendar/embed?src=${calendarID}&mode=WEEK`} style={{ border: 0 }} width="100%" height="600px" frameBorder="0" scrolling="no"></iframe>
				</PageGridItem> */ }
			</PageSection>
			<Loading />
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
	estimate: PropTypes.shape({
		projectType: PropTypes.string.isRequired,
		length: PropTypes.number.isRequired,
		width: PropTypes.number.isRequired,
		condition: PropTypes.string.isRequired,
		floorOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
		flooringFinishes: PropTypes.arrayOf(PropTypes.string).isRequired,
		addons: PropTypes.arrayOf(PropTypes.string).isRequired,
		baseRate: PropTypes.number.isRequired,
		multiplier: PropTypes.number.isRequired,
		area: PropTypes.number.isRequired,
		subtotal: PropTypes.number.isRequired,
		addonCost: PropTypes.number.isRequired,
		total: PropTypes.number.isRequired,
	}).isRequired,
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
					<li>Flooring Finishes: {estimate.flooringFinishes?.length > 0 ? estimate.flooringFinishes.join(", ") : "None"}</li>
					<li>Add-Ons: {estimate.addons.length > 0 ? estimate.addons.join(", ") : "None"}</li>
					{ /*<li>Add-On Cost: ${estimate.addonCost.toFixed(2)}</li> */}
					{ /*<li>Subtotal: ${estimate.subtotal.toFixed(2)}</li> */ }
					<li><strong>Total: ${estimate.total.toFixed(2)}</strong></li>
				</ul>
			</div>
		</>
	);
}

"use client";

import React, { useEffect } from "react";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { FormEngine } from "@pixelated-tech/components";
import formData from "@/app/data/submitreviewform.json";
import { PageSection } from "@pixelated-tech/components";

export default function SubmitReview() {

	useEffect(() => {
		const form = document.getElementById("submitReviewForm") as HTMLFormElement;
		if (form) {
			const installdate = form.querySelector('input#installdate[type="date"]') as HTMLInputElement;
			const submitbutton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
			const submitDiv = submitbutton.parentElement as HTMLDivElement;
			if(submitDiv) {
				submitDiv.style.textAlign = "center";
				submitDiv.style.margin = "20px auto";
			}
			if (installdate) {
				installdate.valueAsDate = new Date();
				installdate.dispatchEvent(new Event('change'));
			}
		}

	}, []);

	return (
		<>
			<CalloutLibrary.PageTitle title="Submit your Review" />
			<PageSection columns={1} className="" id="submitreview-section"> 
				<h2 className="centered">
					Share your experience with Palmetto Epoxy!<br />
					We value your feedback and <br />
					want to hear about your epoxy flooring project.  
					<br /><br /><br />
				</h2>
				<FormEngine formData={formData} />
			</PageSection>
		</>
	);
}

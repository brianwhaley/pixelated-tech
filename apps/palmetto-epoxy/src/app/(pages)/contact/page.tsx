"use client";

import React from "react";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { FacebookPixel, FormEngine, FormSubmitWrapper, getFacebookAttributionData } from "@pixelated-tech/components";
import { PageSection, PageGridItem } from "@pixelated-tech/components";

import formData from "@/app/data/contactform.json";

// const calendarID = "1b783753ce78e200e6e505694b0610c48c8b5ca756f4d71986c4f7de97caaa13%40group.calendar.google.com";

const trackLead = () => {
	if (typeof window === "undefined") return;
	const fbq = (window as Window & {
		fbq?: (...args: unknown[]) => void;
	}).fbq;
	if (typeof fbq !== "function") return;
	const attributionData = getFacebookAttributionData();
	fbq("trackCustom", "ContactSubmit", attributionData);
	fbq("track", "Lead", attributionData);
};

export default function ContactPage() {
	return (
		<>
			<FacebookPixel pixelId="2272268106901362" />
			<CalloutLibrary.PageTitle title="Contact Us" />
			<PageSection columns={1} className="" maxWidth="768px" id="contactus-section">
				<PageGridItem>
					<div>
						Please fill out the form below. 
						We would LOVE to answer any questions or to setup 
						an appointment to talk about our favorite subject… 
						Epoxy Flooring! 
						<br /><br /><br /><br />
					</div>
					<FormSubmitWrapper onSuccess={trackLead}>
						<FormEngine formData={formData} onSubmitHandler={() => undefined} />
					</FormSubmitWrapper>
				</PageGridItem>
				{ /* <PageGridItem>
					<iframe src={`https://calendar.google.com/calendar/embed?src=${calendarID}&mode=WEEK`} style={{ border: 0 }} width="100%" height="600px" frameBorder="0" scrolling="no"></iframe>
				</PageGridItem> */ }
			</PageSection>
		</>
	);
}

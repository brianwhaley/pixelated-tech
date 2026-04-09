"use client";

import React from "react";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { FormEngine } from "@pixelated-tech/components";
import { PageSection, PageGridItem } from "@pixelated-tech/components";

import formData from "@/app/data/contactform.json";

const calendarID = "1b783753ce78e200e6e505694b0610c48c8b5ca756f4d71986c4f7de97caaa13%40group.calendar.google.com";

export default function Contact() {
	
	return (
		<>
			<CalloutLibrary.PageTitle title="Contact Us" />
			<PageSection columns={2} className="" id="contactus-section">
				<PageGridItem>
					<div>
						Please fill out the form below. 
						We would LOVE to answer any questions or to setup 
						an appointment to talk about our favorite subject… 
						Epoxy Flooring! 
						<br /><br /><br /><br />
					</div>
					<FormEngine formData={formData} />
				</PageGridItem>
				<PageGridItem>
					<iframe src={`https://calendar.google.com/calendar/embed?src=${calendarID}&mode=WEEK`} style={{ border: 0 }} width="100%" height="600px" frameBorder="0" scrolling="no"></iframe>
				</PageGridItem>
			</PageSection>
		</>
	);
}

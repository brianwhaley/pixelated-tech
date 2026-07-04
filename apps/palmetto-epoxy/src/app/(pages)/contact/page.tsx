"use client";

import React from "react";
import Script from "next/script";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { FormEngine } from "@pixelated-tech/components";
import { PageSection, PageGridItem } from "@pixelated-tech/components";
import { SmartImage } from "@pixelated-tech/components";

import formData from "@/app/data/contactform.json";

// const calendarID = "1b783753ce78e200e6e505694b0610c48c8b5ca756f4d71986c4f7de97caaa13%40group.calendar.google.com";

export default function ContactPage() {
	
	return (
		<>
			<Script id="facebook-pixel" strategy="afterInteractive">{`
				!function(f,b,e,v,n,t,s)
				{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
				n.callMethod.apply(n,arguments):n.queue.push(arguments)};
				if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
				n.queue=[];t=b.createElement(e);t.async=!0;
				t.src=v;s=b.getElementsByTagName(e)[0];
				s.parentNode.insertBefore(t,s)}(window, document,'script',
				'https://connect.facebook.net/en_US/fbevents.js');
				fbq('init', '2272268106901362');
				fbq('track', 'PageView');
				fbq('track', 'Schedule');
			`}</Script>
			<noscript>
				<SmartImage height={1} width={1} style={{ display: "none" }}
					 src="https://www.facebook.com/tr?id=2272268106901362&ev=PageView&noscript=1"
					 alt=""
				/>
			</noscript>

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
					<FormEngine formData={formData} />
				</PageGridItem>
				{ /* <PageGridItem>
					<iframe src={`https://calendar.google.com/calendar/embed?src=${calendarID}&mode=WEEK`} style={{ border: 0 }} width="100%" height="600px" frameBorder="0" scrolling="no"></iframe>
				</PageGridItem> */ }
			</PageSection>
		</>
	);
}

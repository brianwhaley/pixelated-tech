"use client";

import React from "react";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { PageSection, PageGridItem } from "@pixelated-tech/components";
import { Callout } from "@pixelated-tech/components";


export default function CommercialService() {	
	return (
		<>
			<CalloutLibrary.PageTitle title="Palmetto Epoxy - Service Areas" />

			<PageSection columns={2} className="" id="primary-services-section">
				
				<PageGridItem>

					<Callout
						title='Beaufort, SC'
						url="/service-areas/beaufort-sc"
						content=''
						layout='vertical' 
						imgShape='squircle' 
					/>

				</PageGridItem>
				<PageGridItem>

					<Callout
						title='Bluffton, SC'
						url="/service-areas/bluffton-sc"
						content=''
						layout='vertical' 
						imgShape='squircle' 
					/>
					
				</PageGridItem>
				<PageGridItem>

					<Callout
						title='Hardeeville, SC'
						url="/service-areas/hardeeville-sc"
						content=''
						layout='vertical' 
						imgShape='squircle' 
					/>
					
				</PageGridItem>
				<PageGridItem>

					<Callout
						title='Hilton Head, SC'
						url="/service-areas/hilton-head-sc"
						content=''
						layout='vertical' 
						imgShape='squircle' 
					/>
					
				</PageGridItem>
				<PageGridItem>

					<Callout
						title='Okatie, SC'
						url="/service-areas/okatie-sc"
						content=''
						layout='vertical' 
						imgShape='squircle' 
					/>
					
				</PageGridItem>
				<PageGridItem>

					<Callout
						title='Ridgeland, SC'
						url="/service-areas/ridgeland-sc"
						content=''
						layout='vertical' 
						imgShape='squircle' 
					/>

				</PageGridItem>
				
			</PageSection>

			<section className="section-bluechip" id="contact-section">
				<CalloutLibrary.ContactCTA />
			</section>
		</>
	);
}

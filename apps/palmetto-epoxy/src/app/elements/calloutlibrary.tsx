"use client";

import React from "react";
import PropTypes, { InferProps } from "prop-types";
import { Callout, SmartImage } from "@pixelated-tech/components";
import { PageSection, PageGridItem, PageTitleHeader } from "@pixelated-tech/components";



/**
 * PageTitle - Page title section with outlined text
 * @param title - The title text to display
 */
PageTitle.propTypes = {
	title: PropTypes.string.isRequired,
};
export type PageTitleType = InferProps<typeof PageTitle.propTypes>;
export function PageTitle({title}: PageTitleType ) {
	return (
		<>
			<br />
			<section className="section-bwchip text-outline" id="page-title-section">
				<PageTitleHeader title={title} />
			</section>
		</>
	);
}


/**
 * ContactCTA - Call to action section for contacting
 * @param none
 */
ContactCTA.propTypes = {};
export type ContactCTAType = InferProps<typeof ContactCTA.propTypes>;
export function ContactCTA() {
	return (
		<div className="section-container">
			<div className="contact-cta">
				<div className="text-outline">
                    Discover the transformative power of epoxy flooring
					<br />
                    Where durability meets modern elegance
					<br />
					<button type="button" onClick={() => { window.location.href = '/contact'; }}>CONTACT US</button>
				</div>
			</div>
		</div>
	);
}


/**
 * All Partners - Callout for All Partners
 * @param none
 */
AllPartners.propTypes = {};
export type AllPartnersType = InferProps<typeof AllPartners.propTypes>;
export function AllPartners() {
	return (
		<>
			<PageSection columns={4} id="patch-section">
				<PageGridItem>
					<div style={{margin: '0 auto'}}>
						<LowCountrysBestSm />
					</div>
				</PageGridItem>

				<PageGridItem>
					<div style={{margin: '0 auto'}}>
						<Patch />
					</div>
				</PageGridItem>

				<PageGridItem>
					<div style={{margin: '0 auto'}}>
						<BestOfSouthCarolina />
					</div>
				</PageGridItem>

				<PageGridItem>
					<div style={{margin: '0 auto'}}>
						<SourceSC />
					</div>
				</PageGridItem>

			</PageSection>

			
		</>
	);
}





/**
 * LowCountrysBest - Callout for Lowcountrys Best award
 * @param none
 */
LowCountrysBest.propTypes = {};
export type LowCountrysBestType = InferProps<typeof LowCountrysBest.propTypes>;
export function LowCountrysBest() {
	return (
		<div className="section-container">
			<div className="row-12col ">
				<div className="grid-s2-e12">
					<Callout
						variant='boxed grid'
						url='https://www.votedlowcountrysbest.com/listing/palmetto-epoxy.html'
						title="Lowcountrys Best 2025"
						img='/images/logos/lowcountrysbest-logo.jpg'
						imgAlt="Lowcountrys Best 2025 Carpet & Flooring Store Silver Winner" 
						content='The Island Packet and The Beaufort Gazette created Lowcountrys Best 
								to honor the people, places, and businesses that capture what makes the 
								Lowcountry such a treasured place to live, work, and visit. 
								Congratulations to all the 2025 winners — and thank you to everyone 
								who voted. Together, youve helped showcase the very best of 
								Hilton Head and the Lowcountry, a region that continues to inspire, 
								welcome, and shine.'
						layout='horizontal' 
						imgShape='square' />
				</div>
			</div>
		</div>
	);
}


/**
 * LowCountrysBest - Callout for Lowcountrys Best award
 * @param none
 */
LowCountrysBestSm.propTypes = {
	/* No props for this component */
};
export type LowCountrysBestSmType = InferProps<typeof LowCountrysBestSm.propTypes>;
export function LowCountrysBestSm() {
	return (
		<>
			<a href="https://www.votedlowcountrysbest.com/listing/palmetto-epoxy.html">
				<SmartImage src="/images/logos/lowcountrysbest-logo.jpg" alt="Lowcountrys Best 2025 Carpet & Flooring Store Silver Winner" />
			</a>
		</>
	);
}


/**
 * Patch - Callout for Patch badge
 * @param none
 */
Patch.propTypes = {};
export type PatchType = InferProps<typeof Patch.propTypes>;
export function Patch() {
	return (
		<a href="https://patch.com/south-carolina/bluffton-sc/business/listing/572595/palmetto-epoxy?utm_source=badge&utm_medium=referral&utm_campaign=business_badge">
			<SmartImage src="https://patch.com/api_v1/bizpost/572595/badge" alt="Palmetto Epoxy on Patch" />
		</a>
	);
}


/**
 * Best of South Carolina - Callout for Best of South Carolina badge
 * @param none
 */
BestOfSouthCarolina.propTypes = {};
export type BestOfSouthCarolinaType = InferProps<typeof BestOfSouthCarolina.propTypes>;
export function BestOfSouthCarolina() {
	return (
		<a href="https://guidetosouthcarolina.com/bluffton/ga-contractors/palmetto-epoxy?from=badge"  title="Find me on Guide to South Carolina" target="_blank">
			<SmartImage src="https://guidetosouthcarolina.com/images/BOSC-Medallion-NOMINEE-RGBforWeb-0908.png" alt="Palmetto Epoxy on Guide to South Carolina" />
		</a>
	);
}


/**
 * Best of South Carolina - Callout for Best of South Carolina badge
 * @param none
 */
SourceSC.propTypes = {};
export type SourceSCType = InferProps<typeof SourceSC.propTypes>;
export function SourceSC() {
	return (
		<a href=""  title="Find me on SourceSC" target="_blank">
			<SmartImage src="https://scbizdev.sccommerce.com/sites/default/files/2020-03/SCDOC_SourceSC_Logo_OLs_2.png" alt="Palmetto Epoxy on SourceSC" />
		</a>
	);
}

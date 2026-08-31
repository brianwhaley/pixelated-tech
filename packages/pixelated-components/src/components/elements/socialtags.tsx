"use client";

import React from "react";
import PropTypes, { InferProps } from "prop-types";
import type { SiteInfo } from "../config/config.types";
import { PageSection, PageGridItem, PageFlexItem, PageSectionHeader } from "../structure/page-blocks";
import { Callout } from "../structure/callout";
import { usePixelatedConfig } from "../config/config.client";
import "./socialtags.css";


function getMyLogo(url: string): string {
	const domainBits = new URL(url).hostname.split('.');
	let domain = (domainBits.length <= 2) ? domainBits[0] :
		(domainBits.length > 2) ? domainBits.slice(1, -1).join('.') : domainBits.join('.');
	domain = domain.charAt(0).toUpperCase() + domain.slice(1).toLowerCase();
	const myLogo = `https://www.pixelated.tech/images/logos/${domain.toLowerCase()}-logo.png`;
	return myLogo;
}

/**
 * SocialTags
 * Generates Callouts
 * @param props
 * @returns {JSX.Element}
 */
SocialTags.propTypes = {
	columns: PropTypes.number,
	title: PropTypes.string,
};
export type SocialTagsType = InferProps<typeof SocialTags.propTypes>;
export function SocialTags(props: SocialTagsType) {
	const siteInfo = usePixelatedConfig()?.siteInfo as SiteInfo | null;
	const socials = siteInfo?.socialProfiles ?? [];
	const columns = props.columns ?? (socials.length < 12 ? socials.length : Math.min(Math.ceil(socials.length / 2), 12));
	const sectionTitle = props.title ?? `Follow ${siteInfo?.name ?? ''} on Social Media`;

	return (
		<>
			<PageSectionHeader url="" title={sectionTitle} />
			<PageSection id="socialtag-section" columns={columns} padding={"0px"}>
				{ socials.map((social: NonNullable<SiteInfo['socialProfiles']>[number]) => (
					<PageGridItem key={social.name}>
						<Callout variant="full" imgShape="squircle" layout="vertical" 
							url={social.url} 
							img={social.img || getMyLogo(social.url)} 
							imgAlt={social.name} />
					</PageGridItem>
				))}
			</PageSection>
        
		</>
	);
}


/**
 * PartnerTags
 * Generates Callouts
 * @param props
 * @returns {JSX.Element}
 */
PartnerTags.propTypes = {
	columns: PropTypes.number,
	title: PropTypes.string,
};
export type PartnerTagsType = InferProps<typeof PartnerTags.propTypes>;
export function PartnerTags(props: PartnerTagsType) {
	const siteInfo = usePixelatedConfig()?.siteInfo as SiteInfo | null;
	const partners = siteInfo?.partners ?? [];
	const columns = props.columns ?? (partners.length < 12 ? partners.length : Math.min(Math.ceil(partners.length / 2), 12));
	const sectionTitle = props.title ?? `${siteInfo?.name ?? ''} Partners`;
	return (
		<>
			<PageSectionHeader url="" title={sectionTitle} />
			<PageSection id="partnertag-section" columns={columns} padding={"0px"}>
				{ partners.map((partner: NonNullable<SiteInfo['partners']>[number], index: number) => {
					if (!partner.url) return null;
					return (
						<PageGridItem key={index}>
							<PartnersBadge 
								company={siteInfo?.name || ''} 
								name={partner.name} 
								url={partner.url} 
								img={partner.img  || getMyLogo(partner.url)} 
							/>
						</PageGridItem>
					);
				})}
			</PageSection>
        
		</>
	);
}


function PartnersBadge({ company, name, url, img }: { company: string; name: string; url: string; img: string; }) {
	const myimg = (img) ? img : getMyLogo(url);
	return (
		<PageFlexItem>
			<Callout variant="full" imgShape="squircle" layout="vertical" 
				url={url} img={myimg} imgAlt={`${company} on ${name}`} content={name} />
		</PageFlexItem>
	);
}

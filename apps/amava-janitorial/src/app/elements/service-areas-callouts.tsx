"use client";

import React from "react";
import PropTypes, { InferProps } from "prop-types";
import { usePixelatedConfig } from "@pixelated-tech/components";
import { PageSection } from "@pixelated-tech/components";
import { Callout } from "@pixelated-tech/components";

/**
 * ServiceAreasCallout component for the AMAVA Janitorial Services website.
 * This component renders a callout section highlighting the service areas with a static image and alt text.
 * @param no props
 * @returns {JSX.Element} 
 */
ServiceAreasCallout.propTypes = PropTypes.exact({});
export type ServiceAreasCalloutType = InferProps<typeof ServiceAreasCallout.propTypes>
export function ServiceAreasCallout() {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	return (
		<>
			<PageSection columns={1} maxWidth="768px" id="service-areas-callout-section" >
				<Callout
					variant="boxed grid"
					boxShape="square"
					gridColumns={{left: 1, right: 2}}
					layout="horizontal"
					title={`View ${siteInfo?.name} Service Areas`}
					content={`Check out the ${siteInfo?.name} Service Areas page to see the regions we serve and the local expertise we offer.`}
					img="/images/stock/service-areas.jpg"
					imgAlt={`View ${siteInfo?.name} Service Areas`}
					imgShape="square"
					url="/service-areas"
				/>
			</PageSection>
		</>
	);
}


/**
 * ServiceAreasCallout component for the AMAVA Janitorial Services website.
 * This component renders a callout section highlighting the service areas with a static image and alt text.
 * @param no props
 * @returns {JSX.Element} 
 */
ContactUsCallout.propTypes = PropTypes.exact({});
export type ContactUsCalloutType = InferProps<typeof ContactUsCallout.propTypes>
export function ContactUsCallout() {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	return (
		<>
			<PageSection columns={1} maxWidth="768px" id="contact-us-callout-section" >
				<Callout
					variant="boxed grid"
					boxShape="square"
					gridColumns={{left: 4, right: 1}}
					layout="horizontal"
					direction="right"
					subtitle={`Contact ${siteInfo?.name}`}
					content={`Get in touch with ${siteInfo?.name} to learn more about our services, service areas, and how we can support your needs in your area. We are committed to providing excellent service and local expertise wherever you are.`}
					img="/images/stock/contact-us.jpg"
					imgAlt={`Contact ${siteInfo?.name}`}
					imgShape="square"
					url="/contact"
				/>
			</PageSection>
		</>
	);
}

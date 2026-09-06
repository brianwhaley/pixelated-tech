"use client";

import React from "react";
import PropTypes, { InferProps } from "prop-types";
import { usePixelatedConfig } from "@pixelated-tech/components";
import { PageSection } from "@pixelated-tech/components";
import { Callout } from "@pixelated-tech/components";



/**
 * ServicesCallout component for the AMAVA Janitorial Services website.
 * This component renders a callout section highlighting the services with a static image and alt text.
 * @param no props
 * @returns {JSX.Element} 
 */
ServicesCallout.propTypes = PropTypes.exact({});
export type ServicesCalloutType = InferProps<typeof ServicesCallout.propTypes>
export function ServicesCallout() {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo;
	return (
		<>
			<PageSection columns={1} maxWidth="768px" id="service-areas-callout-section" >
				<Callout
					variant="boxed grid"
					boxShape="square"
					gridColumns={{left: 1, right: 4}}
					layout="horizontal"
					title={`View ${siteInfo?.name} Services`}
					content={`Check out the ${siteInfo?.name} Services page to see the individual services and the local expertise we provide.`}
					img="https://images.ctfassets.net/syybqad2lwuh/aUMNZi8ug3BuiM2TZer8p/14d08a9d085c9fd992004ab9d323835e/professional-cleaning.jpg?fm=webp"
					imgAlt={`View ${siteInfo?.name} Services`}
					imgShape="square"
					url="/services"
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
					gridColumns={{left: 1, right: 4}}
					layout="horizontal"
					title={`View ${siteInfo?.name} Service Areas`}
					content={`Check out the ${siteInfo?.name} Service Areas page to see the regions we serve and the local expertise we offer.`}
					img="https://images.ctfassets.net/syybqad2lwuh/3D1jQAv9fhUxLSD3f8xNPp/e022b18c51ca19aac0e99cd367f33ebb/service-areas.jpg?fm=webp"
					imgAlt={`View ${siteInfo?.name} Service Areas`}
					imgShape="square"
					url="/service-areas"
				/>
			</PageSection>
		</>
	);
}


/**
 * ContactUsCallout component for the AMAVA Janitorial Services website.
 * This component renders a callout section highlighting the contact information with a static image and alt text.
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
					title={`Contact ${siteInfo?.name}`}
					content={`Get in touch with ${siteInfo?.name} to learn more about our services, service areas, and how we can support your needs in your area. We are committed to providing excellent service and local expertise wherever you are.`}
					img="https://images.ctfassets.net/syybqad2lwuh/6bl0HVrpcM2moesz8Onrca/2ddc5e6559c1ad5cc1dcc7ef1ed4c0c1/contact-us.jpg?fm=webp"
					imgAlt={`Contact ${siteInfo?.name}`}
					imgShape="square"
					url="/contact"
				/>
			</PageSection>
		</>
	);
}

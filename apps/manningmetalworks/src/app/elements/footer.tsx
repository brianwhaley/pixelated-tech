"use client";

import React from "react";
import { PageSection } from "@pixelated-tech/components";
import { GoogleAnalytics } from "@pixelated-tech/components";
import { PixelatedFooter } from "@pixelated-tech/components";
import SocialTags from "./socialtags";
import routes from "@/app/data/routes.json";
const siteInfo = (routes as any).siteInfo;

export default function Footer() {
	return (
		<>

			<PageSection maxWidth="1024px" id="service-area-section" columns={1}>

				<hr style={{ margin: "0 auto", width: "80%" }} />

				<div className="row-3col">
					<div className="grid-item" style={{ textAlign: 'center' }}>
						<div>Manning Metalworks</div>
						<div><a href={`https://maps.app.goo.gl/${siteInfo.address.mapLink}`} target="_blank" rel="noopener noreferrer">{siteInfo.address.streetAddress}</a></div>
						<div><a href={`https://maps.app.goo.gl/${siteInfo.address.mapLink}`} target="_blank" rel="noopener noreferrer">{siteInfo.address.addressLocality}, {siteInfo.address.addressRegion} {siteInfo.address.postalCode}</a></div>
						<h3>Contact Us</h3>
						<div>Phone: <a href={`tel:${siteInfo.telephone}`}>{siteInfo.telephone}</a></div>
						<div>Email: <a href={`mailto:${siteInfo.email}`}>{siteInfo.email}</a></div>
					</div>

					<div className="grid-item">
						<iframe 
							src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3019.2655539467346!2d-74.48592712343745!3d40.82213043086534!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c3a77a1391a7eb%3A0x84423482ec54bf0f!2sManning%20Metalworks%20LLC!5e0!3m2!1sen!2sus!4v1774720673224!5m2!1sen!2sus" 
							width="100%" 
							height="300" 
							style={{ border: 0 }} 
							allowFullScreen
							loading="lazy" 
							referrerPolicy="no-referrer-when-downgrade">
						</iframe>
					</div>

					<div className="grid-item"  style={{ textAlign: 'center' }}>
						<h3>Hours</h3>
						<div>Mon: 9AM - 5PM</div>
						<div>Tue: 9AM - 5PM</div>
						<div>Wed: 9AM - 5PM</div>
						<div>Thu: 9AM - 5PM</div>
						<div>Fri: 9AM - 5PM</div>
						<div>Sat: CLOSED</div>
						<div>Sun: CLOSED</div>
					</div>

				</div>
			</PageSection>


			<PageSection maxWidth="1024px" id="social-section" columns={1}>
				<SocialTags />
			</PageSection>


			<PageSection id="footer" columns={1} max-width="1024px"padding="20px 0 0 0">
				<div suppressHydrationWarning={true} >
					<GoogleAnalytics id="G-7V857NV7TW" />
					<hr style={{ margin: "0 auto", width: "80%" }} />
					<br />
					<div className="centered">
						<p className="footer-text">&copy; {new Date().getFullYear()} Manning Metalworks. All rights reserved.</p>

						<PixelatedFooter />
						
					</div>
				</div>
			</PageSection>

		</>
	);
}

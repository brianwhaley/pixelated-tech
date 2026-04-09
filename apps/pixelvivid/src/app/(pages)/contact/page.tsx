"use client";

import React from "react";
import { PageTitleHeader } from "@pixelated-tech/components";
import { FormEngine } from "@pixelated-tech/components";

import formData from "@/app/data/contactform.json";
import routes from "@/app/data/routes.json";
const siteInfo = (routes as any).siteInfo;

export default function Contact() {

	return (
		<>
			<PageTitleHeader title="Contact Us" />
			<section className="" id="contactus-section">
				<div className="section-container">
					<div className="row-12col">
						<div className="grid-s4-e10">
							<div>
								Please fill out the form below. 
								We would LOVE to hear about your experience with PixelVivid products 
								or answer any questions, concerns, or requests you may have.  
								<br /><br /><br /><br />
							</div>
							<FormEngine formData={formData} />
							<div><br /><br /></div>
							<div>
								You can also contact us directly:<br /><br />
								<h3>Address:</h3>
								<p>
									<a href="https://maps.app.goo.gl/2bD1zr43i5CmkfAk7" target="_blank" rel="noopener noreferrer">
										{siteInfo.address.streetAddress}, {siteInfo.address.addressLocality}, {siteInfo.address.addressRegion} {siteInfo.address.postalCode}
									</a>
								</p>
								<h3>Email:</h3>
								<p><a href={`mailto:${siteInfo.email}`}>{siteInfo.email}</a></p>
								<h3>Phone:</h3>
								<p><a href={`tel:${siteInfo.telephone}`}>{siteInfo.telephone}</a></p>
							</div>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
"use client";

import { FourOhFour } from "@pixelated-tech/components";
const images = [
	{   "img": "https://www.palmetto-epoxy.com/images/palmetto-epoxy-logo.jpg", 
		"text": "Page Not Found.",
		"description": "Palmetto Epoxy Page Not Found" 
	}

];

export default function NotFound () {
	return (
		<section id="notfound-section">
			<div className="section-container">
				<FourOhFour images={images} />
			</div>
		</section>
	);
}
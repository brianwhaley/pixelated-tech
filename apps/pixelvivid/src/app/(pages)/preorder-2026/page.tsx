"use client";

import React, { useState } from "react";
import { PageSectionHeader, PageTitleHeader } from "@pixelated-tech/components";
import { FormEngine, Loading, Modal } from "@pixelated-tech/components";

import formData from "@/app/data/preorder2026form.json";

export default function Preorder2026() {
	const [modalContent, setModalContent] = useState<React.JSX.Element | null>(null);

	const handleSubmit = (event: any) => {
		event?.preventDefault?.();
		setModalContent(<div data-testid="preorder-modal">Thank you for your preorder request.</div>);
	};

	return (
		<>
			<PageTitleHeader title="Preorder 2026" />
			<section className="" id="preorder2026-section">
				<div className="section-container">
					<div className="row-12col">
						<div className="grid-s3-e11">
							<div>
								In 2026, I am planning to release the following designs.  
								Now is your chance to preorder one of these designs and be the first to get it when it is released!
								The pre-release price for these frames will be <b>$139</b>, and will increase to <b>$169</b> when they are released.  
								Also, you can provide your own frame to receieve your chosen design for <b>$99</b>.  
								By preordering, you will lock in the lower price, and you will be the first to get these designs when they are released.
								If you are interested in one of these paint designs on another frame type, 
								indicate that in the message and I will do my best to get one, and we can discuss a custom price for you.
							</div>
						</div>
					</div>
					<div className="row-12col" style={{alignItems: "start"}}>
						<div className="grid-s1-e7">
							<div>
								<PageSectionHeader title="Planned Releases" />
							</div>
							<div style={{fontSize: "var(--font-size5)"}}>
								<ol>
									<li><b>Red White & Blue Fade</b><br />
										This will be an airbrushed design, fading through each of the three colors,
										and splattered with red, white, blue, and black.
										There are a few options in this style: 
										<ul style={{margin: 0}}>
											<li>Fade the sunglasses from top to bottom</li>
											<li>Fade the sunglasses from front to back</li>
											<li>Fade the sunglasses randomly across the whole frame</li>
										</ul>
									</li>
									<li><b>Lace Spray Over</b><br />
										A throwback to the low rider community.  I have lots of different lace options, and I will be trying them all, 
										each on a different pair of sunglasses.  Each pair will be unique. 
										I will use the airbrush to paint two base colors - 
										<ul style={{margin: 0}}>
											<li>a black base with multiple colorshifts blend over the lace pattern</li>
											<li>a white base with multiple pastel colors blended over the lace pattern</li>
										</ul>
									</li>
									<li><b>Coastal Blue & Tan</b><br />
										This style is inspired by Coastal colors in South Carolina.  
										The color palette will be 
										 <a href="https://colorkit.co/color/a5c8d5/" target="_blank"> #A5D2D5</a>, 
										 <a href="https://colorkit.co/color/d3b395/" target="_blank"> #D3B395</a>, and 
										 <a href="https://colorkit.co/color/7ebdbf/" target="_blank"> #7EBDBF</a>.
										This will be an airbrushed design, fading randomly through 
										each of the three colors across the face of the frame,
										and lightly splattered with the same, plus black and white.</li>
									<li><b>Halloween Confetti</b><br />
										This will be a dot based design, using the common colors associated with Halloween - 
										Black, Orange, White, and very small amounts of Green.</li>
									<li><b>Blended Candy over Holographic</b><br />
										This is an airbrushed design, with a Blended Candy 
										moving across the front surface of the sunglasses - red to orange to yellow to green to blue.  
										Then a holographic flake is applied on the back surface of the sunglasses.</li>
									<li><b>Christmas Tree</b><br />
										This is a linear design of multiple green and occasional dark brown angled streaks as a base on the frame, 
										with multiple bright and metallic colored dots randomly all over, 
										and a string of white or silver dots across the frame.</li>
									<li><b>Custom</b><br />
										If you have a specific design in mind, you can fill out this form with details in the Message field, 
										or you can <a href="/request">request a custom frame </a> using the request form, 
										or you can contact us directly using our email address: 
										<a href="mailto:contactus@pixelvivid.com"> contactus@pixelvivid.com</a>
									</li>
								</ol>
							</div>
						</div>
						<div className="grid-s7-e12">
							<PageSectionHeader title="Preorder Form" />
							<FormEngine 
								name="preorder2026" 
								id="preorder2026Form" 
								formData={formData} 
								onSubmitHandler={handleSubmit} 
							/>
						</div>
					</div>
				</div>
			</section>
			<Loading />
			<Modal modalContent={modalContent} />
		</>
	);
}

"use client";

import React from "react";
import * as CalloutLibrary from "@/app/elements/calloutlibrary";
import { PageSection, PageGridItem } from "@pixelated-tech/components";
import { Callout } from "@pixelated-tech/components";


export default function Services() {
	return (
		<>
			<CalloutLibrary.PageTitle title="Services" />

			<PageSection columns={2} className="" id="primary-services-section">
				<PageGridItem>
					<Callout
						img='https://images.ctfassets.net/0b82pebh837v/1xi23O70o42mFz38ElKNw3/8ada068a8405e49c9389c0b0f94d87b6/Epoxy_Shining.jpg?fm=webp'
						title='Residential'
						content='Enhance your home with durable, stylish epoxy floors tailored to any room.
							Our expert team ensures a flawless finish that lasts.  
							Perfect for garages, basements, kitchen and bathroom countertops, and living spaces.
							Choose from a variety of colors and finishes to match your home decor.
							Experience the benefits of easy maintenance, stain resistance, and long-lasting beauty.'
						layout='vertical' 
						imgShape='squircle' />
				</PageGridItem>
				<PageGridItem>
					<Callout
						img='https://images.ctfassets.net/0b82pebh837v/6oA0GDDEJSkZRPy0PhCBSl/44c7989017c8f08c9fe7abc7bd732486/Epoxy_Floor_4.jpg?fm=webp'
						title='Commercial'
						content='Upgrade your business space with sleek, resilient commercial-grade epoxy flooring.
							Ideal for retail stores, offices, warehouses, and showrooms, our epoxy solutions
							offer both aesthetic appeal and long-lasting durability to withstand high traffic.
							Choose from a variety of colors and finishes to create a professional environment
							that reflects your brand. Enjoy easy maintenance and resistance to stains, chemicals, and wear.'
						layout='vertical' 
						imgShape='squircle' />
				</PageGridItem>
			</PageSection>

			<PageSection columns={1} id="additional-services-section">
				<PageGridItem>
					<Callout
						variant="boxed grid"
						layout='horizontal' 
						direction={"left"}
						gridColumns={{left: 1, right: 3}}
						img='https://images.ctfassets.net/0b82pebh837v/39vkbzDrlvLtK3fF86T7Zy/7b21429c376a679dd364cd56685b00f2/Seapines_1_Done.JPG?fm=webp'
						title='Epoxy Garage Floors'
						content='Transform your garage with our high-performance, spill-resistant epoxy floors.
							Choose from a variety of colors and finishes to create a space that is both functional and visually appealing.
							From traditional to modern designs and sports fans, we customize solutions to fit your style. 
							Ideal for car enthusiasts and homeowners alike.  
							Maintain a clean, durable surface that stands up to daily wear and tear.'
						imgShape='squircle' />
				</PageGridItem>
				<PageGridItem>
					<Callout
						variant="boxed grid"
						layout='horizontal' 
						direction={"right"}
						gridColumns={{left: 3, right: 1}}
						img='/images/projects/IMG_8829.jpeg'
						title='Resin Countertops'
						content='Upgrade your kitchen or bathroom with our durable, stylish resin countertops.
							Double your counter space with our seamless epoxy resin overlays that fit over existing surfaces.
							Our epoxy resin surfaces are easy to clean, resistant to stains, 
							and available in a variety of colors and finishes to match your decor. 
							Perfect for homeowners seeking a modern, low-maintenance solution that 
							enhances both functionality and aesthetics.
							Experience the benefits of a seamless, long-lasting countertop that elevates your space.'
						imgShape='squircle' />
				</PageGridItem>
			</PageSection>

			<PageSection columns={3} id="other-services-section">
				<PageGridItem>
					<Callout
						img='https://images.ctfassets.net/0b82pebh837v/4XSmKyMglzHAGa3PrDrnyt/b42f90a173ca7d860acadbb0defa9eeb/IMG_6229.jpg?fm=webp'
						title='Paver Sealing'
						content='Protect and beautify your pavers with our professional sealing services.
							Our high-quality sealants enhance color, prevent weed growth, and extend the life of your outdoor surfaces.
							Ideal for patios, driveways, and walkways.
							Choose from various finishes to achieve the desired look while ensuring durability against weather and wear.'
						layout='vertical' 
						imgShape='squircle' />
				</PageGridItem>
				<PageGridItem>
					<Callout
						img='https://images.ctfassets.net/0b82pebh837v/70SC4FojTqV1pVl0vTCbXH/88217839618887f3b73088a9f3f86ff9/Driveway_Polishjpg.jpg?fm=webp'
						title='Driveway Coating'
						content='Boost curb appeal and durability with our specialized driveway coating solutions.
							Our coatings protect against weather damage, oil stains, and wear while providing a sleek, finished look.
							Applicable for both residential and commercial properties.
							Choose from various colors and textures to suit your style.'
						layout='vertical' 
						imgShape='squircle' />
				</PageGridItem>
				<PageGridItem>
					<Callout
						img='https://images.ctfassets.net/0b82pebh837v/6DVnMXkegjtf8hJoPoj3PJ/b2270332d1136dc6a559c7df8cbe70b3/image-asset.jpeg?fm=webp'
						title='Concrete Polishing'
						content='Bring out the natural beauty of your concrete with our expert polishing services.
							Our process enhances durability, reduces dust, and creates a glossy finish that elevates any space.
							Choose from various sheen levels to achieve the desired look while improving maintenance and longevity.
							Perfect for both residential and commercial applications.'
						layout='vertical' 
						imgShape='squircle' />
				</PageGridItem>
			</PageSection>

			<section className="section-bluechip" id="contact-section">
				<CalloutLibrary.ContactCTA />
			</section>
		</>
	);
}

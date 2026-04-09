"use client";

import { Callout, PageTitleHeader, PageSection } from "@pixelated-tech/components";

export default function ServicesPage() {
    
	return (
		<>

			<PageTitleHeader title="JZ Home Improvement Services" />

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="service-section">
				<Callout
					variant="boxed grid"
					gridColumns={{left:1, right:3}}
					layout="horizontal"
					direction="left"
					img="https://images.ctfassets.net/kcm01cmyxlgq/2Rh82mKRC4NzciFxEUkIAT/82dd860b4018c755621580fd35233fdd/IMG_3994.jpeg"
					title="Kitchens"
					content="If you're looking to upgrade your kitchen, we offer a range of services 
					including custom cabinetry, countertop installation, flooring, and lighting solutions.
					Our team of experienced professionals will work with you to create a functional 
					and stylish kitchen that meets your needs and exceeds your expectations. 
					We use high-quality materials and the latest techniques to ensure a beautiful 
					and durable finish."
				/>
				<Callout
					variant="boxed grid"
					gridColumns={{left:3, right:1}}
					layout="horizontal"
					direction="right"
					img="https://images.ctfassets.net/kcm01cmyxlgq/Gam85MuDCo3rdt5NHva21/d93555e8d4185624527ca26e74423848/img_0738.webp"
					title="Bathrooms"
					content="A bathroom remodel can transform your space into a relaxing oasis.
					We specialize in custom tile work, shower and tub installation, vanity 
					replacement, and lighting upgrades. Our team will help you design a
					bathroom that is both functional, peaceful, and beautiful, using high-quality materials 
					and expert craftsmanship to ensure a lasting finish."
				/>
				<Callout
					variant="boxed grid"
					gridColumns={{left:1, right:3}}
					layout="horizontal"
					direction="left"
					img="https://images.ctfassets.net/kcm01cmyxlgq/6PdYkhzKHb6OiKg2xCgxIQ/9914251ac93d9f5ce920f2543532f301/0E4D00ED-D722-4281-8C7D-D16F2B2A7477_1_105_c.jpeg"
					title="Basements"
					content="Transform your basement into a functional living space with our remodeling services.
					Whether you're looking to create a home theater, game room, or additional bedroom,
					our team of experts will work with you to design and build a space that meets your needs.
					We handle everything from framing and drywall to flooring and lighting, ensuring a 
					high-quality finish that you'll love."
				/>
				<Callout
					variant="boxed grid"
					gridColumns={{left:3, right:1}}
					layout="horizontal"
					direction="right"
					img="https://images.ctfassets.net/kcm01cmyxlgq/SBj2WBdzLYoQsgTQPXDX6/05d0ded2da645e2972d15838961c3cdb/img_2656.webp"
					title="Decks"
					content="Enhance your outdoor living space with a custom deck built by our experienced team.
					We offer a variety of materials and styles to choose from, including wood, composite,
					and vinyl decking. Our team will work with you to design a deck that fits your lifestyle
					and complements your home's architecture. From start to finish, we handle all aspects 
					of the project to ensure a beautiful and durable result."
				/>
			</PageSection>

		</>
	);
}

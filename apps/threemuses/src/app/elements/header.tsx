"use client";

import { PageSection, PageGridItem } from "@pixelated-tech/components";
import { SmartImage } from "@pixelated-tech/components";
import { Hero } from "@pixelated-tech/components";
import { MenuAccordion, MenuAccordionButton } from "@pixelated-tech/components";
import myroutes from '../data/routes.json';
const allRoutes = myroutes.routes;

export default function Header() {
    
	return (
		<>
			<MenuAccordionButton />
			<MenuAccordion menuItems={allRoutes} />
			<PageSection columns={1} maxWidth="100%"id="header-section">
				<Hero 
					variant="static"
					img="/images/group-modern-ballet-dancers.jpg"
					height="40vh">
					<PageSection columns={1} maxWidth="100%" id="logo-section">
						<PageGridItem>
							<SmartImage 
								src="/images/logo/three-muses-color-round.png" 
								aboveFold={true} 
								alt="The Three Muses of Bluffton Logo"/>
						</PageGridItem>
					</PageSection>
				</Hero>
			</PageSection>
		</>
	);
}

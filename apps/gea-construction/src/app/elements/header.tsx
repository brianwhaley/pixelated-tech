"use client";

import { PageSection, usePixelatedConfig } from "@pixelated-tech/components";
import { SmartImage } from "@pixelated-tech/components";
import { Hero } from "@pixelated-tech/components";

export default function Header() {
	const config = usePixelatedConfig();

	return (
		<>
			<PageSection maxWidth="100%" columns={1} id="header-section">
				<Hero 
					variant="video"
					video="https://videos.ctfassets.net/6ewno74sai9a/1TrFikTTfPiUfKYr65AfxK/bdd46b0f5b1ee4a315b0818c58d52ed6/2020008_Darwin_Nt_1280x720.mp4"
					height="300px"
				>
					<div className="hero-content centered">
						<SmartImage
							id="logo"
							src="/images/gea-construction-logo-2-color.png"
							alt={config?.siteInfo?.name ? `${config.siteInfo.name} Logo` : "Site Logo"}
							aboveFold={true}
							width={525}
							height={237.5}
						/>
					</div>
				</Hero>
			</PageSection>
		</>
	);
}

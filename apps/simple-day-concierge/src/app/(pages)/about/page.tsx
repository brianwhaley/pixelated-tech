"use client";

import React from "react";
import { PageTitleHeader, PageSection, PageSectionHeader, Callout } from "@pixelated-tech/components";

export default function AboutPage() {
	
    
	return (
		<>

			<PageTitleHeader title="About Simple Day Concierge" />

			<PageSectionHeader title="Our Team" />
			<PageSection columns={2} maxWidth="1024px" padding="20px" id="team-section">
				<Callout 
					layout="vertical"
					img="/images/patricia-jadevaia.jpg"
					imgAlt="Patti Jadevaia Co-Founder & CEO of Simple Day Concierge"
					imgShape="bevel"
					title="Patti Jadevaia" 
					subtitle="Co-Founder & CEO" 
					content="With a rich background in corporate cybersecurity, Patti brings a strategic mindset and a passion for service to her role as CEO. Her commitment to excellence and personal care is the driving force behind Simple Day's mission to simplify our clients' lives with exceptional concierge services."
				/>
				<Callout 
					layout="vertical"
					img="/images/joe-jadevaia.jpg"
					imgAlt="Joe Jadevaia Co-Founder of Simple Day Concierge"
					imgShape="bevel"
					title="Joe Jadevaia" 
					subtitle="Co-Founder & COO" 
					content="Joe's extensive experience in the technology sector, particularly in cybersecurity, equips him with the organizational skills and attention to detail necessary to ensure seamless operations at Simple Day. As COO, he oversees the day-to-day management of our services, ensuring that every client receives the highest level of care and efficiency."
				/>
			</PageSection>

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="history-section">
				
				<PageSectionHeader title="Our History" />

				<p>Simple Day Concierge Service was born from a desire to pivot away from the high-stress demands of the corporate world and invest deeply into local relationships. For many years, founders Patti and Joe Jadevaia operated at the cutting edge of the technology sector, successfully selling sophisticated cybersecurity products to large corporations across the country. While protecting enterprise networks was a fulfilling professional chapter, the couple frequently noticed that the most precious, poorly managed resource in modern society was not data, but time itself. After choosing to retire from the demanding tech industry, Patti and Joe realized that they were uniquely positioned to leverage their organizational strengths to solve this universal challenge. They envisioned a family-owned business that could dismantle daily chaos for individuals, transforming the complex logistical puzzles of everyday life into a seamless, orderly experience.</p>

				<p>Driven by an enduring commitment to give back, Patti and Joe founded Simple Day Concierge as a direct way to support and uplift their neighbors. They recognized that busy modern families, overwhelmed commuters, and aging seniors all shared a critical need for trustworthy, hands-on help inside their homes. Rather than stepping away from active work entirely during retirement, the Jadevaias channeled their passion for service into an agency built on absolute security, privacy, and personal care. Today, they proudly run Simple Day with the same rigorous standard of excellence they brought to the corporate tech sector, but with a deeply personal, compassionate touch. Every client they serve is treated like a member of their own extended family, receiving the reliable support necessary to reclaim their peace of mind and enjoy a simpler routine.</p>

			</PageSection>

		</>
	);
}

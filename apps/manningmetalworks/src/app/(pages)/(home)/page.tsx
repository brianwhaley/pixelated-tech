"use client";

import React, { useState, useEffect } from "react";
import { PageGridItem, PageSection, PageTitleHeader, PageSectionHeader } from '@pixelated-tech/components';
import { Callout } from '@pixelated-tech/components';
import { BlogPostList, getCachedWordPressItems } from "@pixelated-tech/components";
import { ToggleLoading } from "@pixelated-tech/components";
import Script from "next/script";

const wpSite = "manningmetalworks.wpcomstaging.com";

/* 
Alternative Tag Lines
"Morris County's Choice for Certified Craftsmanship & 24/7 Reliability."
"Legacy of Excellence: Father-and-Son Owned, Artisan-Grade Fabrication."
"From Ornamental Art to Industrial Strength—We Weld It All."
"Your On-Site Solution for Precision Welding, Day or Night."
"Forging Relationships Through Quality Fabrication and Expert Repair."
*/

export default function Home() {


	const [wpPosts, setWpPosts] = useState<Awaited<ReturnType<typeof getCachedWordPressItems>>>([]);
	useEffect(() => {
		async function fetchPosts() {
			ToggleLoading({ show: true });
			const posts = (await getCachedWordPressItems({ site: wpSite, count: 1 })) ?? [];
			if (posts) {
				setWpPosts(posts);
				ToggleLoading({ show: false });
			}
		}
		fetchPosts();
	}, []);


	return (
		<>
			<PageSection columns={1} maxWidth="1024px" id="home-section">
				<PageTitleHeader title="Manning Metalworks" />
				<div className="scroll-fade-element" suppressHydrationWarning>
					<p>
						Manning Metalworks is a premier, son-and-father owned fabrication firm based in Morris Plains, dedicated to providing Morris County with elite-level residential, commercial, and municipal metal solutions. Our foundation is built on a legacy of master-level craftsmanship, merging Tim Manning's experience at prestigious national firms and local expertise with Greg Manning's precision and AWS-certified welding techniques. We take pride in being a local, family-operated business that treats every structural beam, ornamental gate, and emergency repair with an artisan's attention to detail. Whether we are fabricating complex stainless steel components for a commercial kitchen or providing on-site structural reinforcement for heavy machinery, our mission is to deliver durable, code-compliant results that stand the test of time.
					</p>
					<p>
						We understand that metal failures do not wait for business hours, which is why we have positioned ourselves as the region's most reliable 24/7 mobile welding partner. Our fully equipped mobile rigs allow us to bring a complete fabrication shop directly to your doorstep or job site, minimizing downtime and restoring security at any hour of the day or night. From the initial design phase to the final quality inspection, we prioritize transparent communication and a 100% satisfaction guarantee. By choosing Manning Metalworks, you are investing in a partnership built on a reputation for excellence, safety, and a deep-seated passion for the finer details of the craft.
					</p>
				</div>
			</PageSection>


			<PageSection columns={3} maxWidth="1024px" id="home-services-section">

				<PageGridItem columnSpan={3}>
					<PageSectionHeader title="Our Services" />
				</PageGridItem>

				<Callout
					variant="boxed"
					layout="vertical"
					img="https://images.ctfassets.net/j4mgog9ij96e/3kYMY0QTmRH5Z80aeCb0Vj/b82537bb4539c269ded4f5ed2d9bed4a/steel-welding-2023-11-27-05-03-16-utc.jpg.webp"
					url="/services#callout-precision-metal-fabrication"
					title="Precision Metal Fabrication"
				/>

				<Callout
					variant="boxed"
					layout="vertical"
					img="https://images.ctfassets.net/j4mgog9ij96e/72q7aF96JizutnU4rg5ypc/f0807c244e9ca3d63f9451c44fb0be84/manning-welding.jpg"
					url="/services#callout-expert-repairs-and-custom-fabrication"
					title="Expert Repairs and Custom Fabrication"
				/>

				<Callout
					variant="boxed"
					layout="vertical"
					img="https://images.ctfassets.net/j4mgog9ij96e/6cB07pwR2rPFsZ4ztIxXcy/f134c4fa44d3777c6a0c3e5822fa5a29/manning-truck.jpeg"
					url="/services#callout-247-mobile-welding-services"
					title="24/7 Mobile Welding Services"
				/>

			</PageSection>

			<PageSection columns={1} maxWidth="1024px" id="home-quality-section">
				<PageSectionHeader title="Our Quality Promise" />

				<Callout
					variant="boxed grid"
					gridColumns={{ left: 1, right: 3 }}
					layout="horizontal"
					img="https://images.ctfassets.net/j4mgog9ij96e/3MWxQf0bBzfA9fKyX8YlR/8978cac4569a3422331f5a66313be23f/manning-repair.jpg"
					url="/services#callout-247-mobile-welding-services"
					subtitle="At Manning Metalworks, our reputation is forged in every weld we strike. We combine a 100% satisfaction guarantee with a sophisticated quality control system to ensure that every residential, commercial, and municipal project meets the highest industry standards for safety and durability."
				/>
				<div className="scroll-fade-element" suppressHydrationWarning>
					<p>
						We believe that true quality is defined by the peace of mind we provide to our customers long after we have left the job site. Our commitment to excellence starts with the deliberate selection of premium-grade materials—whether it be structural carbon steel, architectural stainless steel, or high-performance aluminum—ensuring that the foundation of your project is built to last. We utilize a rigorous Quality Control System that governs every phase of our process, from the initial material inspection to the final accurate testing of structural joints. By employing a highly professional staff of AWS-certified welders, we ensure that our workmanship remains unrivalled in the Morris County area. We don't just aim to meet your expectations; we aim to set the local benchmark for what professional metal fabrication should look like, standing firmly behind our work with a comprehensive 100% Satisfaction Guarantee.
					</p>
					<p>
						Our reputation in the community is our most valuable asset, and we protect it by treating every project with the same level of professional discipline, regardless of its scale.  This technical precision is matched by a customer-centric approach that prioritizes clear communication and transparent results. By choosing Manning Metalworks, you are partnering with a qualified team that understands the intersection of safety and aesthetics. We are dedicated to providing a seamless experience where professional standards and elite-level craftsmanship converge, ensuring that every gate, beam, or repair we touch serves as a lasting testament to our dedication to our craft and our neighbors.
					</p>
				</div>
			</PageSection>



			<PageSection columns={1} maxWidth="1024px" id="home-section">
				<PageSectionHeader title="Read Our Most Recent Blog Post" />
				<BlogPostList site={wpSite} posts={wpPosts} showCategories={false} count={1} />
			</PageSection>



			<PageSection columns={1} maxWidth="1024px" id="home-section">
				<PageSectionHeader title="Recent Gallery Photos" />
				<div id="curator-feed-home-page-feed-layout" 
					style={{ maxWidth: "95vw", overflow: "hidden"}}
				/>
				<Script
					src="https://cdn.curator.io/published/1f7987eb-3e2a-406e-84c2-4571b6ff18f7.js"
					strategy="afterInteractive"
				/>
			</PageSection>

		</>
	);
}

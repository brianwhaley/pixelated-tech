"use client";

import React from 'react';
import { PageSection, PageTitleHeader, PageSectionHeader, PageGridItem } from '@pixelated-tech/components';
import { Callout } from "@pixelated-tech/components";
import { CountUp } from '@pixelated-tech/components';
import { FormButton } from '@pixelated-tech/components';
import { Hero } from '@pixelated-tech/components';
import routes from "@/app/data/routes.json";
const siteInfo = (routes as any).siteInfo;

export default function Home() {

	return (
		<>
			<Hero
				img="https://images.ctfassets.net/kcm01cmyxlgq/XvxJBRYhYcztjRz7EYrop/57ae459bc07c80e741a93f6a1093b2a9/IMG_3993.jpg" 
				imgAlt="JZ Home Improvement - Expert Work. Honest Pricing. Beautiful Results."
				imgId='jz-kitchen'
				variant="anchored-img"
			>
				<PageTitleHeader title="JZ Home Improvement" />
				<h2><span> Expert Work. </span><span> Honest Pricing. </span><span> Beautiful Results.</span></h2>
			</Hero>


			<PageSection columns={1} maxWidth="1024px" id="home-about-section">
				<PageSectionHeader title="About JZ Home Improvement" />
				<div>
					<p>
						At JZ Home Improvement, our mission is to provide homeowners throughout New Jersey with expert craftsmanship, honest pricing, and beautiful results on every project we undertake. We are committed to delivering high-quality home improvement solutions that enhance comfort, safety, and long-term value, while making the renovation experience clear, respectful, and stress-free for every client we serve.
					</p>
					<p>
						Founded and led by Jacek Machnik, our company is built on more than three decades of hands-on experience in the skilled trades and a deep respect for doing work the right way. Jacek's technical training as an electrician in Europe established a standard of precision, discipline, and problem-solving that continues to guide every project today. We believe that true craftsmanship is not only visible in the finished work, but also in the planning, communication, and attention to detail throughout the entire process.
					</p>
					<p>
						Our mission is to treat every home as if it were our own. We take the time to understand our clients' goals, offer practical and honest recommendations, and provide transparent pricing so families can make confident decisions about their homes. We do not believe in shortcuts, unnecessary upselling, or one-size-fits-all solutions. Instead, we focus on smart design, quality materials, and dependable workmanship that stands the test of time.
					</p>
					<p>
						We are dedicated to building lasting relationships with our clients based on trust, integrity, and mutual respect. Our goal is not just to complete a project, but to exceed expectations and earn lifelong customers who feel proud of their homes and confident in the work we have done. We measure our success not only by the quality of our craftsmanship, but also by the satisfaction and referrals of the families we serve.
					</p>
					<p>
						As a locally rooted business in Union, New Jersey, we are proud to support our community and work closely with trusted local suppliers and trade partners. We value the relationships we build with our clients just as much as the projects we complete. At JZ Home Improvement, our mission is simple and unwavering: to deliver expert work, honest pricing, and beautiful results that our neighbors can trust for years to come.
					</p>
				</div>
			</PageSection>


			<PageSection columns={3} maxWidth="1024px" background="var(--accent2-color)" id="home-countup-section">
				<PageGridItem>
					<CountUp
						id="years-experience"
						start={0} end={30} post="+"
						duration={2000}
						content="Years of Experience"
					/>
				</PageGridItem>
				<PageGridItem>
					<CountUp
						id="projects-completed"
						start={0} end={2000}
						duration={2000}
						content="Projects Completed"
					/>
				</PageGridItem>
				<PageGridItem>
					<CountUp
						id="happy-customers"
						start={0} end={3.0} post="K+"
						duration={2000} decimals={1}
						content="Happy Customers"
					/>
				</PageGridItem>
			</PageSection>


			<PageSection columns={2} maxWidth="1024px" id="home-service-section">
				<PageGridItem columnStart={1} columnEnd={-1}>
					<PageSectionHeader title="Our Services" />
				</PageGridItem>
				<Callout
					variant="boxed"
					layout="vertical"
					imgShape="bevel"
					img="https://images.ctfassets.net/kcm01cmyxlgq/2Rh82mKRC4NzciFxEUkIAT/82dd860b4018c755621580fd35233fdd/IMG_3994.jpeg"
					title="Kitchens" />
				<Callout
					variant="boxed"
					layout="vertical"
					imgShape="bevel"
					img="https://images.ctfassets.net/kcm01cmyxlgq/Gam85MuDCo3rdt5NHva21/d93555e8d4185624527ca26e74423848/img_0738.webp"
					title="Bathrooms" />
				<Callout
					variant="boxed"
					layout="vertical"
					imgShape="bevel"
					img="https://images.ctfassets.net/kcm01cmyxlgq/6PdYkhzKHb6OiKg2xCgxIQ/9914251ac93d9f5ce920f2543532f301/0E4D00ED-D722-4281-8C7D-D16F2B2A7477_1_105_c.jpeg"
					title="Basements" />
				<Callout
					variant="boxed"
					layout="vertical"
					imgShape="bevel"
					img="https://images.ctfassets.net/kcm01cmyxlgq/SBj2WBdzLYoQsgTQPXDX6/05d0ded2da645e2972d15838961c3cdb/img_2656.webp"
					title="Decks" />
			</PageSection>


			<Hero
				img="https://images.ctfassets.net/kcm01cmyxlgq/6rBSoc6C4x5gb3fxzkkVdh/aad0460d5b19eb0fd83e032097764ec9/img_0745.webp"
				imgAlt="JZ Home Improvement - Expert Work. Honest Pricing. Beautiful Results."
				imgId='jz-master-bathroom'
				variant="anchored-img"
			>
				<PageTitleHeader title="JZ Home Improvement" />
				<h2><span> Expert Work. </span><span> Honest Pricing. </span><span> Beautiful Results.</span></h2>
			</Hero>


			<PageSection columns={1} maxWidth="1024px" id="home-contact-section">
				<PageSectionHeader title="Contact JZ Home Improvement" />
				<div>
					<p>
						If you are planning a home improvement project in New Jersey, JZ Home Improvement is the trusted local partner you can rely on from the first conversation to the final walk-through. JZ Home Improvement brings more than 30 years of hands-on experience in residential renovation, repairs, and technical trades to every project. You are not handed off to salespeople or rotating crews—your project is guided by an experienced professional who is directly involved in the work and accountable for the results.
					</p>
					<p>
						Homeowners contact JZ Home Improvement because they want honest guidance, clear communication, and pricing that is fair and transparent from the start. Whether you are remodeling a kitchen, updating a bathroom, finishing a basement, or tackling long-overdue repairs, you will receive practical recommendations tailored to your home and your budget. Built almost entirely on referrals and repeat clients, JZ Home Improvement has earned its reputation by consistently delivering expert work, honest pricing, and beautiful results for families throughout Northern New Jersey.
					</p>
				</div>
				<FormButton
					id="contact-jz-home-improvement"
					className="button"
					type="button"
					text="Contact JZ Home Improvement"
					onClick={() => window.location.href='/contact'} />
				<Callout
					url="/contact" />
			</PageSection>

			<Hero
				img="https://images.ctfassets.net/kcm01cmyxlgq/2fLlA6986LGx8f5tbZxoXW/88928e4a0246e3f86110f47b6df1b57b/2024-02-01-15.00.16.jpg"
				imgAlt="JZ Home Improvement - Expert Work. Honest Pricing. Beautiful Results."
				imgId='jz-hall-bathroom'
				variant="anchored-img"
			>
				<PageTitleHeader title="JZ Home Improvement" />
				<h2><span> Expert Work. </span><span> Honest Pricing. </span><span> Beautiful Results.</span></h2>
			</Hero>


			<PageSection maxWidth="1024px" id="service-area-section" columns={1}>
				<div className="row-3col">
					<div className="grid-item" style={{ textAlign: 'center' }}>
						<h3>Location</h3>
						<div>JZ Home Improvement</div>
						<div><a href="https://maps.app.goo.gl/nnVYQynhUq9T54Bx6" target="_blank" rel="noopener noreferrer">{siteInfo.address.streetAddress}</a></div>
						<div><a href="https://maps.app.goo.gl/nnVYQynhUq9T54Bx6" target="_blank" rel="noopener noreferrer">{siteInfo.address.addressLocality}, {siteInfo.address.addressRegion} {siteInfo.address.postalCode}</a></div>
						<h3>Contact Us</h3>
						<div>Phone: <a href={`tel:${siteInfo.telephone}`}>{siteInfo.telephone}</a></div>
						<div>Email: <a href={`mailto:${siteInfo.email}`}>{siteInfo.email}</a></div>
					</div>

					<div className="grid-item">
						<iframe 
							src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3025.017623950529!2d-74.2521616!3d40.695609499999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c3ad1296ced7cd%3A0x9d7a13491825e3f8!2s1151%20Reeves%20Terrace%2C%20Union%2C%20NJ%2007083!5e0!3m2!1sen!2sus!4v1769802801457!5m2!1sen!2sus" 
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


		</>
	);
}

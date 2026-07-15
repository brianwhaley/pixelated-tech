
'use client';

import { useEffect, useState } from 'react';
import { PageSection, smartFetch, useFileData } from '@pixelated-tech/components';
import { generateGoogleFontsUrl } from '@pixelated-tech/components';
import { contrastyColor } from '@pixelated-tech/components';
import { SmartImage } from '@pixelated-tech/components';
import './assessment.css';

type AssessmentData = {
	companyName: string;
    companyContact: string;
	date: string;
	email: string;
	phone?: string;
	address: {
		streetAddress: string;
		addressLocality: string;
		addressRegion: string;
		postalCode: string;
		addressCountry?: string;
	};
	primaryAudience: string[];
	secondaryAudience: string[];
	marketOverview: string[] | string;
	currentSocialMedia: string[];
	advertisingPartners: string[];
	earnedMedia: string[];
	existingSite?: {
		url: string;
		strengths: string[];
		areasForImprovement: string[];
	};
	similarCompanyNames: { name: string; urls?: string[]; url?: string; summary: string }[];
	competitors: { name: string; urls?: string[]; summary: string }[];
	currentState: string[];
	nextSteps: string[];
	aboutPixelated: string[];
	colorPalette: {
		primary: string;
		secondary: string;
		tertiary: string;
		accent1: string;
		accent2: string;
		accent3: string;
		headerFont: { name: string; url: string } | string;
		bodyFont: { name: string; url: string } | string;
	};
	websiteDomain: { currentUrls?: string[]; proposedUrls?: string[] };
	informationArchitecture: { route: string; title: string; notes: string[] }[];
	blogRoute?: { enabled: boolean; route: string };
	proposedSocialMediaAccounts: string[];
	differentiation: string[];
	currentBusinessPlan: string[];
	keywords: string[];
	logo?: { url: string; altText?: string };
};

interface AssessmentManifest {
	files: string[];
}



function renderList(items: string[]) {
	return (
		<ul>
			{items.map((item, index) => (
				<li key={index}>{item}</li>
			))}
		</ul>
	);
}

function renderParagraphs(items: string[]) {
	return items.map((item, index) => <p key={index}>{item}</p>);
}

export default function AssessmentPage() {
	const { data: manifest, loading: manifestLoading, error: manifestError } = useFileData('/data/assessment/manifest.json', 'json');
	const manifestData = (manifest as unknown) as AssessmentManifest | undefined;
	const [selectedFile, setSelectedFile] = useState<string | null>(null);
	const [assessment, setAssessment] = useState<AssessmentData | null>(null);

	useEffect(() => {
		if (!selectedFile && manifestData?.files?.length) {
			setSelectedFile(manifestData.files[0]);
		}
	}, [manifestData, selectedFile]);

	useEffect(() => {
		if (!selectedFile) {
			setAssessment(null);
			return;
		}
		const fetchAssessment = async () => {
			setAssessment(null);
			try {
				const data = await smartFetch(`/data/assessment/${selectedFile}`, {
					responseType: 'json',
				});
				setAssessment(data as AssessmentData);
			} catch (err) {
				console.error('Error fetching assessment data:', err);
			}
		};
		fetchAssessment();
	}, [selectedFile]);

	return (
		<>
			<PageSection id="selection-section" className="no-print" columns={1} maxWidth="1024px">
				<div className="assessment-select-wrap print-hidden">
					{manifestLoading && <div>Loading manifest list...</div>}
					{manifestError && <div className="assessment-error">Error loading assessment manifest: {manifestError}</div>}
					{!manifestLoading && !manifestError && manifestData?.files?.length ? (
						<label className="assessment-select-label">
            Choose assessment JSON:
							<select value={selectedFile ?? ''} onChange={(event) => setSelectedFile(event.target.value)}>
								{manifestData.files.map((file: string) => (
									<option key={file} value={file}>{file.replace(/\.[^.]+$/, '')}</option>
								))}
							</select>
						</label>
					) : null}
				</div>
			</PageSection>
			{assessment && <Assessment assessment={assessment} />}
		</>
	);
}



function Assessment(props: { assessment: AssessmentData }) {
	const {assessment} = props;
	return (
		<>
			<FontLoader palette={assessment.colorPalette} />

			<PageSection id="title-section" columns={1} maxWidth="1024px">
				<div className="assessment-page-header">
					<h1>Assessment</h1>
					<br />
					<p>{new Date(assessment.date).toLocaleDateString()}</p>
					<br />
					<SmartImage 
						src="/images/pexels-fauxels-3184292-sm.jpg"
						alt="Pixelated Technologies Assessment"
						title="Pixelated Technologies Assessment"
						aboveFold={true}
					/>
					<br /><br />
					<h2>FOR: {assessment.companyName}</h2>
					<p>{assessment.address.streetAddress}, {assessment.address.addressLocality}, {assessment.address.addressRegion} {assessment.address.postalCode}</p>
					<p>{assessment.phone}</p>
				</div>
			</PageSection>

			<PageSection id="marketing-analysis-section" className="page-break" columns={1} maxWidth="1024px">
				<h1>Marketing Analysis</h1>
				<p>I have completed an analysis of your company to see what your digital footprint looks like compared to some of your competitors. This includes current branding, web sites, social media platforms used, current advertising and marketing, and articles about your company.</p>

				<h2>Company Information</h2>
				<p>There does not appear to be any local companies with the same exact name as {assessment.companyName} in your local market. However, there are  other companies with your name or similar name in other locations.</p>

				<div>
					<h3>COMPANIES WITH SIMILAR NAMES</h3>
					{assessment.similarCompanyNames.map((company, index) => (
						<div key={index}>
							<h3>{company.name}</h3>
							<ul>
								{company.url ? <li><a href={company.url} target="_blank" rel="noreferrer">{company.url}</a></li> : null}
								{company.urls?.length ? company.urls.map((url, i) => (
									<li key={i}><a href={url} target="_blank" rel="noreferrer">{url}</a></li>
								)) : null}
								<li>{company.summary}</li>
							</ul>
						</div>
					))}

				</div>

				<div>
					<h3>Primary Target Audience</h3>
					{renderList(assessment.primaryAudience)}
				</div>

				<div>
					<h3>Secondary Target Audience</h3>
					{renderList(assessment.secondaryAudience)}
				</div>

				<div>
					<h2>Local Market Overview</h2>
					{renderParagraphs(Array.isArray(assessment.marketOverview) ? assessment.marketOverview : [assessment.marketOverview])}
				</div>

				<div>
				    <h2>Some Local Competitors</h2>
					{assessment.competitors.map((competitor, index) => (
						<div key={index}>
							<h3>{competitor.name}</h3>
							<ul>
								{competitor.urls?.length ? competitor.urls.map((url) => (
									<li key={url}><a href={url} target="_blank" rel="noreferrer">{url}</a></li>
								)) : null}
								<li>{competitor.summary}</li>
							</ul>
						</div>
					))}
				</div>

				<div>
					<h2>Current Web Site</h2>
					{assessment.websiteDomain.currentUrls?.length ? (
						<ul>
							{assessment.websiteDomain.currentUrls.map((url: string, i: number) => (
								<li key={i}><a href={url} target="_blank" rel="noreferrer">{url}</a></li>
							))}
						</ul>
					) : (
						<p>No current website URL is provided.</p>
					)}
					<h3>Strengths</h3>
					<ul>
						{renderList(assessment.existingSite?.strengths || [])}
					</ul>
					<h3>Areas for Improvement</h3>
					<ul>
						{renderList(assessment.existingSite?.areasForImprovement || [])}
					</ul>
				</div>

				<div>
					<h2>Current Social Media</h2>
					{assessment.currentSocialMedia.length ? renderList(assessment.currentSocialMedia) : <p>No social media data available.</p>}

					<h2>Current Advertising Partners</h2>
					{assessment.advertisingPartners.length ? renderList(assessment.advertisingPartners) : <p>No current advertising partners listed.</p>}

					<h2>Current Earned / Traditional Media</h2>
					{assessment.earnedMedia.length ? renderList(assessment.earnedMedia) : <p>No current earned media listed.</p>}
				</div>
			</PageSection>

			<PageSection id="about-pixelated-section" className="page-break" columns={1} maxWidth="1024px">
				<h1>About Pixelated Technologies</h1>
                
				<p>Pixelated Technologies is a digital services company that helps small businesses grow through custom IT solutions, including web development, social media marketing, search engine optimization, content management, eCommerce, and small-business modernization. The company’s mission is to empower small businesses to thrive in the digital age by delivering tailored technology services that drive growth and efficiency.</p>

				<p>The owner, Brian Whaley, began his career working with small- and medium-sized businesses and then spent more than 25 years leading web development teams at major organizations such as American Express, PR Newswire, The Associated Press, Bellcore (a former division of AT&T), and Bristol-Myers Squibb.  Now returning to those roots, Pixelated Technologies focuses on helping local small businesses grow and succeed.</p>

				<p>An active online presence is essential for small businesses to compete. Pixelated Technologies provides cost-effective, efficient solutions tailored to the needs of small and medium business owners.</p>

				<h2>A Note on AI</h2>
				<p>Pixelated Technologies leverages AI tools throughout the design and production process. AI tools are not used as a substitute for decision making, but as a source of collaboration and acceleration. We use AI tools in content creation, design, creative, coding, and maintenance processes throughout the lifecycle of our work.</p>

				<h2>Industry Pricing and Service Models</h2>
				<p>The pricing theme for web development generally follows two industry models:</p>
				<ul>
					<li><b>Flat Fee Pricing</b> - Pixelated Technologies offers an all-inclusive pricing model that bundles custom web development, graphic design, domain purchase, image licensing, site content creation, and more.</li>
					<li><b>A La Carte Services</b> - The common Do-It-Yourself platforms like WordPress, GoDaddy, Wix, etc. provide an a-la-carte toolset for those who have the time and ability to build a site themselves.  You then must pay extra per month for each of the new services you need, including premium themes and plugins, additional features like SEO, Accessibility, and other integrations.  Most of these web site platforms either provide simple easy to use functionality or are too complex for the average person to use.  Professional services such as custom web development, graphic design, content creation, and image licensing are all additional costs.</li>
				</ul>

				<p>The services provided by each of the cost models are very different:</p>
				<ul>
					<li><b>Custom Site Shops</b> like Pixelated Technologies offer years of experience running the spectrum of features you will need, for many companies and industries, with ways to automate for speed to market and optimize for impact.  This includes Graphic Design, Content Creation, Social Media and Marketing experience, SEO, Analytics, Content Management and Distribution, Accessibility, Page Speed, and more.  They act as additional members of your team, managing technology, marketing, advertising, and other intangible services like business strategy, competitive analysis local businesses in your area, and more.</li>
					<li><b>Off the Shelf Web Platforms</b> - Off the shelf web platforms like WordPress or GoDaddy, Wix, etc. have a customer service phone number that can help you with basic questions related to using their tools, and will often upsell you to premium themes, plugins, and upgraded hosting packages that rarely solve your problem as a small business owner.</li>
				</ul>

				<h2>Pixelated Value Proposition</h2>
				<p>Pixelated Technologies partners with small and medium businesses to deliver measurable digital results — not just websites. We combine strategic design, proven development practices, and ongoing marketing expertise into straightforward packages so owners get a high-performing, maintainable online presence without the hidden monthly surprises. Our flat-fee offerings provide predictable, end-to-end delivery (design, content, licensing, launch), while our modular services let clients add targeted capabilities as they grow. Beyond build and launch, we act as an extension of your team: optimizing for search and speed, maintaining accessibility and security, and turning content into repeatable marketing assets that drive leads and revenue.</p>

				<h2>Key Takeaways</h2>
				<ul className="assessment-list">
					<li>If you are prepared to take on the additional work of learning new tools, writing your own content, using your own photos, and pouring your time into building your own web site, then a web site platform like WordPress, Wix, or GoDaddy may be right for you.</li>
					<li>If you prefer to focus on your business and build relationships with new customers, having a company like Pixelated to manage your website is both cost-effective and time efficient from a business perspective.</li>
					<li>While a small business owner can take on website management themselves (or hand it over to a family member or friend), it is often not business-minded, well maintained, optimized for speed and search, kept up-to-date, and ultimately presents as “old” or “dormant”. This does not instill confidence in new customers visiting your site.</li>
				</ul>
			</PageSection>

			<PageSection id="plan-overviewsection" className="page-break" columns={1} maxWidth="1024px">
				<h1>Plan Overview</h1>
				<h2>Branding</h2>
				<ul>
					<li>Build, adapt, and strengthen your business strategy to reflect your brand and business goals. Create and update a strong visual brand connecting you to the community and local businesses.</li>
					<li>Focus on content creation for visibility, engagement, trust, and growth. This starts with the website and extends to social media platforms.</li>
					<li>Re-platform your website to improve scalability, functionality, SEO, and AI-friendly AEO.</li>
					<li>Choose social media platforms that align with your business goals, community, and competitor landscape.</li>
					<li>Invest in digital, print, and earned media for a holistic advertising approach.</li>
					<li>Participate in the local community ecosystem, including clubs, nonprofits, hobby groups, and more.</li>
				</ul>

				<div>
					<h2>Business Plan</h2>
					<p>This is a summary understanding of your current business strategy and how it impacts your website and digital presence. The following outlines the current state and a plan for improvement.</p>
					{renderList(assessment.currentBusinessPlan)}
				</div>

				<div>
					<h2>Next Steps</h2>
					{renderList(assessment.nextSteps)}
				</div>
			</PageSection>

			<PageSection id="plan-step1-section" className="page-break" columns={1} maxWidth="1024px">
				<div>
					<h1>Step 1 - Your Website</h1>
					<p>Step 1 is to build a strong brand tied to the community. That starts with your website.</p>
				</div>

				<div>
					<h2>Current Branding</h2>
					<p>Here is a quick snapshot of your current branding / logo variations</p>
					{assessment.logo?.url ? (
						<>
							<SmartImage 
								src={assessment.logo.url} 
								alt="Current Logo" 
								title="Current Logo"
								aboveFold={true} 
							/>
							<br />
						</>
					) : (
						<p>No current logo provided.</p>
					)}
				</div>

				<div>
					<h2>Color Palette</h2>
					<p>Here is an overview of the proposed color palette you use for your new web site, consistent with your branding and design aesthetic.</p>
					<div className="color-palette row-3col">
						<div className="color-palette-item grid-item" style={{ background: assessment.colorPalette.primary, color: contrastyColor(assessment.colorPalette.primary) }}>Primary</div>
						<div className="color-palette-item grid-item" style={{ background: assessment.colorPalette.secondary, color: contrastyColor(assessment.colorPalette.secondary) }}>Secondary</div>
						<div className="color-palette-item grid-item" style={{ background: assessment.colorPalette.tertiary, color: contrastyColor(assessment.colorPalette.tertiary) }}>Tertiary</div>
						<div className="color-palette-item grid-item" style={{ background: assessment.colorPalette.accent1, color: contrastyColor(assessment.colorPalette.accent1) }}>Accent 1</div>
						<div className="color-palette-item grid-item" style={{ background: assessment.colorPalette.accent2, color: contrastyColor(assessment.colorPalette.accent2) }}>Accent 2</div>
						<div className="color-palette-item grid-item" style={{ background: assessment.colorPalette.accent3, color: contrastyColor(assessment.colorPalette.accent3) }}>Accent 3</div>
					</div>
				</div>

				<div>
					<h3>Typography</h3>
					<p>Based on your logo, balance serif (traditional/authority) with sans-serif (modern/accessible).</p>
					<p>Header font: <a href={typeof assessment.colorPalette.headerFont === 'string' ? assessment.colorPalette.headerFont : assessment.colorPalette.headerFont.url} target="_blank" rel="noreferrer">{typeof assessment.colorPalette.headerFont === 'string' ? assessment.colorPalette.headerFont : assessment.colorPalette.headerFont.name}</a></p>
					<p>Body content font: <a href={typeof assessment.colorPalette.bodyFont === 'string' ? assessment.colorPalette.bodyFont : assessment.colorPalette.bodyFont.url} target="_blank" rel="noreferrer">{typeof assessment.colorPalette.bodyFont === 'string' ? assessment.colorPalette.bodyFont : assessment.colorPalette.bodyFont.name}</a></p>
				</div>

				<div>
					<h2>Visual Elements &amp; UI</h2>
					<p>This design language succeeds only through ample, deliberate white space. It is not just empty space; it plays a crucial role and is a vital part of the brand.White space expresses exclusivity, giving page elements room to breathe implies luxury, prevents information overload for the users, and ensures elegant branding and typography become the heroes.</p>

					<p>Borders should be very thin (1px) charcoal or blue lines. Use ghost buttons with transparent backgrounds and a 1px blue border that fills on hover.</p>

					<p>Navigation should be top and right on the screen, use a clean sans-serif text, with a subtle hover highlight. Buttons should be solid, matching the color palette with white text.</p>

					<p>Iconography should be minimal line-art in charcoal gray.</p>
				</div>

				<div>
					<h2>Web Site Domain</h2>
					<p>The web domain is one of the most important parts of the strategy.</p>
					<span>Current domain(s):</span>
					<ul>
						{assessment.websiteDomain.currentUrls ? (
							assessment.websiteDomain.currentUrls.map((url, index) => (
								<li key={index}><a href={url} target="_blank" rel="noreferrer">{url}</a></li>
							))
						) : <li>No current website domain provided.</li>}
					</ul>
					<span>Proposed domain(s):</span>
					<ul>
						{assessment.websiteDomain.proposedUrls ? (
							assessment.websiteDomain.proposedUrls.map((url: string, index: number) => (
								<li key={index}><a href={url} target="_blank" rel="noreferrer">{url}</a></li>
							))
						) : null}
					</ul>
				</div>

				<div>
					<h2>Information Architecture</h2>
                    
					<p>The objective of the new website is to build a unified and holistic home base for all things related to your company. The site should have a primarily flat hierarchy, making it easy for your customers and search engines to find what they are looking for.</p>
                    
					<p>To pull it all together, I recommend the following information architecture for the web site.  This structure is designed to mirror the refined, high-touch experience of the brand. Each page should feel less like a "sales pitch" and more like an invitation into an exclusive world.</p>
					{assessment.informationArchitecture.map((item, index) => (
						<div key={index} className="ia-item">
							<h3>{item.title}</h3>
							<p>Route: {item.route}</p>
							{renderList(item.notes)}
						</div>
					))}
				</div>

				<div>
					<h2>SEO / AEO Strategy</h2>
                    
					<p>SEO, Page Speed, and Accessibility are a critical part of this step.  There should be a rigor and diligence applied to these disciplines as each page and the entire site is built, deployed, and maintained to ensure high page rankings and great customer experience.  </p>
                    
					<p>SEO (Search Engine Optimization): While other companies may be further along in their digital presence journey, {assessment.companyName} can win by doubling down on quality, connection to community, personalized service, and a high-end product.</p>
                    
					<h3>Recommended Keywords:</h3>
					<ul>
						<li>
							{assessment.keywords.join(', ')}
						</li>
					</ul>

					<p>AEO (Answer Engine Optimization): Phrase titles to answer the "How do I..." and "Best way to..." questions that AI bots (like Gemini, Perplexity, and ChatGPT) crawl to provide recommendations. Including behind-the-scenes features that help AI models digest, retrieve, and return your targeted information to potential customers asking questions via search agents.</p>
				</div>

				<div>
					<h2>How to Differentiate Yourself</h2>
					{renderList(assessment.differentiation)}
				</div>

				<div>
					{assessment.blogRoute?.enabled ? (
						<>
							<h2>Blog Strategy</h2>

							<p>To keep your SEO strong and your audience engaged, a 52-week blog post calendar rotates through your service-related themes. Organized them so that the topics align with seasonal peaks (e.g., performance seasons, best times to paint or power wash, etc.).</p>

							<p>Publishing one high-quality, locally focused blog post per week provides several benefits:</p>
							<ul>
								<li>Improves Google rankings for service-based and location-based searches</li>
								<li>Demonstrates subject matter expertise and credibility</li>
								<li>Creates reusable content for social media and email marketing</li>
								<li>Answers common customer questions before they ever pick up the phone</li>
							</ul>

							<p>Each post should be optimized for:</p>
							<ul>
								<li>Local SEO</li>
								<li>Service keywords</li>
								<li>Clear calls-to-action</li>
							</ul>

							<p>These blog posts are drafted by Pixelated Technologies, then reviewed by you and your team.  We do the heavy lifting to research the topic, write the content, post the article, and distribute across your social media platforms.  We customize the approach to write and publish these to keep you focused on your customers, not writing blog posts or web content.</p>
						</>
					) : null}
				</div>
			</PageSection>

			<PageSection id="plan-step2-section" className="page-break" columns={1}>
				<h1>Step 2 - Social Media Strategy</h1>

				<p>Deepening your presence with the community with your social media presence (particularly current and frequent local reviews), will strengthen and expand your customer base and help them find the information they need to make a decision.</p>

				<p>The First step will be to leverage current social media presence focused on value to your customers.  This includes creating social media accounts with new, frequent, and relevant local content, and expanding into platforms specifically targeting local communities and their needs. Google Business is perfect for collecting real feedback from your customers with reviews, and has the biggest imact on SEO.  Facebook is perfect for connecting to local groups and community members.  Instagram is great to share visuals, but is a bit harder to connect to your audience.  Threads is a great addition as it is a Twitter competitor but integrates with your other two Meta accounts (Facebook and Instagram).  I would also make sure you have a LinkedIn profile.  Each of these accounts shoudl be business accounts, as there ae additional benefits for having that, and is still free. </p>

				<p>The Next step you will need new accounts focused on deepening that connection and the new aspect of your evolving brand.  The new social footprint will need to be where the consumers are.  You may want to consider a focused approach to social media for this, including claiming your accounts on Nextdoor and Yelp, and creating an account on Reddit.  You may also want to think about niche platforms that are secondary or complimentary groups.  These social media platforms will allow you to participate in groups focused on community and geography.</p>

				<p>On all your social media accounts, your first set of posts should focus on the established success of your company, creating awareness and partnership within the community and other anchor businesses.  Then you should share customer spotlights and testimonials to generate E-E-A-T (Experience, Expertise, Authoritativeness, and Trustworthiness).  Future posts should then focus on driving decision-making, such as recent partnerships, participation in community events, and topics demonstrating subject matter expertise, such as blog post publishes, etc.  </p>

				<p>I also recommend starting or advertising a Review & Referral Program.  The program is simple - you offer an incentive to previous customers, and each new customer.  For example, if they complete an online review, you will send them a $25 Visa gift Card (or some other incentive).  This also applies for referrals - for each customer who completes a project, you can send a referral bonus.  This reinforces the strong word-of-mouth, community focused repeat business you already have, and increases your credibility in your digital presence.  You can also do this with commercial partners too - as you build complementary opportunities with local businesses, you can incentivize them with a 5% or 10% discount on their next engagement for reviews or referrals.  You can send emails to your existing customer base to let them know about the program, too.  </p>

				{assessment.proposedSocialMediaAccounts.length ? (
					<>
						<h3>Proposed New Social Media Accounts</h3>
						{renderList(assessment.proposedSocialMediaAccounts)}
					</>
				) : null}
			</PageSection>

			<PageSection id="plan-step3-section" className="page-break" columns={1}>
				<h1>Step 3 - Advertising Strategy</h1>

				<p>Once you have your web site active and your social media footprint established, I recommend focusing on a light touch media campaign for your company.</p>

				<p>This includes:</p>
				<ol>
					<li>Create a small advertising budget and invest in social media advertising and track results for conversion rates.</li>
					<li>Registering with digital directories, industry groups, chambers of commerce, etc.</li>
					<li>Consider the use of mail groups and email marketing to communicate with your audience.</li>
					<li>Reach out to local influencers, news media, and bloggers to promote your business, new product launches, grand re-openings, and other significant events.</li>
					<li>Explore traditional media such as local newspapers, radio, and television advertising, that make sense to your business</li>
				</ol>

				<h2>Digital Advertising</h2>

				<p>Most digital advertisers (Google, Facebook, LinkedIn, Yelp, Nextdoor, Reddit, etc.) have two price models - Cost per Click (CPC) and Cost Per Mille (1000) Impressions (CPM).  CPC is usually more expensive, as it is a more accurate measure of customer engagement.  CPM is less expensive, but more of a shotgun approach, reaching more eyes but less targeted results.</p>

				<p>I recommend starting small, hyper local and working your way outwards.  For example, The Patch (a hyper-local newspaper system) allows you to advertise per town, i.e. Bluffton, Beaufort, Hardeeville, Ridgeland, etc.  You can advertise with The Patch for as little as $5 per town.  You can also try Yelp or Nextdoor Advertising, which will target residential neighborhoods, right where decisions are being made.  It has shown to generate solid traffic and good conversion rates.</p>

				<p>For broader reach, I would advertise on Facebook or Google.  You will get more eyes and more conversions, but at a cost.  The great thing about using Google Advertising is that your Google Business profile, web site, and Gemini AI all work hand in hand as the primary platform for searching and decision-making.  And the right strategy is to create a budget (ie $5 per day, etc.) to keep the exposure high and the cost low.</p>

				<p>Last, I would build a presence and a reputation on Reddit.  This is a more long term, holistic approach, contributing to a much broader online conversation, participating in threads started by consumers and companies in relevant subreddits.  You can host an AMA (Ask Me Anything) there for those industries as well.  Once you have established with some Karma (i.e. Reddit’s rating system), I would then buy into Reddit Advertising.  This is a much longer-term investment rather than trying to get quick page hits.</p>

				<h2>Other Earned Media</h2>

				<ul>
					<li>Online industry directories are a great way to get your company’s profile out there</li>
					<li>Becoming a member of Local and National organizations related to your industry are another place to invest time.  They have web sites, publications, and events of their own and can provide scaled media opportunities.</li>
					<li>Chambers of Commerce can help you get the word out, have networking events, and are a great way to find partners in the community</li>
					<li>As you have big announcements about your company, reach out to small radio tv and digital media companies to possibly get a spotlight or a feature run about your company or your announcements.</li>
					<li>Print media will also be important.  Postcard mailers can blanket an entire neighborhood to generate visibility and traffic, and a few conversions into a new neighborhood and positive word-of-mouth advertising will pay for itself.  Targeting an established community with larger more expensive homes is a great place to start.</li>
					<li>Local newspapers and magazines are great ways to get some inexpensive eyeballs on your brand and cover a very wide net.  Choosing targeted areas for this will pay big dividends.  </li>
				</ul>

				<h2>Target Audience List</h2>

				<p>It is very helpful to build a target audience list to help you focus your effort while working on social media accounts, announcements, blog posts, email campaigns, postal mailers, and more.  The more specific you can make your list, including specific industries, company names, and specific members of the company, the more effective your targeting will be.</p>

				<p>For example, knowing you are targeting existing residential customers, you can generate a list of existing customers’ names, email addresses, mail addresses, etc. You may also be able to target groups of residents in apps like Nextdoor based on neighborhood.  All that is very useful in your targeting.</p>

				<p>And, since you are going to be targeting other local businesses in your social media campaigns, I also recommend creating a list of companies you want to specifically target for your social media.  This could be existing customers, existing partners, future partners, possible future business customers, complimentary companies or industries, folks who may refer your company, anyone you can think of that would benefit from being updated on your company’s updated information.</p>

				<h2>Traditional Media (Print, TV, Radio, Podcast)</h2>

				<p>Traditional media channels act as the "high-gloss" introduction to your brand, lending a sense of established authority and prestige that digital ads alone often struggle to achieve. For a luxury service like Simple Day, an ad in a local lifestyle magazine or a guest spot on a regional podcast serves as a powerful trust signal, capturing the attention of a clientele that values heritage and curated recommendations. However, these channels are most effective when they serve as a bridge to your digital home; having a professional, high-performance website and active social media presence is critical because they act as the "closing room" where that initial curiosity is converted into a lead. When a potential client hears your podcast interview or sees your print ad, their first instinct will be to "check you out" online; if your digital foundation is seamless and reflects the same premium quality as your traditional ads, it reinforces your credibility and provides the interactive space needed for them to book a consultation.</p>

				<h2>Associations & Organizations</h2>

				<p>To boost visibility, Simple Day Concierge Services should focus on a "Hyper-Local + Niche Professional" strategy. By joining these specific organizations, you'll place yourself where you can be most effective - networking with business leaders, connecting with the arts community, and establishing professional authority.</p>

				<p>Active participation in local chambers and industry organizations is the cornerstone of building "social capital" and a reliable referral network within your specific service area. These groups provide a platform for face-to-face relationship building, positioning you as a vetted and engaged member of the business community rather than just another service provider. This "boots-on-the-ground" hard work is amplified significantly by your digital presence, which serves as your 24/7 credentials file for the partners and peers you meet. When a fellow Chamber member or a local partner wants to refer Simple Day to their own high-net-worth clients, they will look to your website and social media to find the professional language, service lists, and visual proof they need to back up their recommendation. By maintaining a strong digital foundation, you ensure that the trust you build in person has a place to live and grow online, making it effortless for the community to advocate for your brand.</p>

			</PageSection>

			<PageSection id="plan-step3-section" className="page-break" columns={1}>

				<h1>Final Thoughts</h1>

				<p>Pixelated Technologies can help you navigate and deliver all these features to enhance your business: a new, modern web site with updated branding, typography, visual elements, and information architecture; search engine and answer engine optimization with deep features that set your business up for success with traditional and modern findability and discoverability; a social media strategy for residential or commercial products and services that differentiate you from your competition; and new digital and traditional advertising options, guiding you step by step, all along the way.  You can think of us as your Virtual Chief Technology Officer and Marketing Agency all rolled into one, creating a technology and advertising strategy, a delivery plan, execute that plan, and gather results and ROI for the efforts.</p>

			</PageSection>

		</>
	);
}


// Load fonts and set CSS variables based on assessment colorPalette
function FontLoader({palette}:{palette: AssessmentData['colorPalette']}){
	useEffect(()=>{
		const header = typeof palette.headerFont === 'string' ? palette.headerFont : palette.headerFont?.name;
		const body = typeof palette.bodyFont === 'string' ? palette.bodyFont : palette.bodyFont?.name;
		const families: string[] = [];
		if(header) families.push(header);
		if(body && body !== header) families.push(body);

		if(families.length){
			const url = generateGoogleFontsUrl(families);
			if(url){
				// inject link tags
				const pre1 = document.createElement('link');
				pre1.rel = 'preconnect';
				pre1.href = 'https://fonts.googleapis.com';
				document.head.appendChild(pre1);
				const pre2 = document.createElement('link');
				pre2.rel = 'preconnect';
				pre2.href = 'https://fonts.gstatic.com';
				pre2.crossOrigin = '';
				document.head.appendChild(pre2);
				const link = document.createElement('link');
				link.rel = 'stylesheet';
				link.href = url;
				document.head.appendChild(link);
				// set CSS vars
				document.documentElement.style.setProperty('--header-font', header || '');
				document.documentElement.style.setProperty('--body-font', body || '');
			}
		}
	}, [palette]);
	return null;
}
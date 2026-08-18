"use client";

import React from "react";
import { PageSection, PageTitleHeader, PageSectionHeader, usePixelatedConfig } from "@pixelated-tech/components";

export default function TermsPage() {
	const config = usePixelatedConfig();
	const siteInfo = config?.siteInfo ?? {};
	const legalEntityName = siteInfo.name ?? 'GEA Construction';
	const primaryEmail = siteInfo.email ?? '';
	const corporateAddress = siteInfo.address
		? `${siteInfo.address.streetAddress}, ${siteInfo.address.addressLocality}, ${siteInfo.address.addressRegion} ${siteInfo.address.postalCode}`
		: 'Address not available';
	const legalGoverningState = siteInfo.address?.addressRegion ?? 'State not available';

	return (
		<>
			<PageTitleHeader>Terms & Privacy</PageTitleHeader>
			<PageSection columns={1} id="terms-container">
				<div>
					<PageSectionHeader>Terms of Service</PageSectionHeader>
					<p>Welcome to our website. Please read these Terms of Service ("Terms") carefully before using our website, applications, products, or services (collectively, the "Services"). By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to all of these terms, do not use our Services.</p>
					<p>The term "Company," "we," "us," or "our" refers to the owner of the website and provider of the Services whose legal entity name appears in the contact section below.</p>

					<h3>1. Scope of Services & Field Work</h3>
					<p>These Terms govern the general use of our digital platforms and general inquiries.</p>
					<h4>Field Services, Estimations, & Custom Work</h4>
					<p>For field-based, physical, or custom projects and services:</p>
					<p>All project scopes, physical property access, timelines, and payment structures are strictly governed by individual, executed written estimates, contracts, or agreements ("Service Contracts").</p>
					<p>In the event of a conflict between these general website Terms and a specific, signed Service Contract, the terms of the signed Service Contract shall take complete precedence.</p>

					<h3>2. Intellectual Property Rights</h3>
					<p>The Services and their entire digital contents, features, and functionality (including but not limited to all source code, software, design layouts, graphics, text, images, and branding) are owned by the Company, its licensors, or other providers and are protected by copyright, trademark, patent, and other intellectual property laws.</p>
					<p>You are granted a limited, non-exclusive, non-transferable license to access our platform for informational purposes. You must not reproduce, distribute, modify, create derivative works of, or commercially exploit any content without our prior written consent.</p>
					<p>For client projects developed by our digital agencies: Intellectual property ownership transfer of final custom assets is governed strictly by the client's individual Service Contract.</p>

					<h3>3. Account Security & Prohibited Conduct</h3>
					<p>If any part of our platform requires account creation, you are responsible for maintaining credential confidentiality. You agree not to:</p>
					<ul>
						<li>Use the Services for any unlawful purpose or to violate local, state, or federal regulations.</li>
						<li>Interfere with, damage, disrupt, or hack any parts of the platform or associated servers.</li>
						<li>Use automated scrapers, bots, or spiders to extract data from our platform without permission.</li>
					</ul>

					<h3>4. Payment, Billing, & Returns</h3>
					<p>You agree to provide valid billing and payment information for all purchases, orders, or service deposits. All sales are processed securely through authorized third-party payment processors.</p>
					<p><strong>Digital or Physical Goods:</strong> Purchases made directly on this site are subject to our specific return, exchange, or cancellation policies explicitly stated at the checkout point.</p>
					<p><strong>Service Deposits:</strong> Retainers, project milestones, or deposits for physical or specialized work are non-refundable unless otherwise specified in your signed Service Contract.</p>

					<h3>5. Disclaimer of Warranties</h3>
					<p>THE SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. THE COMPANY DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT DIGITAL PLATFORMS WILL BE UNINTERRUPTED, SECURE, OR COMPLETELY ERROR-FREE.</p>

					<h3>6. Limitation of Liability</h3>
					<p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE COMPANY, ITS AFFILIATES, OR CONTRACTORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES (INCLUDING LOSS OF PROFITS, DATA, PROPERTY DAMAGE, OR BUSINESS INTERRUPTION) ARISING OUT OF YOUR USE OF THE SERVICES.</p>
					<p>FOR FIELD-BASED ON-SITE CONTRACTING OR FABRICATION WORK, GENERAL LIABILITY IN RELATION TO PHYSICAL PROPERTY DAMAGE OR PERFORMANCE IS STRICTLY LIMITED TO THE ACCORDED COVERAGE MAXIMUMS UNDER THE COMPANY’S ACTIVE COMMERCIAL LIABILITY INSURANCE POLICIES AND THE EXPLICIT LIMITS SET IN THE APPLICABLE SERVICE CONTRACT.</p>

					<h3>7. Governing Law and Jurisdiction</h3>
					<p>These Terms shall be governed by and construed in accordance with the laws of the operating state designated in the company information block below, without giving effect to conflict of law principles. Any legal suit or proceeding must be instituted exclusively in the applicable courts of that jurisdiction.</p>

					<h3>8. Changes to Terms</h3>
					<p>We reserve the right to modify these Terms at any time. We will indicate revisions by updating the "Last Updated" date at the top of this page. Your continued use of the platform constitutes your acceptance of the updated terms.</p>

				</div>
			</PageSection>

			<PageSection columns={1} id="privacy-container">
				<div>
					<PageSectionHeader>Privacy Policy</PageSectionHeader>
					<p>We respect your privacy and are committed to protecting the personal data you share with us. This policy outlines how we handle data across our digital spaces and physical client intake streams.</p>

					<h3>1. Information We Collect</h3>
					<p>We collect several types of data depending on how you interact with our brand:</p>

					<h4>Voluntarily Provided Data</h4>
					<p>Contact information (Name, phone number, email address, physical property/mailing address).</p>
					<p>Project requests, site measurements, custom specifications, blueprints, or asset files.</p>
					<p>Financial and billing data (processed directly and securely through PCI-compliant third-party gateways like Stripe, Square, or Quickbooks; we do not store raw credit card numbers on our servers).</p>

					<h4>Automatically Collected Data</h4>
					<p>Technical log data (IP address, browser type, device information, operating system).</p>
					<p>Tracking cookies and analytics metrics to study platform traffic, optimize user experiences, and coordinate targeted local advertising pixels. You can manage or disable cookie preferences directly inside your web browser.</p>

					<h3>2. How We Use Your Information</h3>
					<p>We leverage data strictly for legitimate operational purposes, including to:</p>

					<ul>
						<li>Generate project estimates, schedule site visits, deliver physical/digital services, and complete invoices.</li>
						<li>Provide ongoing, high-touch customer support.</li>
						<li>Coordinate local or regional marketing, email newsletters, and seasonal promotion notifications (which you may opt out of instantly at any time via the "unsubscribe" link).</li>
						<li>Safeguard against fraudulent transactions and ensure technical platform security.</li>
						<li>Comply with state, federal, or industry legal requirements.</li>
					</ul>

					<h3>3. Disclosing and Sharing Your Information</h3>
					<p>We hold a strict policy: we do not sell your personal data. We only share data under these restrictive circumstances:</p>

					<h4>To Trusted Service Providers</h4>
					<p>Third-party vendors or subcontractors who assist us in operating our software, processing credit cards, or delivering on-site materials (e.g., material suppliers, shipping couriers, cloud hosts).</p>

					<h4>For Legal and Safety Compliance</h4>
					<p>When required by law, subpoena, or government authority, or to protect the safety, rights, and property of our team, clients, or the general public.</p>

					<h4>Business Assets</h4>
					<p>In connection with any business merger, structural acquisition, or sale of company assets.</p>

					<h3>4. Data Security & Retention</h3>
					<p>We enforce appropriate technical and physical security frameworks built to block unauthorized data access, leakage, or loss. Your personal data is kept only as long as necessary to fulfill active business operations, manage long-term warranties, or satisfy regional tax and legal compliance frameworks.</p>

					<h3>5. Your Privacy Choices & Regional Rights</h3>
					<p>Depending on your geographic region, you may possess distinct legal privileges over your personal data under frameworks such as CCPA or state-level privacy initiatives. These can include the right to access, update, or request the deletion of your personal metrics. Please reach out to us using the contact details below to initiate a request.</p>

					<h3>6. Updates to This Policy</h3>
					<p>We will occasionally update this Privacy Policy to reflect changing digital laws or shifting corporate operations. Changes take effect instantly upon being published to this URL.</p>

					<h3>Brand & Entity Contact Details</h3>
					<p>To establish explicit context for this policy, please cross-reference the corresponding business details below for the brand you are interacting with:</p>

					<p>
						Legal Entity Name: {legalEntityName}<br />
						Primary Contact Email: {primaryEmail}<br />
						Corporate / Yard Address: {corporateAddress}<br />
						Active Legal Governing State: {legalGoverningState}
					</p>
				</div>
			</PageSection>
		</>
	);
}

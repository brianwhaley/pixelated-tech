'use client';

import { useEffect, useState } from 'react';
import { PageSection, smartFetch, useFileData } from '@pixelated-tech/components';
import { SmartImage } from '@pixelated-tech/components';
import './proposal.css';

type ProposalData = {
	proposalType: string;
	date: string;
	companyName: string;
	companyContact: string;
	address: { streetAddress: string; addressLocality: string; addressRegion: string; postalCode: string };
    email?: string;
	phone?: string;
	goal: string[];
	deliverables: string[];
	features: { feature: string; description: string[] }[];
	milestones: { date: string; milestone: string }[];
	startDate?: string;
	paymentTotal: { 
        amount: number; 
        isDiscounted: boolean; 
        description: string[] 
    };
};

interface ProposalManifest { files: string[] }

function renderList(items: string[]) {
	return (
		<ul>
			{items.map((item, index) => (
				<li key={index}>{item}</li>
			))}
		</ul>
	);
}

export default function ProposalPage() {
	const { data: manifest, loading: manifestLoading, error: manifestError } = useFileData('/data/proposal/manifest.json', 'json');
	const manifestData = (manifest as unknown) as ProposalManifest | undefined;
	const [selectedFile, setSelectedFile] = useState<string | null>(null);
	const [proposal, setProposal] = useState<ProposalData | null>(null);

	useEffect(() => {
		if (!selectedFile && manifestData?.files?.length) {
			setSelectedFile(manifestData.files[0]);
		}
	}, [manifestData, selectedFile]);

	useEffect(() => {
		if (!selectedFile) {
			setProposal(null);
			return;
		}
		const fetchProposal = async () => {
			setProposal(null);
			try {
				const data = await smartFetch(`/data/proposal/${selectedFile}`, {
					responseType: 'json',
				});
				setProposal(data as ProposalData);
			} catch (err) {
				console.error('Error fetching proposal data:', err);
			}
		};
		fetchProposal();
	}, [selectedFile]);

	useEffect(() => {
		const preconnect1 = document.createElement('link');
		preconnect1.rel = 'preconnect';
		preconnect1.href = 'https://fonts.googleapis.com';

		const preconnect2 = document.createElement('link');
		preconnect2.rel = 'preconnect';
		preconnect2.href = 'https://fonts.gstatic.com';
		preconnect2.crossOrigin = 'anonymous';

		const stylesheet = document.createElement('link');
		stylesheet.rel = 'stylesheet';
		// stylesheet.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script&display=swap';
		stylesheet.href = 'https://fonts.googleapis.com/css2?family=Seaweed+Script&display=swap';

		document.head.append(preconnect1, preconnect2, stylesheet);

		return () => {
			preconnect1.remove();
			preconnect2.remove();
			stylesheet.remove();
		};
	}, []);

	return (
		<>
			<PageSection id="selection-section" className="no-print" columns={1} maxWidth="1024px">
				<div className="proposal-select-wrap print-hidden">
					{manifestLoading && <div>Loading manifest list...</div>}
					{manifestError && <div className="assessment-error">Error loading proposal manifest: {manifestError}</div>}
					{!manifestLoading && !manifestError && manifestData?.files?.length ? (
						<label className="assessment-select-label">
            Choose proposal JSON:
							<select value={selectedFile ?? ''} onChange={(event) => setSelectedFile(event.target.value)}>
								{manifestData.files.map((file: string) => (
									<option key={file} value={file}>{file.replace(/\.[^.]+$/, '')}</option>
								))}
							</select>
						</label>
					) : null}
				</div>
			</PageSection>
			{proposal && <Proposal proposal={proposal} />}
		</>
	);
}



function Proposal(props: { proposal: ProposalData }) {
	const {proposal} = props;
	let sectionCounter = 0;
	const initialDeposit = 0.25; // 25%
	const milestonesCount = Math.max(1, proposal.milestones.length);
	const milestonePercent = Math.floor(((1 - initialDeposit) * 100 / milestonesCount) / 5) * 5; // rounded down to nearest 5%
	const milestonePayment = milestonePercent / 100; // decimal per milestone
	const lastMilestonePayment = 1 - initialDeposit - (milestonePayment * (milestonesCount - 1)); // remaining percentage for last milestone


	return (
		<>
			<PageSection id="title-section" columns={1} maxWidth="1024px">
				<div className="assessment-page-header">
					<SmartImage 
						src="/images/pixelated-logo-v2.png"
						alt="Pixelated Technologies"
						title="Pixelated Technologies"
						aboveFold={true}
					/>
					<h1>Proposal - {proposal.proposalType}</h1>
					<br />
					<p>{new Date(proposal.date).toLocaleDateString()}</p>
					<br />
					<SmartImage 
						src="/images/pexels-fauxels-3184292-sm.jpg"
						alt="Pixelated Technologies Assessment"
						title="Pixelated Technologies Assessment"
						aboveFold={true}
					/>
					<br /><br />
					<h2>FOR: {proposal.companyName}</h2>
					{proposal.companyContact}<br />
					{proposal.address.streetAddress}, {proposal.address.addressLocality}, {proposal.address.addressRegion} {proposal.address.postalCode}<br />
					{proposal.email}<br />
					{proposal.phone}<br />
				</div>
			</PageSection>

			<PageSection id="proposal-parties-section" className="page-break" columns={1} maxWidth="1024px">
				<h2>{sectionCounter+=1}. PARTIES</h2>
				<ul>
					<li>Client: {proposal.companyContact}, Individually and on behalf of {proposal.companyName}</li>
					<li>Developer: Brian Whaley for Pixelated Technologies</li>
					<li>Effective Date: {new Date(proposal.date).toLocaleDateString()}</li>
				</ul>

			</PageSection>

			<PageSection id="proposal-deliverables-section" columns={1} maxWidth="1024px">
				<h2>{sectionCounter+=1}. PROJECT SCOPE & DELIVERABLES</h2>
				<div className="no-break">
					<h3>Goal:</h3>
					{renderList(proposal.goal)}
				</div>
				<div className="no-break">
					<h3>Deliverables:</h3>
					{renderList(proposal.deliverables)}
				</div>
				<div className="no-break">
					<h3>Key Business Features:</h3>
					<table>
						<thead><tr><th>Feature</th>
							<th>Description</th></tr></thead>
						<tbody>
							{proposal.features.map((feature, index) => (
								<tr key={index}>
									<td>{feature.feature}</td>
									<td><ul>{feature.description.map((desc: string, i: number) => (
										<li key={i}>{desc}</li>
									))}</ul></td>
								</tr>
							))}
							{proposal.proposalType == "Monthly Maintenance" && (
								<tr>
									<td colSpan={2} style={{ fontSize: '0.9rem', fontWeight: 'bold', fontStyle: 'italic' }}>Note:
										<ul>
											<li>The GROWTH Package includes all features from the ESSENTIAL and GROWTH features.</li>
											<li>The PREMIUM Package includes all features from the ESSENTIAL and PREMIUM features.</li>
										</ul>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</PageSection>

			<PageSection id="proposal-milestones-section" className="no-break" columns={1} maxWidth="1024px">
				<h2>{sectionCounter+=1}. TIMELINE & MILESTONES</h2>
				<ul>
					<li>Start Date: {proposal.startDate} or date of signature, whichever is soonest</li>
					{proposal.milestones.map((milestone, index) => (
						<li key={index}>Milestone {index + 1} - {milestone.date} - {milestone.milestone}</li>
					))}
				</ul>
			</PageSection>

			<PageSection id="proposal-payment-section" className="no-break" columns={1} maxWidth="1024px">
				<h2>{sectionCounter+=1}. PAYMENT TERMS</h2>
				<h3>Total Fee: 
					${proposal.paymentTotal.amount.toLocaleString()}{proposal.proposalType == "Monthly Maintenance" && " monthly"}{ proposal.paymentTotal.isDiscounted && " (Discounted)"}
				</h3>
				<ul>
					{proposal.paymentTotal.description.map((desc: string, index: number) => (
						<li key={index}>{desc}</li>
					))}
				</ul>
				<h3>Payment Schedule:</h3>
				<ul>
					{proposal.proposalType == "Web Site Build" && (
						<>
							<li>Initial Deposit: {(initialDeposit * 100).toFixed(0)}% due upon signing.</li>
							<li>Additional payments of {(milestonePayment * 100).toFixed(0)}% due on completions of each Milestone.</li>
							<li>The final Milestone payments will be {(lastMilestonePayment * 100).toFixed(0)}%, due on completions of the final Milestone.</li>
						</>
					)}
					<>
						<li>Invoices will be issued on the first business day of each month for services rendered during the preceding month. </li>
						<li>Payment is due within 5 business days of the receipt of invoice.</li>
						<li>In the event of default, Client responsible for all collection costs and attorney fees.</li>
						<li>Payments requested to be made via Zelle.  Account information is brian@pixelated.tech or 973-710-8008.</li>
					</>
				</ul>
			</PageSection>

			<PageSection id="proposal-revisions-section" className="no-break" columns={1} maxWidth="1024px">
				<h2>{sectionCounter+=1}. REVISIONS & CHANGES</h2>
				<ul>
					<li>Client is entitled to two rounds of revisions per milestone.</li>
					<li>Additional changes outside scope billed at $100/hour.</li>
				</ul>
			</PageSection>

			<PageSection id="proposal-ownership-section" className="no-break" columns={1} maxWidth="1024px">
				<h2>{sectionCounter+=1}. OWNERSHIP, COPYRIGHT & CLIENT COOPERATION</h2>
				<p>Upon full payment, Client owns final website, content, and code.  Developer retains rights to pre-existing tools and component libraries.  Client responsible for providing necessary materials and content to build the website (e.g. company logo, contact information, social media profiles, testimonials, product/service descriptions, staff profiles, customer lists, etc.) within two weeks of request.  Client shall approve development version of the site before going live (including design, information architecture, and content).</p>
			</PageSection>

			<PageSection id="proposal-liability-section" className="no-break" columns={1} maxWidth="1024px">
				<h2>{sectionCounter+=1}. LIMITATION OF LIABILITY</h2>
				<p>Pixelated Technologies shall not be responsible for any indirect, incidental, special, consequential, or punitive damages for loss of profits, loss of data, loss of use, or cost of alternative procurements, with respect to this agreement, whether in contract, tort, or otherwise.</p>
			</PageSection>

			<PageSection id="proposal-confidentiality-section" className="no-break" columns={1} maxWidth="1024px">
				<h2>{sectionCounter+=1}. CONFIDENTIALITY</h2>
				<p>Both parties agree to keep project details, client information, and proprietary data confidential.</p>
			</PageSection>

			<PageSection id="proposal-termination-section" className="no-break" columns={1} maxWidth="1024px">
				<h2>{sectionCounter+=1}. TERMINATION</h2>
				<p>Either party can terminate with 5 days written notice. All work completed up to termination is billed based upon completed or partially completed milestones above. Any disputes shall be resolved under New Jersey state law.</p>
			</PageSection>

			<PageSection id="proposal-parties-section" className="no-break" columns={1} maxWidth="1024px">
				<h2>{sectionCounter+=1}. SIGNATURES</h2>
				<br />
				<p>Client: __________________________________________________ Date: ______________<br/>
					{proposal.companyContact}, Individually and on behalf of {proposal.companyName}</p>
				<br />
				<p>Developer: ____<span className="signature">Brian T. Whaley</span>____________ Date: __<span className="signature-date">{new Date().toLocaleDateString()}</span>__<br/>
				Brian Whaley for Pixelated Technologies</p>
			</PageSection>

		</>
	);
}


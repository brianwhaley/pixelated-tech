'use client';

import React, { useState, useEffect } from 'react';
import { SiteConfig, Subscriptions, PaymentInfo, InvoiceData, GeneratedInvoiceResult, BlogPostBilling, SocialReferrerBilling } from './billing.types';
import { smartFetch } from '../../foundation/smartfetch';
import { ToggleLoading } from '../../foundation/loading';
import InvoiceView from './billing.invoice.components';
import { loadBillingConfigData } from './billing.server';
import './billing.css';

export const BillingDashboard: React.FC = () => {
	const [sites, setSites] = useState<SiteConfig[]>([]);
	const [subscriptions, setSubscriptions] = useState<Subscriptions>({});
	const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({ method: '', details: '', terms: '' });
	const [loading, setLoading] = useState(true);

	// Selection state
	const today = new Date();
	const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
	const [selectedYear, setSelectedYear] = useState<number>(prevMonth.getFullYear());
	const [selectedMonth, setSelectedMonth] = useState<number>(prevMonth.getMonth() + 1); // 1-indexed

	const [selectedSites, setSelectedSites] = useState<{ [siteName: string]: boolean }>({});
	const [generating, setGenerating] = useState(false);
	const [generatedInvoices, setGeneratedInvoices] = useState<GeneratedInvoiceResult[]>([]);
	
	// Email state
	const [selectedForEmail, setSelectedForEmail] = useState<{ [siteName: string]: boolean }>({});
	const [emailing, setEmailing] = useState(false);
	const [emailLogs, setEmailLogs] = useState<string[]>([]);
	const [formCompletions, setFormCompletions] = useState<Array<{ submitAt: string; formName: string; email: string }>>([]);

	// Preview state
	const [previewInvoice, setPreviewInvoice] = useState<{ data: InvoiceData } | null>(null);

	// Load data on mount
	const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

	useEffect(() => {
		async function fetchSites() {
			setLoading(true);
			try {
				const response = await loadBillingConfigData(monthStr);
				setSites(response.sites || []);
				setSubscriptions(response.subscriptions || {});
				setPaymentInfo(response.paymentInfo || { method: '', details: '', terms: '' });
				setFormCompletions(response.formCompletions || []);

				const billableSites = (response.sites as SiteConfig[]).filter(site => !!site.billing);
				const preselected: { [name: string]: boolean } = {};
				billableSites.forEach(s => {
					preselected[s.name] = true;
				});
				setSelectedSites(preselected);
			} catch (error) {
				console.error('Failed to load billable configuration metadata:', error);
			} finally {
				setLoading(false);
			}
		}
		fetchSites();
	}, [monthStr]);

	const billableSites = sites.filter(site => !!site.billing);

	const handleSiteCheckboxChange = (name: string) => {
		setSelectedSites(prev => ({
			...prev,
			[name]: !prev[name]
		}));
	};

	const handleSelectAllSites = (checked: boolean) => {
		const updated: { [name: string]: boolean } = {};
		billableSites.forEach(s => {
			updated[s.name] = checked;
		});
		setSelectedSites(updated);
	};

	// Triggers absolute compile + static mock PDF saving on the backend API
	const handleGenerateInvoices = async () => {
		setGenerating(true);
		setGeneratedInvoices([]);
		setEmailLogs([]);
		
		const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
		const selectedList = billableSites.filter(s => !!selectedSites[s.name]);

		if (selectedList.length === 0) {
			alert('Please select at least one site to generate an invoice.');
			setGenerating(false);
			return;
		}

		try {
			// Call the generation backend endpoint
			const response = await smartFetch('/api/billing/generate', {
				timeout: 90000, // Extend timeout to 90 seconds (since Puppeteer launches & renders takes longer than the default 10s)
				requestInit: {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						sites: selectedList.map(s => s.name),
						billingMonth: monthStr
					})
				}
			});

			if (response && response.success && Array.isArray(response.results)) {
				setGeneratedInvoices(response.results);
				
				// Automatically select all successfully generated files for email dispatch by default
				const emailSelections: { [name: string]: boolean } = {};
				response.results.forEach((inv: GeneratedInvoiceResult) => {
					if (inv.success) {
						emailSelections[inv.siteName] = true;
					}
				});
				setSelectedForEmail(emailSelections);
			} else {
				throw new Error(response?.message || 'Invalid API generation response structure');
			}
		} catch (error) {
			console.error('Invoices generation failed:', error);
			alert(`Generation failed: ${(error as Error).message}`);
		} finally {
			setGenerating(false);
		}
	};

	const handleEmailCheckboxChange = (name: string) => {
		setSelectedForEmail(prev => ({
			...prev,
			[name]: !prev[name]
		}));
	};

	const handleSelectAllEmails = (checked: boolean) => {
		const updated: { [name: string]: boolean } = {};
		generatedInvoices.forEach(inv => {
			if (inv.success) {
				updated[inv.siteName] = checked;
			}
		});
		setSelectedForEmail(updated);
	};

	const handleSendEmails = async () => {
		setEmailing(true);
		setEmailLogs([]);
		const targets = generatedInvoices.filter(inv => inv.success && !!selectedForEmail[inv.siteName]);

		if (targets.length === 0) {
			alert('Please select at least one invoice to email.');
			setEmailing(false);
			return;
		}

		try {
			const response = await smartFetch('/api/billing/email', {
				timeout: 60000, // Extend timeout to 60 seconds (since SMTP dispatching takes longer than the default 10s)
				requestInit: {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						invoices: targets.map(t => ({
							siteName: t.siteName,
							pdfPath: t.pdfPath,
							email: t.email
						}))
					})
				}
			});

			if (response && response.success && Array.isArray(response.logs)) {
				setEmailLogs(response.logs);
			} else {
				throw new Error(response?.message || 'Invalid response from mailing API');
			}
		} catch (error) {
			console.error('Email dispatch failed:', error);
			alert(`Email dispatch failed: ${(error as Error).message}`);
		} finally {
			setEmailing(false);
		}
	};

	const handlePreviewInvoice = async (siteName: string) => {
		const site = sites.find(s => s.name === siteName);
		if (!site) return;
		const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
		
		try {
			ToggleLoading({ show: true });
			// Request live/mock data from the backend simulation or wp.com so that preview matches real PDF closely
			const statsResponse = await smartFetch('/api/billing/generate', {
				timeout: 90000,
				requestInit: {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						sites: [siteName],
						billingMonth: monthStr,
						previewOnly: true // Custom flag could be handled by the route, or we can just fetch the raw items here
					})
				}
			});
			
			// For preview, we just use the raw compiled invoice data if returned, otherwise fallback to basic compilation
			let compiled = null;
			if (statsResponse && Array.isArray(statsResponse.results) && statsResponse.results[0]?.invoiceData) {
				compiled = statsResponse.results[0].invoiceData;
			} else {
				throw new Error("Unable to preview invoice: backend API did not return compiled data.");
			}
			setPreviewInvoice({ data: compiled });
		} catch (e) {
			console.error("Preview failed to fetch live data:", e);
			alert(`Preview failed: ${(e as Error).message}`);
		} finally {
			ToggleLoading({ show: false });
		}
	};

	if (loading) {
		return <div className="billing-loading-msg">Loading billing metadata details...</div>;
	}

	if (previewInvoice) {
		return <InvoiceView invoice={previewInvoice.data} onBack={() => setPreviewInvoice(null)} />;
	}

	const allSitesChecked = billableSites.length > 0 && billableSites.every(s => !!selectedSites[s.name]);
	const someSitesChecked = billableSites.some(s => !!selectedSites[s.name]) && !allSitesChecked;

	const allEmailsChecked = generatedInvoices.length > 0 && generatedInvoices.every(inv => !inv.success || !!selectedForEmail[inv.siteName]);
	const someEmailsChecked = generatedInvoices.some(inv => inv.success && !!selectedForEmail[inv.siteName]) && !allEmailsChecked;

	return (
		<div className="billing-dashboard-wrapper">
			
			{/* Controls and Calendar selection */}
			<div className="billing-control-card">
				<h3>1. Select Billing Period & Billable Accounts</h3>
				
				<div className="billing-date-selectors">
					<div>
						<label htmlFor="billing-month">Month</label>
						<select 
							id="billing-month"
							value={selectedMonth} 
							onChange={(e) => { setSelectedMonth(Number(e.target.value)); setGeneratedInvoices([]); }}
						>
							<option value={1}>January</option>
							<option value={2}>February</option>
							<option value={3}>March</option>
							<option value={4}>April</option>
							<option value={5}>May</option>
							<option value={6}>June</option>
							<option value={7}>July</option>
							<option value={8}>August</option>
							<option value={9}>September</option>
							<option value={10}>October</option>
							<option value={11}>November</option>
							<option value={12}>December</option>
						</select>
					</div>

					<div>
						<label htmlFor="billing-year">Year</label>
						<input 
							id="billing-year"
							type="number" 
							value={selectedYear}
							onChange={(e) => { setSelectedYear(Number(e.target.value)); setGeneratedInvoices([]); }}
						/>
					</div>
				</div>

				{/* Sites table list */}
				{billableSites.length === 0 ? (
					<div className="billing-error-msg">No billable sites configured in sites.json. Add billing structures to sites.json first.</div>
				) : (
					<div className="billing-table-container">
						<table className="billing-table">
							<thead>
								<tr>
									<th className="checkbox-col">
										<input 
											type="checkbox"
											checked={allSitesChecked}
											ref={el => { if (el) el.indeterminate = someSitesChecked; }}
											onChange={(e) => handleSelectAllSites(e.target.checked)}
										/>
									</th>
									<th>Site Project</th>
									<th>Billing Tier</th>
									<th>Client Contact Info</th>
									<th className="right-align">Action</th>
								</tr>
							</thead>
							<tbody>
								{billableSites.map(site => {
									const isChecked = !!selectedSites[site.name];
									const tierName = site.billing!.tier;
									let normalizedTier = tierName.toLowerCase();
									if (normalizedTier === 'premier') normalizedTier = 'premium';
									if (normalizedTier === 'standard') normalizedTier = 'growth';

									const subPrice = (subscriptions[normalizedTier] || subscriptions[tierName])?.price || 0;
									const finalPrice = site.billing!.priceOverride !== undefined 
										? site.billing!.priceOverride 
										: (site.billing!.price !== undefined ? site.billing!.price : subPrice);

									return (
										<tr key={site.name} className="hover-row">
											<td className="checkbox-col">
												<input 
													type="checkbox"
													checked={isChecked}
													onChange={() => handleSiteCheckboxChange(site.name)}
												/>
											</td>
											<td className="site-project-col">
												<div className="company-name">{site.billing!.companyName}</div>
												<div className="site-details">{site.name} ({site.url})</div>
											</td>
											<td className="billing-tier-col">
												<span className="tier-badge">{site.billing!.tier}</span>
												<span className="tier-price">${finalPrice.toFixed(2)}/mo</span>
											</td>
											<td className="client-contact-col">
												<div>{site.billing!.email}</div>
												<div className="client-address">{site.billing!.address}</div>
											</td>
											<td className="right-align">
												<button
													onClick={() => handlePreviewInvoice(site.name)}
													className="interactive-preview-btn"
												>
													Interactive Preview
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}

				<button
					onClick={handleGenerateInvoices}
					disabled={generating || billableSites.length === 0}
					className="generate-invoices-btn"
				>
					{generating ? 'Generating High-Fidelity Invoices...' : 'Generate Invoices'}
				</button>
			</div>

			{/* Review & PDF links panel */}
			{generatedInvoices.length > 0 && (
				<div className="billing-control-card">
					<h3>2. Review Generated PDF Invoices</h3>
					
					<div className="billing-table-container">
						<table className="billing-table">
							<thead>
								<tr>
									<th className="checkbox-col">
										<input 
											type="checkbox"
											checked={allEmailsChecked}
											ref={el => { if (el) el.indeterminate = someEmailsChecked; }}
											onChange={(e) => handleSelectAllEmails(e.target.checked)}
										/>
									</th>
									<th>Client</th>
									<th>PDF Document Link</th>
									<th>Target Billing Email</th>
									<th className="right-align">Status</th>
								</tr>
							</thead>
							<tbody>
								{generatedInvoices.map(inv => {
									const isSelected = !!selectedForEmail[inv.siteName];
									
									return (
										<tr key={inv.siteName} className="hover-row">
											<td className="checkbox-col">
												<input 
													type="checkbox"
													disabled={!inv.success}
													checked={inv.success && isSelected}
													onChange={() => handleEmailCheckboxChange(inv.siteName)}
												/>
											</td>
											<td className="site-project-col">
												{inv.siteName}
											</td>
											<td className="pdf-link-col">
												{inv.success ? (
													<a 
														href={inv.pdfPath} 
														target="_blank" 
														rel="noopener noreferrer"
														className="pdf-link-anchor"
													>
														📄 View Generated PDF File
													</a>
												) : (
													<span className="generation-failed-msg">Generation Failed</span>
												)}
											</td>
											<td className="client-contact-col">
												{inv.email}
											</td>
											<td className={`status-col ${inv.success ? 'status-ready' : 'status-error'}`}>
												{inv.success ? '✓ Ready' : '❌ Error'}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					<button
						onClick={handleSendEmails}
						disabled={emailing || generatedInvoices.filter(i => i.success && !!selectedForEmail[i.siteName]).length === 0}
						className="email-invoices-btn"
					>
						{emailing ? 'Emailing Invoices...' : 'Email Invoices'}
					</button>
				</div>
			)}

			{/* Email Output Logs Panel */}
			{emailLogs.length > 0 && (
				<div className="billing-control-card" style={{ backgroundColor: '#1e293b', border: '1px solid #0f172a', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
					<h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#f1f5f9', letterSpacing: '0.5px' }}>Email Dispatch logs</h3>
					<div style={{ backgroundColor: '#0f172a', borderRadius: '6px', padding: '16px', overflowX: 'auto', maxHeight: '300px' }}>
						{emailLogs.map((log, index) => (
							<div key={index} style={{ fontFamily: 'monospace', fontSize: '13px', color: '#38bdf8', marginBottom: '8px', lineHeight: '1.5' }}>
								{log}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};
export default BillingDashboard;

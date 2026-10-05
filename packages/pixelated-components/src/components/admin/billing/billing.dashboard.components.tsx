'use client';

import React, { useState, useEffect } from 'react';
import { SiteConfig, Subscriptions, PaymentInfo, InvoiceData, GeneratedInvoiceResult, BlogPostBilling, SocialReferrerBilling } from './billing.types';
import { ToggleLoading } from '../../foundation/loading';
import InvoiceTemplate from './billing.invoice.components';
import { dispatchInvoiceEmails, generateAdHocInvoice, generateInvoicePdfsForSites, loadAdHocBillingConfigData, loadBillingConfigData } from './billing.server';
import './billing.css';

export const MonthlyBillingDashboard: React.FC = () => {
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

				const billableSites = (response.sites as SiteConfig[]).filter(site => !!site.monthlyBilling);
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

	const billableSites = sites.filter(site => !!site.monthlyBilling);

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
			const results = await generateInvoicePdfsForSites(selectedList.map((site) => site.name), monthStr);
			if (Array.isArray(results)) {
				setGeneratedInvoices(results);
				
				// Automatically select all successfully generated files for email dispatch by default
				const emailSelections: { [name: string]: boolean } = {};
				results.forEach((inv: GeneratedInvoiceResult) => {
					if (inv.success) {
						emailSelections[inv.siteName] = true;
					}
				});
				setSelectedForEmail(emailSelections);
			} else {
				throw new Error('Invalid invoice generation response structure');
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
			const logs = await dispatchInvoiceEmails(targets.map((target) => ({
				siteName: target.siteName,
				pdfPath: target.pdfPath,
				email: target.email,
			})));
			if (Array.isArray(logs)) {
				setEmailLogs(logs);
			} else {
				throw new Error('Invalid response from mailing action');
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
			const results = await generateInvoicePdfsForSites([siteName], monthStr, true);
			if (results[0]?.invoiceData) {
				setPreviewInvoice({ data: results[0].invoiceData });
			} else {
				throw new Error('Unable to preview invoice: billing action did not return compiled data.');
			}
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
		return <InvoiceTemplate invoice={previewInvoice.data} onBack={() => setPreviewInvoice(null)} />;
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
									const tierName = site.monthlyBilling!.tier;
									let normalizedTier = tierName.toLowerCase();
									if (normalizedTier === 'premier') normalizedTier = 'premium';
									if (normalizedTier === 'standard') normalizedTier = 'growth';

									const subPrice = (subscriptions[normalizedTier] || subscriptions[tierName])?.price || 0;
									const finalPrice = site.monthlyBilling!.priceOverride !== undefined
										? site.monthlyBilling!.priceOverride
										: (site.monthlyBilling!.price !== undefined ? site.monthlyBilling!.price : subPrice);

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
												<div className="company-name">{site.monthlyBilling!.companyName}</div>
												<div className="site-details">{site.name} ({site.url})</div>
											</td>
											<td className="billing-tier-col">
												<span className="tier-badge">{site.monthlyBilling!.tier}</span>
												<span className="tier-price">${finalPrice.toFixed(2)}/mo</span>
											</td>
											<td className="client-contact-col">
												<div>{site.monthlyBilling!.email}</div>
												<div className="client-address">{site.monthlyBilling!.address}</div>
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

export const AdHocBillingDashboard: React.FC = () => {
	const [invoiceNumbers, setInvoiceNumbers] = useState<string[]>([]);
	const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState('');
	const [previewInvoice, setPreviewInvoice] = useState<InvoiceData | null>(null);
	const [loading, setLoading] = useState(true);
	const [working, setWorking] = useState(false);
	const [generatedInvoice, setGeneratedInvoice] = useState<GeneratedInvoiceResult | null>(null);
	const [emailLogs, setEmailLogs] = useState<string[]>([]);
	const [error, setError] = useState('');

	useEffect(() => {
		loadAdHocBillingConfigData()
			.then((data) => {
				setInvoiceNumbers(data.invoiceNumbers);
				setSelectedInvoiceNumber(data.invoiceNumbers[0] || '');
			})
			.catch((loadError) => setError((loadError as Error).message))
			.finally(() => setLoading(false));
	}, []);

	const handleInvoiceChange = (invoiceNumber: string) => {
		setSelectedInvoiceNumber(invoiceNumber);
		setPreviewInvoice(null);
		setGeneratedInvoice(null);
		setEmailLogs([]);
	};

	const handlePreview = async () => {
		if (!selectedInvoiceNumber) return;
		setWorking(true);
		setError('');
		try {
			const response = await generateAdHocInvoice(selectedInvoiceNumber, true);
			setPreviewInvoice(response.invoiceData || null);
		} catch (previewError) {
			setError((previewError as Error).message);
		} finally {
			setWorking(false);
		}
	};

	const handleGeneratePdf = async () => {
		if (!selectedInvoiceNumber) return;
		setWorking(true);
		setError('');
		setGeneratedInvoice(null);
		setEmailLogs([]);
		try {
			const generated = await generateAdHocInvoice(selectedInvoiceNumber);
			setGeneratedInvoice(generated);
		} catch (generationError) {
			setError((generationError as Error).message);
		} finally {
			setWorking(false);
		}
	};

	const handleEmailInvoice = async () => {
		if (!generatedInvoice?.success) return;
		setWorking(true);
		setError('');
		try {
			const logs = await dispatchInvoiceEmails([{
				siteName: generatedInvoice.siteName,
				pdfPath: generatedInvoice.pdfPath,
				email: generatedInvoice.email,
				subject: `Invoice ${selectedInvoiceNumber} for ${generatedInvoice.siteName}`,
				text: `Hi,\n\nPlease find attached invoice ${selectedInvoiceNumber} for ${generatedInvoice.siteName}.\n\nThank you for your business!\n\nBest regards,\nPixelated Technologies`,
			}]);
			setEmailLogs(logs);
		} catch (emailError) {
			setError((emailError as Error).message);
		} finally {
			setWorking(false);
		}
	};

	if (loading) return <div className="billing-loading-msg">Loading ad hoc invoices...</div>;
	if (previewInvoice) return <InvoiceTemplate invoice={previewInvoice} onBack={() => setPreviewInvoice(null)} />;

	return (
		<div className="billing-dashboard-wrapper">
			<div className="billing-control-card">
				<h3>Ad Hoc Invoice</h3>
				<div className="billing-date-selectors">
					<div>
						<label htmlFor="adhoc-invoice">Invoice Number</label>
						<select id="adhoc-invoice" value={selectedInvoiceNumber} onChange={(event) => handleInvoiceChange(event.target.value)}>
							{invoiceNumbers.map((invoiceNumber) => <option key={invoiceNumber} value={invoiceNumber}>{invoiceNumber}</option>)}
						</select>
					</div>
				</div>

				{invoiceNumbers.length === 0 && <div className="billing-error-msg">No ad hoc invoices configured in sites.json.</div>}
				{error && <div className="billing-error-msg">{error}</div>}
				<div>
					<button onClick={handlePreview} disabled={working || !selectedInvoiceNumber}>Preview Invoice</button>
					<button onClick={handleGeneratePdf} disabled={working || !selectedInvoiceNumber} className="generate-invoices-btn">
						{working ? 'Generating PDF...' : 'Generate PDF'}
					</button>
					<button onClick={handleEmailInvoice} disabled={working || !generatedInvoice?.success} className="email-invoices-btn">
						{working ? 'Emailing Invoice...' : 'Email Invoice'}
					</button>
				</div>
				{generatedInvoice?.success && (
					<div className="billing-email-logs">
						<p>PDF: <a href={generatedInvoice.pdfPath} target="_blank" rel="noopener noreferrer">{generatedInvoice.pdfPath}</a></p>
						<p>Email: {generatedInvoice.email}</p>
						{emailLogs.map((log) => <div key={log}>{log}</div>)}
					</div>
				)}
			</div>
		</div>
	);
};

export default MonthlyBillingDashboard;

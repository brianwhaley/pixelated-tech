'use client';

import React from 'react';
import { InvoiceData } from './billing.types';
import { SmartImage } from "../../elements/smartimage";
import { SiteHealthGoogleAnalytics } from '../site-health/site-health-google-analytics';
import { SiteHealthCloudwatch } from '../site-health/site-health-cloudwatch';
import './billing.css';

interface InvoiceViewProps {
	invoice: InvoiceData;
	onBack?: () => void;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({ invoice, onBack }) => {
	// Guard against completely empty or broken invoices
	if (!invoice) return <div data-testid="invoice-error">Invoice data missing</div>;

	const formCompletions = invoice.formCompletions ?? [];
	const shouldRenderAnalytics = !!invoice.ga4PropertyId && invoice.ga4PropertyId !== 'GA4_PROPERTY_ID_HERE';
	const shouldRenderCloudwatch = !!invoice.siteName;
	const invoiceEndDate = (() => {
		const [year, month] = invoice.billingMonth.split('-').map((value) => Number(value));
		return new Date(Date.UTC(year, month, 0)).toISOString().split('T')[0];
	})();

	return (
		<div className="invoice-preview-container" data-testid="invoice-preview-container">
			{onBack && (
				<button onClick={onBack} className="invoice-preview-back-btn" data-testid="back-btn">
					← Back to Invoices List
				</button>
			)}
			
			<div className="invoice-embed-container">
				<div className="invoice-top-container">
					<div className="invoice-top-left">
						<SmartImage 
							src="/images/pixelated-logo-v2.png" 
							alt="Pixelated Technologies" 
							style={{ maxWidth: '300px', display: 'block' }} 
							aboveFold={true}
						/>
						<p>10 Jade Circle, Denville, NJ 07834<br/>payments@pixelated.tech</p>
					</div>
					<div className="invoice-top-right">
						<h2>Invoice</h2>
						<p className="invoice-number">{invoice.invoiceNumber}</p>
						<p className="invoice-dates">
							Date: {invoice.invoiceDate}<br/>
							Due Date: {invoice.dueDate}
						</p>
					</div>
				</div>

				<div className="invoice-bill-to-card">
					<div className="invoice-card-section">
						<h3>Bill To:</h3>
						<p className="company-title">{invoice.companyName}</p>
						<p className="card-details">{invoice.address}</p>
						<p className="card-details"><a href={`mailto:${invoice.email}`} className="card-email">{invoice.email}</a></p>
					</div>
					<div className="invoice-card-section">
						<h3>Project Details:</h3>
						<p className="company-title">{invoice.siteName}</p>
						<p className="card-details"><a href={invoice.siteUrl} target="_blank" rel="noopener noreferrer" className="post-link">{invoice.siteUrl}</a></p>
						<p className="card-details">Billing Cycle: {invoice.billingMonth}</p>
					</div>
				</div>

				<table className="invoice-items-table">
					<thead>
						<tr>
							<th>Description</th>
							<th className="amount-col">Amount</th>
						</tr>
					</thead>
					<tbody>
						{invoice.items.map((item, index) => (
							<tr key={index}>
								{/* Use dangerouslySetInnerHTML for description because it might contain HTML like <ul> */}
								<td dangerouslySetInnerHTML={{ __html: item.description }} />
								<td className="amount-cell">${item.amount.toFixed(2)}</td>
							</tr>
						))}
						<tr className="total-row">
							<td className="total-label">Total Amount Due:</td>
							<td className="total-amount">${invoice.totalOwed.toFixed(2)}</td>
						</tr>
						{invoice.note && (
							<tr className="invoice-note-row">
								<td colSpan={2}>
									<strong>NOTE:</strong>
									{typeof invoice.note === 'string' ? (
										` ${invoice.note}`
									) : (
										<ul className="invoice-note-list" style={{ margin: '8px 0 0 12px', paddingLeft: '18px' }}>
											{invoice.note.map((noteItem, noteIndex) => (
												<li key={noteIndex}>{noteItem}</li>
											))}
										</ul>
									)}
								</td>
							</tr>
						)}
					</tbody>
				</table>

				<div className="invoice-bottom-payment no-break">
					<h4>How To Pay:</h4>
					<p className="payment-details-box">{invoice.paymentInfo.details}</p>
					<p className="payment-terms-italic">{invoice.paymentInfo.terms}</p>
				</div>

				{invoice.enhancements && invoice.enhancements.length > 0 && (
					<div className="invoice-addon-section no-break">
						<h3>Enhancements</h3>
						<ul className="invoice-enhancements-list" style={{ margin: '0 0 16px 0', paddingLeft: '20px', color: '#333' }}>
							{invoice.enhancements.map((enhancement, idx) => (
								<li key={idx} style={{ marginBottom: '6px' }}>{enhancement}</li>
							))}
						</ul>
					</div>
				)}

				{invoice.posts.length > 0 && (
					<div className="invoice-addon-section no-break">
						<h3>Published Content</h3>
						<table className="invoice-addon-table">
							<thead>
								<tr>
									<th>Post Details & Social Syndication Links</th>
									<th>Published Date</th>
									<th className="right-align">Views</th>
								</tr>
							</thead>
							<tbody>
								{invoice.posts.map((post, idx) => (
									<tr key={idx}>
										<td>
											<a href={post.url} target="_blank" rel="noopener noreferrer" className="post-link" style={{ fontWeight: 'bold' }}>{post.title}</a>
											{post.socialLinks && post.socialLinks.length > 0 && (
												<ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', fontSize: '11px', color: '#666', listStyleType: 'circle' }}>
													{post.socialLinks.map((link, lidx) => (
														<li key={lidx}><a href={link} target="_blank" rel="noopener noreferrer" style={{ color: '#666' }}>{link}</a></li>
													))}
												</ul>
											)}
										</td>
										<td className="post-date" style={{ verticalAlign: 'top' }}>{post.date.split('T')[0]}</td>
										<td className="right-align" style={{ verticalAlign: 'top' }}>{post.views > 0 ? post.views.toLocaleString() : ''}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{formCompletions.length > 0 && (
					<div className="invoice-addon-section no-break">
						<h3>Form Completions</h3>
						<table className="invoice-addon-table">
							<thead>
								<tr>
									<th>Submit Date</th>
									<th>Form Name</th>
									<th>Email</th>
								</tr>
							</thead>
							<tbody>
								{formCompletions.map((row, idx) => (
									<tr key={idx}>
										<td>{new Date(row.submitAt).toLocaleString()}</td>
										<td>{row.formName}</td>
										<td>{row.email}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{shouldRenderAnalytics && invoice.siteName && (
					<div className="invoice-addon-section no-break">
						<SiteHealthGoogleAnalytics
							siteName={invoice.siteName}
							startDate={`${invoice.billingMonth}-01`}
							endDate={(() => {
								const [year, month] = invoice.billingMonth.split('-').map((value) => Number(value));
								return new Date(Date.UTC(year, month, 0)).toISOString().split('T')[0];
							})()}
						/>
					</div>
				)}

				{shouldRenderCloudwatch && (
					<div className="invoice-addon-section no-break">
						<SiteHealthCloudwatch
							siteName={invoice.siteName}
							startDate={`${invoice.billingMonth}-01`}
							endDate={invoiceEndDate}
						/>
					</div>
				)}
			</div>
		</div>
	);
};
export default InvoiceView;

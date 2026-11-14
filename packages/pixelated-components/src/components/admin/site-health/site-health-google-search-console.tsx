'use client';

import React from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SiteHealthTemplate } from './site-health-template';

interface SearchConsoleChartDataPoint {
	date: string;
	currentClicks: number;
	previousClicks: number;
}

interface SearchConsoleSummary {
	chartData: SearchConsoleChartDataPoint[];
}

/** Props for the Google Search Console monthly click comparison. */
SiteHealthGoogleSearchConsole.propTypes = {
	/** Site identifier used to fetch Search Console metrics. */
	siteName: PropTypes.string.isRequired,
	/** ISO start date for the current metrics range. */
	startDate: PropTypes.string.isRequired,
	/** ISO end date for the current metrics range. */
	endDate: PropTypes.string.isRequired,
};
export type SiteHealthGoogleSearchConsoleType = InferProps<typeof SiteHealthGoogleSearchConsole.propTypes>;
export function SiteHealthGoogleSearchConsole({ siteName, startDate, endDate }: SiteHealthGoogleSearchConsoleType) {
	return (
		<SiteHealthTemplate<SearchConsoleSummary>
			siteName={siteName}
			title="Google Search Console Clicks"
			endpoint={{
				endpoint: '/api/site-health/google-search-console',
				params: { startDate, endDate },
				responseTransformer: (result) => result.data,
			}}
		>
			{(data) => {
				if (!data) {
					return <div className="health-visualization-placeholder">No Search Console click data available.</div>;
				}

				const validChartData = data.chartData?.filter((point: SearchConsoleChartDataPoint) =>
					point
					&& typeof point.date === 'string'
					&& typeof point.currentClicks === 'number'
					&& typeof point.previousClicks === 'number'
				) || [];
				return (
					<div>
						{validChartData.length > 0 && (
							<div data-testid="search-console-clicks-chart" style={{ width: '100%', height: '400px', border: '1px solid #ddd' }}>
								<ResponsiveContainer width="100%" height="100%">
									<ComposedChart data={validChartData} margin={{ top: 40, right: 30, left: 20, bottom: 5 }}>
										<text x="50%" y={20} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#374151">
											Search Clicks (Current vs Previous Month)
										</text>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
										<YAxis tick={{ fontSize: 12 }} />
										<Tooltip
											formatter={(value, name) => [
												(value as number)?.toLocaleString() || '0',
												name || 'Unknown',
											]}
											labelFormatter={(label: React.ReactNode) => `Date: ${String(label)}`}
										/>
										<Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
										<Bar
											dataKey="currentClicks"
											fill="#3b82f6"
											name="Current Month"
											radius={[2, 2, 0, 0]}
										/>
										<Line
											type="monotone"
											dataKey="previousClicks"
											stroke="#ef4444"
											strokeWidth={2}
											strokeDasharray="5 5"
											dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
											activeDot={{ r: 5, stroke: '#ef4444', strokeWidth: 2 }}
											name="Previous Month"
										/>
									</ComposedChart>
								</ResponsiveContainer>
							</div>
						)}
					</div>
				);
			}}
		</SiteHealthTemplate>
	);
}

"use client";

import React, { useEffect, useState } from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { getContentfulEntriesByType, type ContentfulApiType } from './contentful.delivery';
import { usePixelatedConfig } from '../config/config.client';
import { PageSection } from '../general/semantic';
import './contentful.alert.css';

const debug = false;


/**
 * Component to display alerts fetched from Contentful.
 *
 * @param {ContentfulAlertsType} props - Component props.
 * @returns {JSX.Element | null} The rendered component or null if no alerts are active.
 */
ContentfulAlerts.propTypes = {
	/** Contentful API configuration object. Falls back to usePixelatedConfig if omitted. */
	apiProps: PropTypes.shape({
		proxyURL: PropTypes.string,
		base_url: PropTypes.string,
		space_id: PropTypes.string,
		environment: PropTypes.string,
		delivery_access_token: PropTypes.string,
	}),
	/** Contentful content type ID to query. */
	alertContentType: PropTypes.string,
};
export type ContentfulAlertsType = InferProps<typeof ContentfulAlerts.propTypes>;
export function ContentfulAlerts(props: ContentfulAlertsType) {
	const config = usePixelatedConfig();
	const [alerts, setAlerts] = useState<any[]>([]);

	const apiProps: ContentfulApiType = {
		proxyURL: props.apiProps?.proxyURL ?? config?.contentful?.proxyURL ?? undefined,
		base_url: props.apiProps?.base_url ?? config?.contentful?.base_url ?? '',
		space_id: props.apiProps?.space_id ?? config?.contentful?.space_id ?? '',
		environment: props.apiProps?.environment ?? config?.contentful?.environment ?? '',
		delivery_access_token:
			props.apiProps?.delivery_access_token ?? config?.contentful?.delivery_access_token ?? '',
	};

	const alertContentType = props.alertContentType ?? 'alert';
	const startDateField = 'startDate';
	const endDateField = 'endDate';
	const statusField = 'status';
	const activeStatusValue = 'Active';

	useEffect(() => {
		const fetchAlerts = async () => {
			if (!apiProps.base_url || !apiProps.space_id || !apiProps.environment || !apiProps.delivery_access_token) {
				return;
			}

			try {
				const response: any = await getContentfulEntriesByType({
					apiProps,
					contentType: alertContentType,
				});

				const items = Array.isArray(response?.items) ? response.items : [];
				const now = new Date();

				const activeAlerts = items
					.filter((item: any) => {
						const fields = item?.fields ?? {};
						const statusValue = `${fields[statusField] ?? ''}`.trim();
						if (statusValue.toLowerCase() !== activeStatusValue.toLowerCase()) {
							return false;
						}

						const startValue = fields[startDateField];
						const endValue = fields[endDateField];
						const startDate = startValue ? new Date(startValue) : null;
						const endDate = endValue ? new Date(endValue) : null;

						if (startDate && now < startDate) {
							return false;
						}
						if (endDate && now > endDate) {
							return false;
						}
						return true;
					})
					.sort((a: any, b: any) => {
						const aEnd = a.fields?.[endDateField] ? new Date(a.fields[endDateField]).getTime() : Number.POSITIVE_INFINITY;
						const bEnd = b.fields?.[endDateField] ? new Date(b.fields[endDateField]).getTime() : Number.POSITIVE_INFINITY;
						return aEnd - bEnd;
					});

				setAlerts(activeAlerts);
			} catch (fetchError: any) {
				console.error('ContentfulAlerts fetch error:', fetchError);
			}
		};
		fetchAlerts();
	}, [
		apiProps.base_url,
		apiProps.space_id,
		apiProps.environment,
		apiProps.delivery_access_token,
		alertContentType,
		activeStatusValue,
		startDateField,
		endDateField,
		statusField,
	]);

	if (alerts.length === 0) { return null; }

	return (
		<>
			{alerts.map((alert: any, index: number) => (
				<ContentfulAlert
					key={alert.sys?.id ?? index}
					title={alert.fields?.title ?? ''}
					description={alert.fields?.description ?? ''}
					id={alert.sys?.id ?? `alert-${index}`}
					index={index}
				/>
			))}
		</>
	);
}


/**
 * Component to display a single alert fetched from Contentful.
 *
 * @param {ContentfulAlertType} props - Component props.
 * @returns {JSX.Element} The rendered component.
 */
ContentfulAlert.propTypes = {
	title: PropTypes.string,
	description: PropTypes.string,
	id: PropTypes.string,
	index: PropTypes.number.isRequired,
};
export type ContentfulAlertType = InferProps<typeof ContentfulAlert.propTypes>;
export function ContentfulAlert(props: ContentfulAlertType) {
	const { title, description, id,index } = props;
	return (
		<PageSection columns={1} maxWidth="100%" id={`alerts-${index}-section`}>
			<div className="contentful-alert contentful-alert-active">
				{title && <h3 className="contentful-alert-title">{title}</h3>}
				{description && <div className="contentful-alert-description">{description}</div>}
			</div>
		</PageSection>
	);
}

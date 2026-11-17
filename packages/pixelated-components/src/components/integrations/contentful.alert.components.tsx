"use client";

import React, { useEffect, useState } from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { getContentfulEntriesByType, type getContentfulEntriesByTypeType } from './contentful.delivery';
import type { ContentfulConfig } from '../config/config.types';
import { usePixelatedConfig } from '../config/config.client';
import { PageSection } from '../structure/page-blocks';
import { Modal } from '../elements/modal';
import { CacheManager } from '../foundation/cache-manager';
import './contentful.alert.css';

const debug = false;
const CONTENTFUL_ALERT_DISMISSAL_TTL = 24 * 60 * 60 * 1000;

function getAlertDismissalCache() {
	return new CacheManager({
		domain: 'pixelated',
		namespace: 'contentful-alerts',
		mode: 'session',
	});
}

function getAlertDismissalKey(alertContentType: string, alertId: string) {
	return `${alertContentType}:${alertId}`;
}


/**
 * Component to display alerts fetched from Contentful.
 *
 * @param {ContentfulAlertsType} props - Component props.
 * @returns {JSX.Element | null} The rendered component or null if no alerts are active.
 */
ContentfulAlerts.propTypes = {
	/** Contentful content type ID to query. */
	alertContentType: PropTypes.string,
};
export type ContentfulAlertsType = InferProps<typeof ContentfulAlerts.propTypes>;
export function ContentfulAlerts(props: ContentfulAlertsType) {
	const config = usePixelatedConfig();
	const [alerts, setAlerts] = useState<any[]>([]);
	const [isDismissed, setIsDismissed] = useState(false);
	const contentfulConfig = config?.integrations?.contentful;

	const apiProps: getContentfulEntriesByTypeType['apiProps'] = {
		proxyURL: contentfulConfig?.proxyURL,
		base_url: contentfulConfig?.base_url ?? '',
		space_id: contentfulConfig?.space_id ?? '',
		environment: contentfulConfig?.environment ?? '',
		delivery_access_token: contentfulConfig?.delivery_access_token ?? '',
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

				const dismissalCache = getAlertDismissalCache();
				const visibleAlerts = activeAlerts.filter((alert: any, index: number) => {
					const alertId = alert.sys?.id ?? `alert-${index}`;
					return dismissalCache.get<boolean>(getAlertDismissalKey(alertContentType, alertId)) !== true;
				});
				setIsDismissed(false);
				setAlerts(visibleAlerts);
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

	const dismissAlerts = () => {
		const dismissalCache = getAlertDismissalCache();
		alerts.forEach((alert: any, index: number) => {
			const alertId = alert.sys?.id ?? `alert-${index}`;
			dismissalCache.set(
				getAlertDismissalKey(alertContentType, alertId),
				true,
				CONTENTFUL_ALERT_DISMISSAL_TTL
			);
		});
		setIsDismissed(true);
	};

	return (
		<Modal
			variant="popover"
			modalID="contentful-alerts"
			isOpen={!isDismissed}
			handleCloseEvent={dismissAlerts}
			modalContent={
				<div className="contentful-alerts-popover">
					{alerts.map((alert: any, index: number) => (
						<ContentfulAlertBody
							key={alert.sys?.id ?? index}
							title={alert.fields?.title ?? ''}
							description={alert.fields?.description ?? ''}
						/>
					))}
				</div>
			}
		/>
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
	const { title, description, index } = props;
	return (
		<PageSection columns={1} maxWidth="100%" id={`alerts-${index}-section`}>
			<ContentfulAlertBody title={title} description={description} />
		</PageSection>
	);
}

ContentfulAlertBody.propTypes = {
	/** Alert title. */
	title: PropTypes.string,
	/** Alert description. */
	description: PropTypes.string,
};
type ContentfulAlertBodyType = InferProps<typeof ContentfulAlertBody.propTypes>;
function ContentfulAlertBody({ title, description }: ContentfulAlertBodyType) {
	return (
		<div className="contentful-alert contentful-alert-active">
			{title && <h3 className="contentful-alert-title">{title}</h3>}
			{description && <div className="contentful-alert-description">{description}</div>}
		</div>
	);
}

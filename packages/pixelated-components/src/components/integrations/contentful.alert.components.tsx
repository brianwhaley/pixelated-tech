"use client";

import React, { useEffect, useState } from 'react';
import PropTypes, { InferProps } from 'prop-types';
import { getContentfulEntriesByType, type ContentfulApiType } from './contentful.delivery';
import { usePixelatedConfig } from '../config/config.client';
import './contentful.alert.css';

const debug = false;

ContentfulAlert.propTypes = {
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
export type ContentfulAlertType = InferProps<typeof ContentfulAlert.propTypes>;
export function ContentfulAlert(props: ContentfulAlertType) {
	const config = usePixelatedConfig();
	const [alert, setAlert] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const apiProps: ContentfulApiType = {
		proxyURL: props.apiProps?.proxyURL ?? config?.contentful?.proxyURL ?? undefined,
		base_url: props.apiProps?.base_url ?? config?.contentful?.base_url ?? '',
		space_id: props.apiProps?.space_id ?? config?.contentful?.space_id ?? '',
		environment: props.apiProps?.environment ?? config?.contentful?.environment ?? '',
		delivery_access_token:
			props.apiProps?.delivery_access_token ?? config?.contentful?.delivery_access_token ?? '',
	};

	const alertContentType = props.alertContentType ?? 'alert';
	const titleField = 'title';
	const descriptionField = 'description';
	const startDateField = 'startDate';
	const endDateField = 'endDate';
	const statusField = 'status';
	const activeStatusValue = 'Active';

	useEffect(() => {
		const fetchAlerts = async () => {
			if (!apiProps.base_url || !apiProps.space_id || !apiProps.environment || !apiProps.delivery_access_token) {
				setLoading(false);
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
						const aStart = new Date(a.fields?.[startDateField] ?? 0).getTime() || 0;
						const bStart = new Date(b.fields?.[startDateField] ?? 0).getTime() || 0;
						return bStart - aStart;
					});

				setAlert(activeAlerts.length > 0 ? activeAlerts[0] : null);
			} catch (fetchError: any) {
				setError(fetchError?.message ?? 'Failed to load alerts');
			}
			setLoading(false);
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

	if (loading) {
		return (
			<div className="contentful-alert contentful-alert-loading">
				<p>Loading alert...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="contentful-alert contentful-alert-error">
				<p>Error: {error}</p>
			</div>
		);
	}

	if (!alert) {
		return null;
	}

	const title = alert.fields?.[titleField] ?? '';
	const description = alert.fields?.[descriptionField] ?? '';

	return (
		<div className="contentful-alert contentful-alert-active">
			{title && <h3 className="contentful-alert-title">{title}</h3>}
			{description && <div className="contentful-alert-description">{description}</div>}
		</div>
	);
}

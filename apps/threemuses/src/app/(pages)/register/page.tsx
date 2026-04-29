"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageTitleHeader, PageSection, PageGridItem } from "@pixelated-tech/components";
import { SquareCheckout, emailJSON, FormEngine, usePixelatedConfig } from "@pixelated-tech/components";
import { getContentfulEntriesByType, getContentfulEntryByField } from "@pixelated-tech/components";
import type { CheckoutType } from "@pixelated-tech/components";
import youthFormData from "@/app/data/register-youth-form.json";
import adultFormData from "@/app/data/register-adult-form.json";
import sectionTwoFormData from "@/app/data/register-section-two-form.json";

export default function Register() {
	const searchParams = useSearchParams();
	const eventId = searchParams?.get('event') ?? '';
	const config = usePixelatedConfig();
	const squareConfig = config?.square;

	const [eventData, setEventData] = useState<any | null>(null);
	const eventName = eventData?.fields?.title ?? '';
	const eventPrice = eventData?.fields?.price ?? 0;
	const eventContentType = '75OqioFABdZZ1QaQChRGic';

	const selectedBaseFormData = useMemo(() => {
		const category = eventData?.fields?.category?.toString?.().toLowerCase?.() ?? '';
		return category === 'adult' ? adultFormData : youthFormData;
	}, [eventData]);

	const formData = useMemo(() => ({
		properties: { ...selectedBaseFormData.properties },
		fields: [...selectedBaseFormData.fields, ...sectionTwoFormData.fields],
	}), [selectedBaseFormData]);

	const [paymentReady, setPaymentReady] = useState(false);
	const [checkoutData, setCheckoutData] = useState<CheckoutType | null>(null);
	const [formValues, setFormValues] = useState<Record<string, any> | null>(null);
	const [paymentError, setPaymentError] = useState<string | null>(null);
	const [paymentSuccess, setPaymentSuccess] = useState(false);

	useEffect(() => {
		if (!eventId || !config) { return; }
		async function loadEvent() {
			const apiProps = {
				base_url: config?.contentful?.base_url ?? "",
				space_id: config?.contentful?.space_id ?? "",
				environment: config?.contentful?.environment ?? "",
				delivery_access_token: config?.contentful?.delivery_access_token ?? "",
			};
			const entries = await getContentfulEntriesByType({ apiProps, contentType: eventContentType });
			const eventObj = await getContentfulEntryByField({ cards: entries, searchField: 'id', searchVal: eventId });
			if (eventObj) {
				setEventData(eventObj);
			}
		}
		loadEvent();
	}, [eventId, config, eventContentType]);

	const registrationFormData = useMemo(() => {
		const defaults: Record<string, string> = {
			eventName,
			eventId,
		};

		const fields = formData.fields.map((field: any) => {
			if (field.component === 'FormInput' && field.props?.id && defaults[field.props.id]) {
				const updatedProps = {
					...field.props,
				};

				if (field.props.id === 'eventName') {
					updatedProps.value = defaults[field.props.id];
				} else {
					updatedProps.defaultValue = defaults[field.props.id];
				}

				return {
					...field,
					props: updatedProps,
				};
			}
			return field;
		});

		return {
			...formData,
			fields: [
				...fields,
				{
					component: 'FormButton',
					props: {
						id: 'register-submit',
						text: 'Continue to payment',
						type: 'submit',
						className: 'pix-cart-button',
					},
				},
			],
		};
	}, [formData, eventId, eventName]);

	const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const form = event.currentTarget;
		const data = Object.fromEntries(new FormData(form).entries());
		const fullName = `${data.firstname || ''} ${data.lastname || ''}`.trim();

		setFormValues(data as Record<string, any>);
		setCheckoutData({
			items: [],
			subtotal: eventPrice,
			subtotal_discount: 0,
			shippingTo: {
				name: fullName,
				street1: String(data.address || ''),
				city: String(data.city || ''),
				state: String(data.state || ''),
				zip: String(data.zip || ''),
				country: String(data.country || ''),
				email: String(data.email || ''),
				phone: String(data.telephone || ''),
			},
			shippingCost: 0,
			handlingFee: 0,
			insuranceCost: 0,
			salesTax: 0,
			total: eventPrice,
		});
		setPaymentReady(true);
	};

	const handlePaymentApprove = async (props: any) => {
		setPaymentError(null);
		const payload = {
			...(formValues ?? {}),
			eventId,
			eventName,
			payment: props.data,
		};
		try {
			await emailJSON({
				from: 'info@thethreemusesofbluffton.com',
				to: 'info@thethreemusesofbluffton.com',
				subject: `Event registration: ${eventName || 'Three Muses Event'}`,
				...payload,
			});
			setPaymentSuccess(true);
		} catch (error: any) {
			setPaymentError(error?.message || 'Unable to complete registration.');
		}
	};

	return (
		<>
			<PageTitleHeader title="Register for a Three Muses Event" />
			<PageSection columns={1} maxWidth="768px" id="social-section">
				<PageGridItem>
					<div>
						{paymentSuccess ? (
							<div>
								<h2>Registration complete</h2>
								<p>Thanks! Your registration and payment have been submitted.</p>
							</div>
						) : null}
						{paymentError ? <div className="pix-cart-error">{paymentError}</div> : null}
					</div>
				</PageGridItem>
				<PageGridItem>
					<div style={{ margin: '0 auto', border: '2px solid var(--accent1-color)', padding: '20px', borderRadius: '20px' }}>
						{!paymentReady ? (
							<FormEngine formData={registrationFormData as any} onSubmitHandler={handleFormSubmit} />
						) : (
							<>
								<div style={{ marginBottom: '24px' }}>
									<h3>Complete payment for {eventName || 'your event'}</h3>
									<p>Total: ${eventPrice.toFixed(2)}</p>
								</div>
								{checkoutData ? (
									squareConfig?.applicationId && squareConfig?.locationId ? (
										<SquareCheckout
											applicationId={squareConfig?.applicationId}
											locationId={squareConfig?.locationId}
											checkoutData={checkoutData}
											onApprove={handlePaymentApprove}
										/>
									) : (
										<div className="pix-cart-error">
										Square is not configured. Add square.applicationId and square.locationId to pixelated.config.json.
										</div>
									)
								) : null}
							</>
						)}
					</div>
				</PageGridItem>
			</PageSection>

			<br />
		</>
	);
}

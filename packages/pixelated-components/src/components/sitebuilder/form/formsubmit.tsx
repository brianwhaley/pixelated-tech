"use client";

import React, { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import { ToggleLoading } from '../../foundation/loading';
import { handleModalOpen } from '../../elements/modal';
import { smartFetch } from '../../foundation/smartfetch';

/* 
event.target.id = form id
event.body : {
to: "",
from: "",
subject: ""
}
*/
export type EmailFormDataResult = {
	success: boolean;
	response?: any;
	error?: Error;
};

export type ProcessFormDataOptions = {
	sendQueryParams?: boolean;
};

export async function processFormData(
	e: Event,
	callback?: (e: Event) => void,
	options: ProcessFormDataOptions = {},
): Promise<EmailFormDataResult> {
	const target = e.target as HTMLFormElement;
	const myform = document.getElementById(target.id) as HTMLFormElement | null;

	e.preventDefault?.();
	const myFormData: { [key: string]: any } = {};
	const formData = new FormData(myform as HTMLFormElement);
	for (const [key, value] of formData.entries()) {
		myFormData[key] = value ;
	}
	if (options.sendQueryParams && typeof window !== 'undefined') {
		for (const [key, value] of new URLSearchParams(window.location.search)) {
			if (!(key in myFormData)) myFormData[key] = value;
		}
	}

	return processJSON(myFormData, () => callback?.(e));
}


export async function processJSON(jsonData: Record<string, unknown>, callback?: () => void): Promise<EmailFormDataResult> {
	const debug = false;

	const sendmail_api = "https://sendmail.pixelated.tech/default/sendmail";
	// "https://admin.pixelated.tech/api/process-form-submit"
	const myJsonData: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(jsonData)) {
		myJsonData[key] = value ;
	}
	// Check the canonical honeypot keys plus the legacy website field convention.
	if (
		String(myJsonData['winnie'] ?? '').trim() ||
		String(myJsonData['pooh'] ?? '').trim() ||
		String(myJsonData['website'] ?? '').trim()
	) {
		if (debug) console.info('honeypot triggered — dropping submit');
		callback?.();
		return { success: true, response: null };
	}
	myJsonData.Date = new Date().toLocaleDateString() ;
	myJsonData.Status = "Submitted" ;
	const startTime = new Date().toISOString();
	if (debug) console.info('[processJSON] submit-start', { sendmail_api, startTime, myJsonData });
	try {
		const responseData = await smartFetch(sendmail_api, {
			requestInit: {
				method: 'POST',
				mode: 'cors',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(myJsonData),
			}
		});
		const elapsedMs = new Date().getTime() - new Date(startTime).getTime();
		if (debug) console.info('[processJSON] submit-finish', { sendmail_api, elapsedMs, responseData });
		if (debug) console.debug('processJSON — submission data:', myJsonData, 'response:', responseData);
		callback?.();
		return { success: true, response: responseData };
	} catch (err) {
		console.error('processJSON error', err);
		callback?.();
		return { success: false, error: err as Error };
	}
}

const DEFAULT_MODAL_CONTENT = (
	<div className="centered">
		<br /><br />
		Thank you for your submission!<br />
		We will get back to you as soon as we can.
		<br /><br /><br />
	</div>
);

export type UseFormSubmitOptions = {
	// Feature flags
	toggleLoading?: boolean;
	openModal?: boolean;
	resetForm?: boolean;
	sendQueryParams?: boolean;
	
	// Modal content
	modalContent?: React.ReactNode;
	
	// Lifecycle callbacks (run after defaults)
	onStart?: () => void;
	onSuccess?: (event: Event, response?: any) => void;
	onError?: (event: Event, error: Error) => void;
	onFinally?: (event: Event) => void;
};

export function useFormSubmit(options: UseFormSubmitOptions = {}) {
	const {
		toggleLoading = true,
		openModal = true,
		resetForm = true,
		sendQueryParams = false,
		modalContent = DEFAULT_MODAL_CONTENT,
		onStart,
		onSuccess,
		onError,
		onFinally,
	} = options;

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<Error | null>(null);
	const [submitResponse, setSubmitResponse] = useState<any>(null);

	const handleSubmit = useCallback(
		async (event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			const nativeEvent = event.nativeEvent as unknown as Event;

			// Start
			if (toggleLoading) ToggleLoading({ show: true });
			onStart?.();

			setIsSubmitting(true);
			setSubmitError(null);

			// Submit
			const result = await processFormData(nativeEvent, undefined, { sendQueryParams });
			setSubmitResponse(result.response);

			// Handle result
			if (result.success) {
				// Run defaults first
				if (openModal) {
					// Use the Modal context if available, or try handleModalOpen
					try {
						handleModalOpen(nativeEvent as MouseEvent);
					} catch (err) {
						// Modal system not available in test/story context
						if (typeof window !== 'undefined' && (window as any).__DEV__) {
							console.debug('handleModalOpen not available', err);
						}
					}
				}
				if (resetForm) {
					const form = nativeEvent.target as HTMLFormElement;
					if (form) form.reset();
				}

				// Run custom callback
				onSuccess?.(nativeEvent, result.response);
			} else {
				const error = result.error ?? new Error('Form submission failed');
				setSubmitError(error);

				// Run custom callback
				onError?.(nativeEvent, error);
			}

			// Finalize
			onFinally?.(nativeEvent);

			if (toggleLoading) ToggleLoading({ show: false });
			setIsSubmitting(false);
		},
		[toggleLoading, openModal, resetForm, onStart, onSuccess, onError, onFinally]
	);

	return {
		isSubmitting,
		submitError,
		submitResponse,
		handleSubmit,
		modalContent: modalContent as NonNullable<React.ReactNode>,
	};
}

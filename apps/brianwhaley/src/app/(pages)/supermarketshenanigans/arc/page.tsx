"use client";

import React, { useState } from "react";
import { FormEngine, Loading, Modal, PageSection, PageSectionHeader, PageTitleHeader, ToggleLoading, processFormData } from "@pixelated-tech/components";
import { sendArcReviewerEmail } from "./arc-email";
import formData from "./arc-form.json";

export default function SupermarketShenanigansARCPage() {
	const [modalMessage, setModalMessage] = useState<React.ReactNode>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const form = event.nativeEvent.target as HTMLFormElement;
		const arcRequestId = crypto.randomUUID();
		const arcRequestIdField = form.elements.namedItem("arcRequestId") as HTMLInputElement | null;
		if (arcRequestIdField) arcRequestIdField.value = arcRequestId;

		const submittedData = new FormData(form);
		const email = String(submittedData.get("email") ?? "").trim();
		const downloadCode = String(submittedData.get("downloadCode") ?? "").trim();
		const format = String(submittedData.get("format") ?? "").trim().toLowerCase();

		setIsModalOpen(false);
		ToggleLoading({ show: true });
		try {
			const sendmailResult = await processFormData(event.nativeEvent);
			if (!sendmailResult.success) {
				throw new Error("The ARC request could not be submitted.");
			}

			const reviewerEmailResult = await sendArcReviewerEmail({ email, downloadCode, format, arcRequestId });
			if (!reviewerEmailResult.success) {
				throw new Error(reviewerEmailResult.message);
			}

			form.reset();
			setModalMessage(
				<div className="centered">
					<p>The download link has been sent to the submitted email address.</p>
				</div>
			);
			setIsModalOpen(true);
		} catch (error) {
			console.error("ARC request failed", error);
			setModalMessage(
				<div className="centered">
					<p>{error instanceof Error ? error.message : "The ARC request could not be completed."}</p>
				</div>
			);
			setIsModalOpen(true);
		} finally {
			ToggleLoading({ show: false });
		}
	};

	return (
		<>
			<Loading />
			<PageSection columns={1} maxWidth="1024px" id="arc-container">
				<PageTitleHeader title="Supermarket Shenanigans: True Tales from Behind the Courtesy Desk" />
				<PageSectionHeader title="Author Review Copy" />
				<p>
					Request a digital review copy of Supermarket Shenanigans. Choose your preferred file format and the download link will be sent to your email address.
				</p>
				<div style={{ margin: "0 auto", border: "2px solid var(--accent1-color)", padding: "20px", borderRadius: "20px" }}>
					<FormEngine formData={formData as any} onSubmitHandler={handleSubmit} />
				</div>
			</PageSection>
			<Modal modalContent={modalMessage ?? <></>} isOpen={isModalOpen} handleCloseEvent={() => setIsModalOpen(false)} />
		</>
	);
}

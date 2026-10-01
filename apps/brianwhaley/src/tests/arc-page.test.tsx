import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import * as components from "@pixelated-tech/components";
import { sendArcReviewerEmail } from "@/app/(pages)/supermarketshenanigans/arc/arc-email";
import SupermarketShenanigansARCPage from "@/app/(pages)/supermarketshenanigans/arc/page";

vi.mock("@/app/(pages)/supermarketshenanigans/arc/arc-email", () => ({
	sendArcReviewerEmail: vi.fn(),
}));

function addFormFields(form: HTMLElement) {
	[
		["email", "reviewer@example.com"],
		["downloadCode", "FamilyShenanigans"],
		["format", "pdf"],
	].forEach(([name, value]) => {
		const input = document.createElement("input");
		input.name = name;
		input.value = value;
		form.appendChild(input);
	});
}

describe("Supermarket Shenanigans ARC page", () => {
	it("submits the request and shows the success message", async () => {
		vi.spyOn(components, "processFormData").mockResolvedValue({ success: true } as any);
		vi.mocked(sendArcReviewerEmail).mockResolvedValue({ success: true });
		render(<SupermarketShenanigansARCPage />);
		const form = screen.getByTestId("form-engine");
		addFormFields(form);

		form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
		await screen.findByText("The download link has been sent to the submitted email address.");
		expect(sendArcReviewerEmail).toHaveBeenCalledWith(expect.objectContaining({
			email: "reviewer@example.com",
			downloadCode: "FamilyShenanigans",
			format: "pdf",
		}));
	});

	it("shows the Sendmail error", async () => {
		vi.spyOn(components, "processFormData").mockResolvedValue({ success: false } as any);
		render(<SupermarketShenanigansARCPage />);
		const form = screen.getByTestId("form-engine");
		addFormFields(form);

		form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
		await screen.findByText("The ARC request could not be submitted.");
		expect(sendArcReviewerEmail).not.toHaveBeenCalled();
	});

	it("shows the reviewer email error", async () => {
		vi.spyOn(components, "processFormData").mockResolvedValue({ success: true } as any);
		vi.mocked(sendArcReviewerEmail).mockResolvedValue({ success: false, message: "The reviewer email could not be sent." });
		render(<SupermarketShenanigansARCPage />);
		const form = screen.getByTestId("form-engine");
		addFormFields(form);

		form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
		await screen.findByText("The reviewer email could not be sent.");
	});

	it("renders the request form and loading spinner", () => {
		render(<SupermarketShenanigansARCPage />);

		expect(screen.getByTestId("page-section-header").textContent).toContain("Author Review Copy");
		expect(screen.getByTestId("form-engine")).not.toBeNull();
		expect(screen.getByTestId("loading")).not.toBeNull();
	});
});

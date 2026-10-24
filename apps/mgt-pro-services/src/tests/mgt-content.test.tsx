import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import config from "@/app/config/pixelated.config.json";
import assessmentForm from "@/app/data/assessmentform.json";
import blogCalendar from "../../public/data/blogcalendar.json";
import { createPageComponentMocks } from "@/tests/page-mocks";

vi.mock("@pixelated-tech/components", async () => ({
	__esModule: true,
	...(await vi.importActual("@pixelated-tech/components")),
	...createPageComponentMocks(),
}));

import RequestAnAssessmentPage from "@/app/(pages)/request-an-assessment/page";

describe("MGT Pro Services content contracts", () => {
	it("contains the approved primary contact information", () => {
		expect(config.siteInfo.email).toBe("ma6919@aol.com");
		expect(config.siteInfo.telephone).toBe("(302) 430-4449");
		expect(config.siteInfo.address).toMatchObject({
			streetAddress: "215 Harlequin Drive",
			addressLocality: "Moore",
			addressRegion: "SC",
			postalCode: "29369",
		});
	});

	it("keeps footer-only routes hidden and uses config-driven services", () => {
		const routes = config.routes as Array<{ path: string; hidden?: boolean }>;
		const services = config.siteInfo.services ?? [];
		expect(routes.find((route) => route.path === "/coating-systems")?.hidden).toBe(true);
		expect(routes.find((route) => route.path === "/process")?.hidden).toBe(true);
		expect(routes.find((route) => route.path === "/estimator")?.hidden).toBe(true);
		expect(routes.some((route) => route.path === "/residential-floor-coatings")).toBe(false);
		expect(routes.some((route) => route.path === "/commercial-floor-coatings")).toBe(false);
		expect(routes.some((route) => route.path === "/home-renovations")).toBe(false);
		expect(services.map((service) => service.name)).toEqual([
			"Residential Floor Coatings",
			"Commercial Floor Coatings",
			"Home Renovations",
		]);
	});

	it("uses MGT flooring and renovation topics in the canonical calendar", () => {
		expect(blogCalendar.blogCalendar).toHaveLength(52);
		expect(blogCalendar.blogCalendar[0].title).toBe("Epoxy vs. polyaspartic vs. polyurea: which coating fits a Greenville-area project?");
		expect(blogCalendar.blogCalendar[10].title).toBe("Common causes of peeling and failed garage coatings");
		expect(blogCalendar.blogCalendar[20].title).toBe("What a written coating estimate should include");
		expect(blogCalendar.blogCalendar[49].title).toBe("MGT assessment checklist for residential and commercial customers");
	});

	it("mounts the assessment form with the approved recipient", () => {
		render(<RequestAnAssessmentPage />);
		expect(screen.getByTestId("form-engine")).not.toBeNull();
		expect(screen.getByText(/request an assessment/i)).not.toBeNull();
		expect(assessmentForm.fields[1].props.value).toBe("ma6919@aol.com");
		expect(assessmentForm.fields.some((field) => field.props?.id === "project-type")).toBe(true);
		expect(assessmentForm.fields.some((field) => field.props?.id === "project-location")).toBe(true);
		expect(assessmentForm.fields.some((field) => field.props?.id === "surface-condition")).toBe(true);
	});
});

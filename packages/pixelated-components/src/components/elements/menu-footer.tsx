import React from "react";
import { headers } from "next/headers";
import { PageSection, PageGridItem } from "../structure/page-blocks";
import { getFullPixelatedConfig } from "../config/config";
import { getAllRoutes } from "../foundation/metadata.functions";
import "./menu-footer.css";

export async function FooterMenu() {
	const reqHeaders = await headers();
	const activePathCandidate = (reqHeaders.get("x-path") ?? "/").trim().replace(/\/+$/g, '');
	const activePath = activePathCandidate === '' ? '/' : activePathCandidate;

	const config = await getFullPixelatedConfig();
	return (
		<PageSection className="footer-menu" id="footer" columns={6} maxWidth="1024px" padding="20px 0 0 0">
			{ getAllRoutes(config.routes || [], '').map((route) => {
				if (route.routes && route.routes.length > 0) return null; 
				const routePathCandidate = (typeof route.path === 'string' ? route.path.trim() : '/').replace(/\/+$/g, '');
				const routePath = routePathCandidate === '' ? '/' : routePathCandidate;
				const isSelected = routePath === activePath;
				return (
					<PageGridItem key={route.path} className="footer-menu-item">
						<a href={route.path} className={isSelected ? 'selected' : undefined} style={{ textAlign: "center"}}>{route.name}</a>
					</PageGridItem>
				);
			}) }
		</PageSection>
	);
}

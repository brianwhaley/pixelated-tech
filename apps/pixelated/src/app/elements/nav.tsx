"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { MenuAccordion, usePixelatedConfig } from "@pixelated-tech/components";

export default function Nav() {
	const routes = usePixelatedConfig()?.routes ?? [];
	const searchParams = useSearchParams();
	const fullMenuParam = searchParams.get('fullmenu');
	const fullMenu = fullMenuParam !== null && fullMenuParam !== 'false';
	// DIRTY FIX FOR CSS DEFER AND ACCORDION MENU
	// copied from pixelated-components/src/components/menu/menu-accordion.tsx
	const customCSS = `
      	.accordionUp {
			top: 60px;
			transition: transform 0.55s ease-out 0.0s;
			transform: translateY(-150%);
		}`;
	const fullMenuCSS = `
		.panel-menu-button, #panel-menu-button {
    		display: block;
		}`;
	return fullMenu ? (
		<div suppressHydrationWarning={true}>
			<style dangerouslySetInnerHTML={{ __html: customCSS + fullMenuCSS }} />
			<MenuAccordion menuItems={routes} showHidden={fullMenu} />
		</div>
	) : (
		<div suppressHydrationWarning={true}>
			<style dangerouslySetInnerHTML={{ __html: customCSS }} />
			<MenuAccordion menuItems={routes} />
		</div>
	);
}

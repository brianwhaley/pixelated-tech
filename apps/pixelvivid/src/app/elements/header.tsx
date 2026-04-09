"use client";

import React from "react";

// import { MenuAccordionButton } from "../components/menu/pixelated.menu-accordion";
import { MenuAccordionButton } from "@pixelated-tech/components";
import { CartButton } from "@pixelated-tech/components";
import "./header.css";

export default function Header() {
	// DIRTY FIX FOR CSS DEFER AND ACCORDION MENU
	// copied from pixelated-components/src/shoppingcart/pixelated.shoppingcart.css
	const customCSS = `
      	#pix-cart-button.pix-cart-button img {
			width: 20px;
		}
    `;
	return (
		<>
			<style dangerouslySetInnerHTML={{ __html: customCSS }} />
			<div className="section-container">
				<MenuAccordionButton />
				<h2 className="pull-left text-outline">PixelVivid</h2>
				<div className="right">
					<CartButton href={'/cart'} />
				</div>
			</div>
		</>
	);
}

"use client";

import React from "react";
import PropTypes, { InferProps } from 'prop-types';
import { SmartImage } from "../elements/smartimage";

const PIXELATED_PAGE_MAP: Record<string, string> = {
	'/': 'https://www.pixelated.tech',
	'/about': 'https://www.pixelated.tech/about',
	'/blog': 'https://www.pixelated.tech/blog',
	'/contact': 'https://www.pixelated.tech/contact',
	'/services': 'https://www.pixelated.tech/services',
	'/service-areas': 'https://www.pixelated.tech/service-areas',
	'/projects': 'https://www.pixelated.tech/portfolio',
	'/portfolio': 'https://www.pixelated.tech/portfolio',
	'/podcast': 'https://www.pixelated.tech/podcast',
	'/faqs': 'https://www.pixelated.tech/faqs',
};

function getPixelatedFooterLink(pathname: string): string {
	const normalized = pathname.trim().replace(/\/+/g, '/').replace(/\/$$/, '') || '/';
	if (normalized === '/') return PIXELATED_PAGE_MAP['/'];
	if (normalized.startsWith('/blog')) return PIXELATED_PAGE_MAP['/blog'];
	if (normalized.startsWith('/services')) return PIXELATED_PAGE_MAP['/services'];
	if (normalized.startsWith('/service-areas')) return PIXELATED_PAGE_MAP['/service-areas'];
	if (normalized.startsWith('/about')) return PIXELATED_PAGE_MAP['/about'];
	if (normalized.startsWith('/contact')) return PIXELATED_PAGE_MAP['/contact'];
	if (normalized.startsWith('/podcast')) return PIXELATED_PAGE_MAP['/podcast'];
	if (normalized.startsWith('/projects') || normalized.startsWith('/portfolio')) return PIXELATED_PAGE_MAP['/portfolio'];
	if (normalized.startsWith('/faqs')) return PIXELATED_PAGE_MAP['/faqs'];
	return PIXELATED_PAGE_MAP['/'];
}

/**
 * PixelatedFooter — Simple footer component for Pixelated sites. 
 * @param {any} [props] - No props are accepted by PixelatedFooter.
 */
PixelatedFooter.propTypes = { /** no props */ };
export type PixelatedFooterType = InferProps<typeof PixelatedFooter.propTypes>;
export function PixelatedFooter (props: PixelatedFooterType) {
	const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
	const href = getPixelatedFooterLink(pathname);

	return (
		<>
			<p className="footer-text">Designed and developed by 
				<a href={href} target="_blank" rel="noopener noreferrer">
					<SmartImage
						src="https://www.pixelated.tech/images/pix/pix-bg.png" alt="Pixelated Technologies"
						width={50} height={50}
						style={{ width: "20px", height: "20px", margin: "0 1px 0 8px", verticalAlign: "middle", borderRadius: "5px" }}
					/>Pixelated Technologies.
				</a>
			</p>
		</>
	);
}

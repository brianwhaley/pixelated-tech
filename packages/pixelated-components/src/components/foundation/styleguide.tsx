import React from "react";
import PropTypes, { InferProps } from "prop-types";
import { PageTitleHeader, PageSection } from "../structure/page-blocks";
import { getFullPixelatedConfig } from "../config/config";
import type { VisualDesign } from "../config/config.types";
import { createPageURLs, createSiteConfigServiceAreaURLs, createSiteConfigServiceURLs } from "./sitemap";
import './styleguide.css';
import { contrastyColor } from "./utilities";



/**
 * StyleGuideUI — developer style guide and design tokens viewer (colors, fonts, IA routes).
 *
 * @param {}
 * @returns {JSX.Element} The StyleGuideUI component.
 */
StyleGuideUI.propTypes = {
/** No Props */
};
export type StyleGuideUIType = InferProps<typeof StyleGuideUI.propTypes>;
export async function StyleGuideUI() {
	const pixelatedConfig = getFullPixelatedConfig();
	const routes = Array.isArray(pixelatedConfig?.routes) ? pixelatedConfig.routes : [];
	const pageEntries = [
		...(await createPageURLs(routes)),
		...createSiteConfigServiceURLs(pixelatedConfig ?? {}),
		...createSiteConfigServiceAreaURLs(pixelatedConfig ?? {}),
	];
	const visualdesign: VisualDesign = pixelatedConfig?.visualdesign ?? {} as VisualDesign;
	const headerFont = typeof visualdesign?.['header-font']?.value === 'string'
		? visualdesign['header-font'].value.split(',')[0].trim().replace(/^['"]+|['"]+$/g, '')
		: 'sans-serif';
	const bodyFont = typeof visualdesign?.['body-font']?.value === 'string'
		? visualdesign['body-font'].value.split(',')[0].trim().replace(/^['"]+|['"]+$/g, '')
		: 'sans-serif';

	return (
		<div className="styleguide-ui">
			<PageTitleHeader title="Style Guide" />

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="colors-section">
				<h2>Color Palette</h2>
				<div className="color-swatch-grid">
					<div suppressHydrationWarning style={{ backgroundColor: visualdesign?.['primary-color']?.value, color: contrastyColor(visualdesign?.['primary-color']?.value) }} className="color-swatch">Primary Color<br />{visualdesign?.['primary-color']?.value}</div>
					<div suppressHydrationWarning style={{ backgroundColor: visualdesign?.['secondary-color']?.value, color: contrastyColor(visualdesign?.['secondary-color']?.value) }} className="color-swatch">Secondary Color<br />{visualdesign?.['secondary-color']?.value}</div>
					<div suppressHydrationWarning style={{ backgroundColor: visualdesign?.['tertiary-color']?.value, color: contrastyColor(visualdesign?.['tertiary-color']?.value) }} className="color-swatch">Tertiary Color<br />{visualdesign?.['tertiary-color']?.value}</div>
					<div suppressHydrationWarning style={{ backgroundColor: visualdesign?.['accent1-color']?.value, color: contrastyColor(visualdesign?.['accent1-color']?.value) }} className="color-swatch">Accent 1 Color<br />{visualdesign?.['accent1-color']?.value}</div>
					<div suppressHydrationWarning style={{ backgroundColor: visualdesign?.['accent2-color']?.value, color: contrastyColor(visualdesign?.['accent2-color']?.value) }} className="color-swatch">Accent 2 Color<br />{visualdesign?.['accent2-color']?.value}</div>
					<div suppressHydrationWarning style={{ backgroundColor: visualdesign?.['accent3-color']?.value, color: contrastyColor(visualdesign?.['accent3-color']?.value) }} className="color-swatch">Accent 3 Color<br />{visualdesign?.['accent3-color']?.value}</div>
					<div suppressHydrationWarning style={{ backgroundColor: visualdesign?.['bg-color']?.value, color: contrastyColor(visualdesign?.['bg-color']?.value) }} className="color-swatch">Background Color<br />{visualdesign?.['bg-color']?.value}</div>
					<div suppressHydrationWarning style={{ backgroundColor: visualdesign?.['text-color']?.value, color: contrastyColor(visualdesign?.['text-color']?.value) }} className="color-swatch">Text Color<br />{visualdesign?.['text-color']?.value}</div>
				</div>
			</PageSection>


			<PageSection columns={1} maxWidth="1024px" padding="20px" id="fonts-section">
				<h1 suppressHydrationWarning>H1 - {headerFont} font</h1>
				<h2 suppressHydrationWarning>H2 - {headerFont} font</h2>
				<h3 suppressHydrationWarning>H3 - {headerFont} font</h3>
				<h4 suppressHydrationWarning>H4 - {headerFont} font</h4>
				<h5 suppressHydrationWarning>H5 - {headerFont} font</h5>
				<h6 suppressHydrationWarning>H6 - {headerFont} font</h6>
				<p suppressHydrationWarning>{bodyFont} font.  This is a paragraph of text to demonstrate the body font style. </p>
				<p suppressHydrationWarning>{bodyFont} font.  The quick brown fox jumps over the lazy dog. </p>
				<p suppressHydrationWarning>{bodyFont} font.  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
			</PageSection>

			<PageSection columns={1} maxWidth="1024px" padding="20px" id="fonts-section">
				<h2>Information Architecture</h2>
				<ul>
					{pageEntries.map((r: any, index: number) => {
						return <li key={index}><a href={r.url}>{r.name} - {r.url}</a></li>;
					})}
				</ul>
			</PageSection>
		</div>
	);
}

import React from 'react';
import PropTypes, { InferProps } from "prop-types";
import { observeIntersection, isElementPartiallyInViewport } from './intersection-observer';
import './microinteractions.css';




/* ========== MICRO ANIMATION HELPERS ========== */

function addClassToElements(params: {
	selectors?: string, 
	elements?: Element | Element[] | NodeListOf<Element>, 
	className: string}) {
	const { selectors, elements, className } = params;
	const selector = selectors?.trim() || null;
	const selectorItems = selector
		? Array.from(document.querySelectorAll(selector))
		: [];
	const elementItems = elements ? (elements instanceof Element ? [elements] : Array.from(elements)) : [];
	const items = [...selectorItems, ...elementItems];
	items.forEach((item) => item.classList.add(className));
}

function removeClassFromElements(params: {
	selectors?: string, 
	elements?: Element | Element[] | NodeListOf<Element>, 
	className: string}) {
	const { selectors, elements, className } = params;
	const selector = selectors?.trim() || null;
	const selectorItems = selector
		? Array.from(document.querySelectorAll(selector))
		: [];
	const elementItems = elements ? (elements instanceof Element ? [elements] : Array.from(elements)) : [];
	const items = [...selectorItems, ...elementItems];
	items.forEach((item) => item.classList.remove(className));
}




/* ========== MICRO ANIMATIONS ========== */

/**
 * MicroInteractions handles global site animations and interactions.
 * It is typically called once in a top-level component or effect.
 * 
 * @param props - Configuration props for enabling/disabling interactions
 * @returns A cleanup function if scrollfadeSelectors is used
 */
/**
 * MicroInteractions — enables or disables lightweight UI micro-interactions by toggling body classes and initializing scroll-fade behavior.
 *
 * @param {boolean} [props.buttonring] - Enable pulsing ring animations on buttons.
 * @param {boolean} [props.cartpulse] - Enable cart pulse animation for add-to-cart actions.
 * @param {boolean} [props.formglow] - Enable focus-glow styles for form controls.
 * @param {boolean} [props.grayscalehover] - Enable grayscale-to-color hover effects on images.
 * @param {boolean} [props.imgscale] - Enable subtle image scaling on hover.
 * @param {boolean} [props.imgtwist] - Enable small rotation animation on hover for images.
 * @param {boolean} [props.imghue] - Enable hue-shift effects on hover for images.
 * @param {boolean} [props.simplemenubutton] - Enable simplified menu button microinteractions.
 * @param {string} [props.scrollfadeSelectors] - CSS selector for elements to apply scroll-fade animations to.
 * @param {string} [props.glassSelectors] - CSS selector for elements to apply the glass style to.
 */
MicroInteractions.propTypes = {
/** Enable ring animation on buttons. */
	buttonring: PropTypes.bool,
	/** Enable pulse animation on cart icon or similar. */
	cartpulse: PropTypes.bool,
	/** Enable glow effects on focused form elements. */
	formglow: PropTypes.bool,
	/** Enable grayscale hover-to-color transitions on elements. */
	grayscalehover: PropTypes.bool,
	/** Enable scale-up animation on image hover. */
	imgscale: PropTypes.bool,
	/** Enable slight twist/rotation on image hover. */
	imgtwist: PropTypes.bool,
	/** Enable hue-shift color changes on hover. */
	imghue: PropTypes.bool,
	/** Toggle simplified menu button interactions. */
	simplemenubutton: PropTypes.bool,
	/** Selector for elements that should receive the scroll-fade animation. */
	scrollfadeSelectors: PropTypes.string,
	/** Selector for elements that should receive the glass style. */
	glassSelectors: PropTypes.string,
};
export type MicroInteractionsType = InferProps<typeof MicroInteractions.propTypes>;
export function MicroInteractions(props: MicroInteractionsType) {
	const body = document.body;
	const selectorProps = ['scrollfadeSelectors', 'glassSelectors'];
	for (const propName in props) {
		if (Object.prototype.hasOwnProperty.call(props, propName) && !selectorProps.includes(propName)) {
			if ((props as any)[propName] === true) {
				body.classList.add(propName);
			} else if ((props as any)[propName] === false) {
				body.classList.remove(propName);
			}
		}
	}
	for (const selectorProp of selectorProps) {
		if (selectorProp === 'scrollfadeSelectors' && props.scrollfadeSelectors) {
			ScrollFade(props.scrollfadeSelectors);
		} else if (selectorProp && (props as any)[selectorProp]) {
			const className = selectorProp.replace('Selectors', '');		
			addClassToElements({ selectors: (props as any)[selectorProp], className: className });
		}
	}
}




/**
 * Applies a fade-in animation to elements as they enter the viewport
 * @param elements - CSS selector for elements to animate
 * @returns Cleanup function for the intersection observer
 */
function ScrollFade(elements: string) {
	const selector = elements.trim();
	if (!selector) { return; }
	const elementsToAnimate = document.querySelectorAll(selector);
	// Initial state setup
	elementsToAnimate.forEach((element) => {
		if (isElementPartiallyInViewport(element)) {
			// If already in viewport, make sure it's visible without animation
			removeClassFromElements({ elements: element, className: 'hidden' });
			removeClassFromElements({ elements: element, className: 'scrollfade' });
		} else {
			// Apply initial hidden state to elements NOT on the screen
			addClassToElements({ elements: element, className: 'hidden' });
		}
	});
	// Setup observer for elements not yet visible
	const cleanup = observeIntersection(
		selector,
		(entry, observer) => {
			if (entry.isIntersecting) {
				const element = entry.target;
				
				// Only animate if it was hidden
				if (element.classList.contains('hidden')) {
					addClassToElements({ elements: element, className: 'scrollfade' });
					removeClassFromElements({ elements: element, className: 'hidden' });
					// Stop observing after animation triggers
					observer.unobserve(element);
				}
			}
		},
		{
			rootMargin: "0px 0px -100px 0px",
			threshold: 0
		}
	);
	return cleanup;
}

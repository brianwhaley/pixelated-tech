"use client";

import React, { useEffect, useTransition } from 'react';
import PropTypes, { InferProps } from 'prop-types';

const ACTIONABLE_SELECTOR = 'button, a[href], [role="button"], [role="link"], [data-actionable]';
const IGNORE_INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
const URGENT_ATTRIBUTE = 'data-urgent';
const NO_TRANSITION_ATTRIBUTE = 'data-no-transition';

InteractionGuardrail.propTypes = {
	/**
	 * Root provider children.
	 */
	children: PropTypes.node.isRequired,
};
export type InteractionGuardrailType = InferProps<typeof InteractionGuardrail.propTypes>;
export function InteractionGuardrail(props: InteractionGuardrailType) {
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		document.body.setAttribute('data-platform-inp-guardrail', 'true');
		return () => {
			document.body.removeAttribute('data-platform-inp-guardrail');
		};
	}, []);

	useEffect(() => {
		document.body.setAttribute('data-platform-loading', String(isPending));
	}, [isPending]);

	useEffect(() => {
		const isEditableTarget = (target: EventTarget | null) => {
			if (!(target instanceof HTMLElement)) return false;
			if (IGNORE_INPUT_TAGS.has(target.tagName)) return true;
			return target.isContentEditable;
		};

		const isUrgentElement = (element: HTMLElement | null) => {
			if (!element) return false;
			return Boolean(
				element.closest(`[${URGENT_ATTRIBUTE}]`) ||
				element.closest(`[${NO_TRANSITION_ATTRIBUTE}]`)
			);
		};

		const getActionableTarget = (target: EventTarget | null) => {
			if (!(target instanceof HTMLElement)) return null;
			return target.closest(ACTIONABLE_SELECTOR) as HTMLElement | null;
		};

		const handleClick = (event: MouseEvent) => {
			if (event.button !== 0 || event.defaultPrevented) return;
			if (isEditableTarget(event.target)) return;
			const actionable = getActionableTarget(event.target);
			if (!actionable || isUrgentElement(actionable)) return;
			startTransition(() => {
				// leave native behavior intact
			});
		};

		const handlePointerDown = (event: PointerEvent) => {
			if (event.defaultPrevented) return;
			if (isEditableTarget(event.target)) return;
			const actionable = getActionableTarget(event.target);
			if (!actionable || isUrgentElement(actionable)) return;
			startTransition(() => {
				// no-op, create a transition boundary for downstream updates
			});
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.defaultPrevented) return;
			if (!['Enter', ' '].includes(event.key)) return;
			if (isEditableTarget(event.target)) return;
			const actionable = getActionableTarget(event.target);
			if (!actionable || isUrgentElement(actionable)) return;
			startTransition(() => {
				// no-op
			});
		};

		const handleSubmit = (event: SubmitEvent) => {
			const target = event.target;
			if (!(target instanceof HTMLFormElement)) return;
			if (target.hasAttribute(URGENT_ATTRIBUTE) || target.hasAttribute(NO_TRANSITION_ATTRIBUTE)) return;
			startTransition(() => {
				// no-op
			});
		};

		document.addEventListener('click', handleClick, true);
		document.addEventListener('pointerdown', handlePointerDown, true);
		document.addEventListener('keydown', handleKeyDown, true);
		document.addEventListener('submit', handleSubmit, true);

		return () => {
			document.removeEventListener('click', handleClick, true);
			document.removeEventListener('pointerdown', handlePointerDown, true);
			document.removeEventListener('keydown', handleKeyDown, true);
			document.removeEventListener('submit', handleSubmit, true);
		};
	}, []);

	return <>{props.children}</>;
}

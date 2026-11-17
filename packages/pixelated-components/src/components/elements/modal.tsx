"use client";

import React, { useEffect, useRef } from 'react';
import PropTypes, { InferProps } from 'prop-types';
import './modal.css';

/*
https://www.w3schools.com/howto/howto_css_modals.asp
*/

/**
 * Modal — accessible modal overlay component that can use either DOM events or a React close callback.
 *
 * @param {node} [props.modalContent] - Content to render inside the modal dialog (usually React nodes).
 * @param {string} [props.modalID] - Optional suffix used to form DOM ids for compatibility with legacy event-based controls.
 * @param {boolean} [props.isOpen] - Whether the modal is currently open and visible.
 * @param {function} [props.handleCloseEvent] - Optional callback to close the modal (used by React-driven consumers).
 * @param {oneOf} [props.variant] - Presentation mode: legacy modal, non-modal dialog, or popover.
 */
Modal.propTypes = {
/** Content rendered inside the modal dialog. */
	modalContent: PropTypes.node.isRequired,
	/** Optional id suffix for the modal; used for legacy DOM-style open/close helpers. */
	modalID: PropTypes.string,
	/** Flag indicating whether the modal is visible. */
	isOpen: PropTypes.bool,
	/** Optional close callback invoked by escape key, overlay click, or controls. */
	handleCloseEvent: PropTypes.func,
	/** Presentation mode. */
	variant: PropTypes.oneOf(['modal', 'dialog', 'popover']),
};
export type ModalType = InferProps<typeof Modal.propTypes>;
export function Modal({ modalContent, modalID, isOpen = false, handleCloseEvent, variant = 'modal' }: ModalType) {

	const myModalID = "myModal" + (modalID ?? '');
	const myModalCloseID = "myModalClose" + (modalID ?? '');
	const modalRef = useRef<HTMLDivElement>(null);
	const nativeDialogRef = useRef<HTMLDialogElement>(null);
	const nativeOpenRef = useRef(false);

	useEffect(() => {
		if (variant === 'modal') return;

		const dialog = nativeDialogRef.current;
		if (!dialog || isOpen === nativeOpenRef.current) return;

		if (variant === 'dialog') {
			if (isOpen) {
				dialog.show();
				nativeOpenRef.current = true;
			} else if (dialog.open) {
				nativeOpenRef.current = false;
				dialog.close();
			}
			return;
		}

		if (isOpen) {
			if (typeof dialog.showPopover !== 'function') {
				console.error('Modal popover variant requires browser popover support.');
				return;
			}
			dialog.showPopover();
			nativeOpenRef.current = true;
		} else if (typeof dialog.hidePopover === 'function') {
			nativeOpenRef.current = false;
			dialog.hidePopover();
		}
	}, [isOpen, variant]);

	useEffect(() => {
		// Only use DOM event listeners for backward compatibility when handleCloseEvent is not provided
		if (!handleCloseEvent) {
			const handleModalClose = (event: MouseEvent) => {
				event.preventDefault();
				const myModal = document.getElementById(myModalID);
				if (myModal) { myModal.style.display = 'none'; }
			};
			const myModalClose = document.getElementById(myModalCloseID);
			if (myModalClose) { myModalClose.addEventListener('click', handleModalClose); } ;

			const handleWindowOnClick = (event: MouseEvent) => {
				const myModal = document.getElementById(myModalID);
				if (event.target == myModal) {
					if (myModal) { myModal.style.display = 'none'; }
				}
			};
			window.addEventListener('click', handleWindowOnClick);

			return () => {
				window.removeEventListener('click', handleWindowOnClick);
				if (myModalClose) { myModalClose.removeEventListener('click', handleModalClose); } ;
			};
		} else {
			// For React approach, add escape key listener
			const handleEscape = (event: KeyboardEvent) => {
				if (event.key === 'Escape') {
					handleCloseEvent();
				}
			};
			document.addEventListener('keydown', handleEscape);
			return () => {
				document.removeEventListener('keydown', handleEscape);
			};
		}
	}, [myModalID, myModalCloseID, handleCloseEvent]);

	const handleCloseClick = handleCloseEvent ? (event: React.MouseEvent) => {
		event.preventDefault();
		handleCloseEvent();
	} : undefined;

	const handleCloseKeyDown = handleCloseEvent ? (event: React.KeyboardEvent) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleCloseEvent();
		}
	} : undefined;

	const handleModalClick = handleCloseEvent ? (event: React.MouseEvent) => {
		if (event.target === modalRef.current) {
			handleCloseEvent();
		}
	} : undefined;

	const handleModalKeyDown = handleCloseEvent ? (event: React.KeyboardEvent) => {
		if (event.key === 'Escape' && event.target === modalRef.current) {
			handleCloseEvent();
		}
	} : undefined;

	if (variant !== 'modal') {
		const variantClassName = variant === 'dialog' ? 'modal-dialog' : 'modal-popover';
		const handleNativeClose = () => {
			const wasOpen = nativeOpenRef.current;
			nativeOpenRef.current = false;
			if (wasOpen) handleCloseEvent?.();
		};
		const requestNativeClose = () => {
			if (variant === 'dialog') {
				nativeOpenRef.current = false;
				nativeDialogRef.current?.close();
			} else if (typeof nativeDialogRef.current?.hidePopover === 'function') {
				nativeOpenRef.current = false;
				nativeDialogRef.current.hidePopover();
			}
			handleCloseEvent?.();
		};
		const handleNativeCancel = (event: React.SyntheticEvent<HTMLDialogElement>) => {
			event.preventDefault();
			if (handleCloseEvent) {
				requestNativeClose();
			} else {
				requestNativeClose();
			}
		};
		const handlePopoverToggle = (event: React.SyntheticEvent<HTMLDialogElement>) => {
			const toggleEvent = event.nativeEvent as Event & { newState?: string };
			if (toggleEvent.newState === 'closed') {
				handleNativeClose();
			}
		};
		const handleNativeCloseClick = (event: React.MouseEvent<HTMLButtonElement>) => {
			event.preventDefault();
			requestNativeClose();
		};

		return (
			<dialog
				id={myModalID}
				className={variantClassName}
				ref={nativeDialogRef}
				onCancel={handleNativeCancel}
				onClose={handleNativeClose}
				onToggle={variant === 'popover' ? handlePopoverToggle : undefined}
				aria-label={variant === 'popover' ? 'Site alert' : 'Dialog'}
				{...(variant === 'popover' ? { popover: 'manual' as const } : {})}
			>
				<div className="modal-content">
					<button
						id={myModalCloseID}
						className="modal-close"
						aria-label={`Close ${variant}`}
						onClick={handleNativeCloseClick}
						type="button"
					>
						&times;
					</button>
					{modalContent}
				</div>
			</dialog>
		);
	}

	return (
		<div
			id={myModalID}
			className="modal"
			style={{display: isOpen ? 'block' : 'none'}}
			ref={modalRef}
			onClick={handleModalClick}
			onKeyDown={handleModalKeyDown}
			tabIndex={-1}
			role="presentation"
			aria-label="Modal overlay"
		>
			<div className="modal-content" role="dialog" aria-modal="true">
				<button
					id={myModalCloseID}
					className="modal-close"
					aria-label="Close modal"
					onClick={handleCloseClick}
					onKeyDown={handleCloseKeyDown}
					type="button"
				>
					&times;
				</button>
				{ modalContent }
			</div>
		</div>
	);
}

export const handleModalOpen = (event: MouseEvent, modalID?: string) => {
	const myModalID = "myModal" + (modalID ?? '');
	event.preventDefault();
	const myModal = document.getElementById(myModalID);
	if (myModal) { myModal.style.display = 'block'; } ;
};

export type ModalVariant = 'modal' | 'dialog' | 'popover';

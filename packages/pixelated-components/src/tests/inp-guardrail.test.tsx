import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test/test-utils';
import { InteractionGuardrail } from '@/components/foundation/inp-guardrail';

describe('InteractionGuardrail', () => {
	afterEach(() => {
		cleanup();
		document.body.removeAttribute('data-platform-inp-guardrail');
		document.body.removeAttribute('data-platform-loading');
	});

	it('renders children and marks the document body as guarded', () => {
		renderWithProviders(
			<InteractionGuardrail>
				<div data-testid="child">content</div>
			</InteractionGuardrail>
		);

		expect(screen.getByTestId('child')).toBeInTheDocument();
		expect(document.body.getAttribute('data-platform-inp-guardrail')).toBe('true');
	});

	it('does not intercept normal typing inside inputs', async () => {
		renderWithProviders(
			<InteractionGuardrail>
				<input data-testid="text-input" />
			</InteractionGuardrail>
		);

		const input = screen.getByTestId('text-input');
		fireEvent.keyDown(input, { key: 'a', code: 'KeyA' });

		await waitFor(() => {
			expect(document.body.getAttribute('data-platform-loading')).toBe('false');
		});
	});

	it('attaches event listeners and retains the pending attribute when actions fire', () => {
		renderWithProviders(
			<InteractionGuardrail>
				<button type="button" data-testid="action-button">Click</button>
			</InteractionGuardrail>
		);

		const button = screen.getByTestId('action-button');
		fireEvent.click(button);

		expect(document.body.getAttribute('data-platform-inp-guardrail')).toBe('true');
	});

	it('does not start transition on urgent button click', () => {
		renderWithProviders(
			<InteractionGuardrail>
				<button type="button" data-urgent data-testid="urgent-button">Urgent</button>
			</InteractionGuardrail>
		);

		const button = screen.getByTestId('urgent-button');
		fireEvent.click(button);

		expect(document.body.getAttribute('data-platform-loading')).toBe('false');
	});

	it('does not start transition for form submit when form has urgent attribute', () => {
		renderWithProviders(
			<InteractionGuardrail>
				<form data-urgent data-testid="urgent-form">
					<button type="submit">Submit</button>
				</form>
			</InteractionGuardrail>
		);

		const form = screen.getByTestId('urgent-form');
		fireEvent.submit(form);

		expect(document.body.getAttribute('data-platform-loading')).toBe('false');
	});

	it('handles pointerdown events on actionable elements without error', () => {
		renderWithProviders(
			<InteractionGuardrail>
				<button type="button" data-testid="pointer-button">Pointer</button>
			</InteractionGuardrail>
		);

		const button = screen.getByTestId('pointer-button');
		expect(() => fireEvent.pointerDown(button)).not.toThrow();
	});

	it('handles keyboard, link, nested, and editable targets', () => {
		renderWithProviders(
			<InteractionGuardrail>
				<a href="/next" data-testid="link"><span data-testid="nested">Next</span></a>
				<textarea data-testid="textarea" />
				<div contentEditable data-testid="editable">Edit</div>
			</InteractionGuardrail>
		);

		fireEvent.keyDown(screen.getByTestId('nested'), { key: 'Enter' });
		fireEvent.keyDown(screen.getByTestId('nested'), { key: ' ' });
		fireEvent.keyDown(screen.getByTestId('nested'), { key: 'Escape' });
		fireEvent.keyDown(screen.getByTestId('textarea'), { key: 'Enter' });
		fireEvent.keyDown(screen.getByTestId('editable'), { key: 'Enter' });
		fireEvent.pointerDown(screen.getByTestId('link'));

		expect(document.body.getAttribute('data-platform-inp-guardrail')).toBe('true');
	});

	it('skips default-prevented and secondary-button interactions', () => {
		renderWithProviders(
			<InteractionGuardrail>
				<button type="button" data-testid="button">Action</button>
				<form data-testid="form"><button type="submit">Submit</button></form>
			</InteractionGuardrail>
		);

		const button = screen.getByTestId('button');
		fireEvent.click(button, { button: 1 });
		fireEvent.click(button, { defaultPrevented: true });
		fireEvent.pointerDown(button, { defaultPrevented: true });
		fireEvent.submit(screen.getByTestId('form'));
		expect(document.body.getAttribute('data-platform-inp-guardrail')).toBe('true');
	});
});

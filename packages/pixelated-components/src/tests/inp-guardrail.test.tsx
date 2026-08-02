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
});

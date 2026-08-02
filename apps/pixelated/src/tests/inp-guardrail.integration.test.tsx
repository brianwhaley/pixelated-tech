import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { InteractionGuardrail } from '../../../../packages/pixelated-components/src/components/foundation/inp-guardrail';

describe('InteractionGuardrail integration', () => {
	afterEach(() => {
		cleanup();
		document.body.removeAttribute('data-platform-inp-guardrail');
		document.body.removeAttribute('data-platform-loading');
	});

	it('renders the shared guardrail component through the app package export', () => {
		render(
			<InteractionGuardrail>
				<div data-testid="page" />
			</InteractionGuardrail>
		);

		expect(screen.getByTestId('page')).toBeInTheDocument();
		expect(document.body.getAttribute('data-platform-inp-guardrail')).toBe('true');
	});

	it('does not intercept input typing by default', () => {
		render(
			<InteractionGuardrail>
				<input data-testid="text-input" />
			</InteractionGuardrail>
		);

		const input = screen.getByTestId('text-input');
		fireEvent.keyDown(input, { key: 'a', code: 'KeyA' });
		expect(document.body.getAttribute('data-platform-loading')).toBe('false');
	});
});

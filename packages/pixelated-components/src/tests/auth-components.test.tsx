import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderWithoutProviders, screen } from '../test/test-utils';
import { Unauthorized } from '@/components/admin/auth/auth-components';

describe('Unauthorized component', () => {
	it('renders unauthorized message section', () => {
		renderWithoutProviders(<Unauthorized />);
		expect(screen.getByText('You do not have access')).toBeInTheDocument();
		expect(screen.getByText(/signed in, but your account does not have permission/i)).toBeInTheDocument();
	});

	it('includes the PageSection wrapper with correct id', () => {
		renderWithoutProviders(<Unauthorized />);
		const section = document.getElementById('unauthorized-section');
		expect(section).toBeInTheDocument();
		expect(section).toHaveClass('page-section');
	});
});

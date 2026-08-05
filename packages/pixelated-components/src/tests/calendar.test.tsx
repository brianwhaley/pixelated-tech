import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderWithoutProviders, fireEvent, screen } from '../test/test-utils';
import EventCalendar, { testEvents } from '@/components/elements/calendar';

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
const mockEvents = [
	{ id: '1', title: 'Event One', date: `${currentYear}-${currentMonth}-15`, category: 'work' },
	{ id: '2', title: 'Event Two', date: `${currentYear}-${currentMonth}-20`, url: 'https://example.com', category: 'personal' }
];

describe('EventCalendar', () => {
	it('renders current month header and navigation buttons', () => {
		const { container } = renderWithoutProviders(<EventCalendar events={mockEvents} />);
		expect(container.querySelector('.calendar-header')).toBeTruthy();
		expect(screen.getByText(/Prev/i)).toBeInTheDocument();
		expect(screen.getByText(/Today/i)).toBeInTheDocument();
		expect(screen.getByText(/Next/i)).toBeInTheDocument();
	});

	it('renders events on their correct date cells', () => {
		renderWithoutProviders(<EventCalendar events={mockEvents} />);
		expect(screen.getByText('Event One')).toBeInTheDocument();
		expect(screen.getByText('Event Two')).toBeInTheDocument();
	});

	it('navigates to previous month on Prev button click', () => {
		const { container } = renderWithoutProviders(<EventCalendar events={mockEvents} />);
		const header = container.querySelector('.calendar-header h2');
		const prevButton = screen.getByText('< Prev');
		const currentMonth = header?.textContent;
		fireEvent.click(prevButton);
		expect(header?.textContent).not.toBe(currentMonth);
	});

	it('navigates to next month on Next button click', () => {
		const { container } = renderWithoutProviders(<EventCalendar events={mockEvents} />);
		const header = container.querySelector('.calendar-header h2');
		const nextButton = screen.getByText('Next >');
		const currentMonth = header?.textContent;
		fireEvent.click(nextButton);
		expect(header?.textContent).not.toBe(currentMonth);
	});

	it('renders today button and resets displayed month to current', () => {
		const { container } = renderWithoutProviders(<EventCalendar events={mockEvents} />);
		const todayButton = screen.getByText('Today');
		fireEvent.click(todayButton);
		const header = container.querySelector('.calendar-header h2');
		expect(header?.textContent).toContain(new Date().getFullYear().toString());
	});

	it('renders testEvents fallback events without crashing', () => {
		const { container } = renderWithoutProviders(<EventCalendar events={testEvents} />);
		expect(container.querySelector('.calendar-container')).toBeTruthy();
	});
});

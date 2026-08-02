"use client"; 

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import './calendar.css';


export const testEvents = [
	{
		"id": "1",
		"title": "Brian's Birthday",
		"date": "2026-01-22",
		"category": "personal"
	},
	{
		"id": "2",
		"title": "Brian's Birthday",
		"date": "2027-01-22",
		"category": "personal"
	}
];

// 1. Types & Interfaces
export interface CalendarEvent {
  id: string | number;
  title: string;
  date: string; // Expected format: "YYYY-MM-DD"
  category?: string;
  url?: string;
  [key: string]: unknown; // Allows optional extra fields without TS errors
}

export interface EventCalendarProps {
  events?: CalendarEvent[];
}

interface CalendarCell {
  isPadding: boolean;
  dayNumber?: number;
  dateKey?: string;
  events?: CalendarEvent[];
  isToday?: boolean;
  key: string;
}

// Helper: Format Date object to YYYY-MM-DD (Local time, no UTC shifts)
const formatDateKey = (date: Date): string => {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
};

export const EventCalendar: React.FC<EventCalendarProps> = ({ events = [] }) => {
	const [currentDate, setCurrentDate] = useState<Date>(new Date());

	const year = currentDate.getFullYear();
	const month = currentDate.getMonth(); // 0 - 11

	// Navigation Handlers
	const handlePrevMonth = (): void => {
		setCurrentDate(new Date(year, month - 1, 1));
	};

	const handleNextMonth = (): void => {
		setCurrentDate(new Date(year, month + 1, 1));
	};

	const handleToday = (): void => {
		setCurrentDate(new Date());
	};

	// Map events by date key ("YYYY-MM-DD") for O(1) lookup
	const eventsByDate = useMemo(() => {
		return events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
			if (!acc[event.date]) {
				acc[event.date] = [];
			}
			acc[event.date].push(event);
			return acc;
		}, {});
	}, [events]);

	const monthNames: string[] = [
		"January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"
	];

	const dayLabels: string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	// Grid Construction Logic
	const calendarCells = useMemo<CalendarCell[]>(() => {
		const firstDayOfMonth = new Date(year, month, 1);
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const startingDayOfWeek = firstDayOfMonth.getDay();

		const cells: CalendarCell[] = [];

		// Padding cells before the 1st of the month
		for (let i = 0; i < startingDayOfWeek; i++) {
			cells.push({ isPadding: true, key: `pad-${i}` });
		}

		// Actual day cells
		const todayKey = formatDateKey(new Date());
		for (let day = 1; day <= daysInMonth; day++) {
			const cellDate = new Date(year, month, day);
			const dateKey = formatDateKey(cellDate);
			const dayEvents = eventsByDate[dateKey] || [];

			cells.push({
				isPadding: false,
				dayNumber: day,
				dateKey,
				events: dayEvents,
				isToday: todayKey === dateKey,
				key: dateKey
			});
		}

		return cells;
	}, [year, month, eventsByDate]);

	return (
		<div className="calendar-container">
			{/* Header Controls */}
			<div className="calendar-header">
				<h2>{monthNames[month]} {year}</h2>
				<div className="calendar-button-group">
					<button type="button" className="calendar-button" onClick={handlePrevMonth}>&lt; Prev</button>
					<button type="button" className="calendar-button" onClick={handleToday}>Today</button>
					<button type="button" className="calendar-button" onClick={handleNextMonth}>Next &gt;</button>
				</div>
			</div>

			{/* Grid Layout */}
			<div className="calendar-grid">
				{/* Day Header Row */}
				{dayLabels.map((day) => (
					<div key={day} className="day-header">{day}</div>
				))}

				{/* Days Grid */}
				{calendarCells.map((cell) => {
					if (cell.isPadding) {
						return <div key={cell.key} className="cell padding-cell" />;
					}

					return (
						<div key={cell.key} className={`cell ${cell.isToday ? 'today' : ''}`}>
							<div className="day-number">{cell.dayNumber}</div>
							<div className="events-list">
								{cell.events?.map((event) => (
									<div key={event.id} className={`event-badge ${event.category || ''}`}>
										{event.url ? (
											<a href={event.url}>{event.title}</a>
										) : (
											event.title
										)}
									</div>
								))}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default EventCalendar;

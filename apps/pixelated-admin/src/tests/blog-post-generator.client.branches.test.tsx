import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mockToggleLoading = vi.fn();
const mockAction = vi.fn();
const mockDrafts = vi.fn();

vi.mock('@pixelated-tech/components', () => ({
	Accordion: ({ items }: any) => <div>{items.map((item: any) => <div key={item.title}>{item.content}</div>)}</div>,
	FormEngine: ({ onSubmitHandler }: any) => <form onSubmit={onSubmitHandler}><input name="siteName" defaultValue="Example" /><button type="submit">Generate</button></form>,
	Loading: () => <div>Loading</div>,
	PageSection: ({ children }: any) => <div>{children}</div>,
	PageTitleHeader: ({ title }: any) => <h1>{title}</h1>,
	Tab: ({ tabs }: any) => <div>{tabs.map((tab: any) => <section key={tab.id} id={tab.id}>{tab.content}</section>)}</div>,
	ToggleLoading: mockToggleLoading,
}));

describe('Blog Post Generator client branches', () => {
	it('runs create, draft loading, selection, update, and download workflows', async () => {
		const calendar = [{ calendarId: 'calendar-1', title: 'Post', status: 'draft', wordpressPostId: 42 }];
		mockAction.mockResolvedValue({
			calendar,
			results: [{ calendarId: 'calendar-1', title: 'Post', status: 'draft', wordpressPostId: 42 }],
			usage: { model: 'gemini', requestCount: 1, promptTokenCount: 2, candidatesTokenCount: 3, totalTokenCount: 5 },
		});
		mockDrafts.mockResolvedValue([{ id: 42, title: 'Existing Post', modified: '2026-01-01T00:00:00Z' }]);
		const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
		const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
		const { default: Client } = await import('../app/(pages)/blog-post-generator/BlogPostGeneratorClient');
		render(<Client action={mockAction} getExistingDraftsAction={mockDrafts} sites={[{ name: 'Example' }, { name: 'Second' }]} />);

		fireEvent.click(screen.getByRole('button', { name: 'View Existing Drafts' }));
		await waitFor(() => expect(screen.getByText(/Existing Post/)).toBeTruthy());
		fireEvent.click(screen.getByRole('checkbox'));
		fireEvent.click(screen.getByLabelText('Update Content'));
		fireEvent.click(screen.getByRole('button', { name: 'Update Drafts' }));
		await waitFor(() => expect(mockAction).toHaveBeenCalled());
		await waitFor(() => expect(screen.getByRole('button', { name: 'Download updated calendar JSON' })).toBeTruthy());
		fireEvent.click(screen.getByRole('button', { name: 'Download updated calendar JSON' }));
		fireEvent.change(screen.getByLabelText('Site'), { target: { value: 'Second' } });
		fireEvent.submit(screen.getByRole('button', { name: 'Generate' }).closest('form')!);
		expect(createObjectUrl).toHaveBeenCalled();
		expect(revokeObjectUrl).toHaveBeenCalledWith('blob:test');
		expect(mockToggleLoading).toHaveBeenCalled();
	});

	it('renders draft loading errors and empty states', async () => {
		mockDrafts.mockRejectedValue(new Error('draft service down'));
		const { default: Client } = await import('../app/(pages)/blog-post-generator/BlogPostGeneratorClient');
		render(<Client action={mockAction} getExistingDraftsAction={mockDrafts} sites={[]} />);
		fireEvent.click(screen.getByRole('button', { name: 'View Existing Drafts' }));
		await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('draft service down'));
	});
});

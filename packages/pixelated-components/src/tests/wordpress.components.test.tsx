import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import {
	getCachedWordPressItems,
	BlogPostList,
	BlogPostSummary,
	BlogPostCategories
} from '../components/integrations/wordpress.components';
import { renderWithProviders } from '../test/test-utils';

describe('WordPress Components', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getCachedWordPressItems', () => {
		it('should return undefined or array when called', async () => {
			const result = await getCachedWordPressItems({ site: 'example.wordpress.com' });
			expect(result === undefined || Array.isArray(result)).toBe(true);
		});

		it('should handle missing site parameter', async () => {
			const result = await getCachedWordPressItems({ site: '' });
			expect(result).toBeUndefined();
		});

		it('should return undefined when site is omitted entirely', async () => {
			const result = await getCachedWordPressItems();
			expect(result).toBeUndefined();
		});
	});

	describe('BlogPostList Component', () => {
		const mockPosts = [
			{
				ID: 1,
				title: 'First Post',
				excerpt: 'First excerpt',
				date: '2024-01-15',
				URL: 'https://example.com/post-1',
				categories: { Technology: 1, News: 2 },
				featured_image: 'https://example.com/image1.jpg'
			},
			{
				ID: 2,
				title: 'Second Post',
				excerpt: 'Second excerpt',
				date: '2024-01-14',
				URL: 'https://example.com/post-2',
				categories: { Business: 3 },
				featured_image: 'https://example.com/image2.jpg'
			}
		];

		it('should render list of blog posts', () => {
			renderWithProviders(<BlogPostList posts={mockPosts} />);

			expect(screen.getByText('First Post')).toBeInTheDocument();
			expect(screen.getByText('Second Post')).toBeInTheDocument();
		});

		it('should display excerpt for each post', () => {
			renderWithProviders(<BlogPostList posts={mockPosts} />);

			expect(screen.getByText(/First excerpt/)).toBeInTheDocument();
			expect(screen.getByText(/Second excerpt/)).toBeInTheDocument();
		});

		it('should handle empty posts array', async () => {
			const { container } = renderWithProviders(<BlogPostList posts={[]} />);

			await waitFor(() => {
				expect(container.querySelector('.blog-post-summary')).not.toBeInTheDocument();
			});
		});

		it('should render post links', () => {
			renderWithProviders(<BlogPostList posts={mockPosts} />);

			const links = screen.getAllByRole('link');
			expect(links.length).toBeGreaterThan(0);
		});

		it('should pass showCategories prop correctly', () => {
			renderWithProviders(<BlogPostList posts={mockPosts} showCategories={false} />);

			expect(screen.getByText('First Post')).toBeInTheDocument();
		});

		it('should remain wrapped by SmartErrorBoundary and render safely', () => {
			renderWithProviders(<BlogPostList posts={mockPosts} />);

			expect(screen.getByText('First Post')).toBeInTheDocument();
			expect(screen.queryByText(/Sorry, something went wrong loading/i)).not.toBeInTheDocument();
		});
	});

	describe('BlogPostSummary Component', () => {
		const mockPost = {
			ID: 1,
			title: 'Test Post Title',
			excerpt: '<p>Test excerpt content</p>',
			date: '2024-01-15',
			URL: 'https://example.com/test-post',
			categories: { Testing: 1 }
		};

		it('should render post summary', () => {
			renderWithProviders(
				<BlogPostSummary 
					ID={mockPost.ID}
					title={mockPost.title}
					excerpt={mockPost.excerpt}
					date={mockPost.date}
					URL={mockPost.URL}
					categories={mockPost.categories}
				/>
			);
			expect(screen.getByText('Test Post Title')).toBeInTheDocument();
		});

    it('should render summary without featured image when none is provided', () => {
      const { container } = renderWithProviders(
        <BlogPostSummary 
          ID={mockPost.ID}
          title={mockPost.title}
          excerpt={mockPost.excerpt}
          date={mockPost.date}
          URL={mockPost.URL}
          categories={mockPost.categories}
          featured_image={undefined}
        />
      );
      expect(screen.getByText('Test Post Title')).toBeInTheDocument();
      expect(container.querySelector('.article-featured-image')).not.toBeInTheDocument();
    });

    it('should render a featured image when provided', () => {
      const { container } = renderWithProviders(
        <BlogPostSummary 
          ID={mockPost.ID}
          title={mockPost.title}
          excerpt={mockPost.excerpt}
          date={mockPost.date}
          URL={mockPost.URL}
          categories={mockPost.categories}
          featured_image='https://example.com/featured.jpg'
        />
      );
      expect(container.querySelector('.article-featured-image')).toBeInTheDocument();
    });
  });

  describe('BlogPostCategories Component', () => {
    it('renders categories and omits uncategorized entries', () => {
      renderWithProviders(
        <BlogPostCategories categories={['Technology', 'Uncategorized', 'News']} />
      );
      expect(screen.getByRole('img', { name: 'technology' })).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'news' })).toBeInTheDocument();
      expect(screen.queryByRole('img', { name: 'uncategorized' })).not.toBeInTheDocument();
    });

    it('renders nothing when categories are empty', () => {
      const { container } = renderWithProviders(
        <BlogPostCategories categories={[]} />
      );
      expect(container.textContent).toBe('');
    });
  });
});

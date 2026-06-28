import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import {
	BlogPostList,
	BlogPostSummary,
	BlogPostCategories
} from '../components/integrations/wordpress.components';
import { getCachedWordPressItems } from '../components/integrations/wordpress.functions';
import * as wordpressFunctions from '../components/integrations/wordpress.functions';
import { renderWithProviders, createConfig } from '../test/test-utils';

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
			it('renders without throwing when WordPress config is present', async () => {
				const config = createConfig({
					integrations: {
						wordpress: {
							site: 'example.com'
						}
					}
				});

				vi.spyOn(wordpressFunctions, 'getCachedWordPressItems').mockResolvedValue([]);

				renderWithProviders(<BlogPostList />, { config });

				await waitFor(() => {
					expect(screen.queryByText('First Post')).not.toBeInTheDocument();
				});
			});

			it('renders no posts when config site is missing', async () => {
				const config = createConfig({ integrations: {} });
				const { container } = renderWithProviders(<BlogPostList />, { config });

				await waitFor(() => {
					expect(container.querySelector('.blog-post-summary')).not.toBeInTheDocument();
				});
			});

			it('passes showCategories prop correctly', async () => {
				const config = createConfig({
					integrations: {
						wordpress: {
							site: 'example.com'
						}
					}
				});

				vi.spyOn(wordpressFunctions, 'getCachedWordPressItems').mockResolvedValue([
					{
						ID: 1,
						title: 'First Post',
						excerpt: 'First excerpt',
						date: '2024-01-15',
						URL: 'https://example.com/post-1',
						categories: ['Technology', 'News'],
						featured_image: 'https://example.com/image1.jpg'
					}
				]);

				renderWithProviders(<BlogPostList showCategories={false} />, { config });

				await waitFor(() => {
					expect(screen.getByText('First Post')).toBeInTheDocument();
				});
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

    it('should not render category icons when showCategories is false', () => {
      const { container } = renderWithProviders(
        <BlogPostSummary 
          ID={mockPost.ID}
          title={mockPost.title}
          excerpt={mockPost.excerpt}
          date={mockPost.date}
          URL={mockPost.URL}
          categories={mockPost.categories}
          showCategories={false}
        />
      );
      expect(container.querySelectorAll('.p-category').length).toBe(0);
    });

    it('should render without categories when categories prop is missing', () => {
      const { container } = renderWithProviders(
        <BlogPostSummary 
          ID={mockPost.ID}
          title={mockPost.title}
          excerpt={mockPost.excerpt}
          date={mockPost.date}
          URL={mockPost.URL}
        />
      );
      expect(container.querySelectorAll('.p-category').length).toBe(0);
    });
  });

  describe('BlogPostCategories Component', () => {
    it('fetches and renders categories from config', async () => {
      vi.spyOn(wordpressFunctions, 'getWordPressCategories').mockResolvedValue(['Technology', 'News']);

      const config = createConfig({
        integrations: {
          wordpress: {
            site: 'example.com'
          }
        }
      });

      renderWithProviders(<BlogPostCategories />, { config });

      await waitFor(() => {
        expect(screen.getByRole('img', { name: 'technology' })).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'news' })).toBeInTheDocument();
        expect(screen.queryByRole('img', { name: 'uncategorized' })).not.toBeInTheDocument();
      });
    });

		it('fetches categories from config when none are passed', async () => {
			vi.spyOn(wordpressFunctions, 'getWordPressCategories').mockResolvedValue(['Technology', 'News']);

			const config = createConfig({
				integrations: {
					wordpress: {
						site: 'example.com'
					}
				}
			});

			renderWithProviders(<BlogPostCategories />, { config });

			await waitFor(() => {
				expect(screen.getByRole('img', { name: 'technology' })).toBeInTheDocument();
				expect(screen.getByRole('img', { name: 'news' })).toBeInTheDocument();
			});
		});

		it('renders nothing when categories are empty and config is missing', () => {
			const config = createConfig({ integrations: {} });
			const { container } = renderWithProviders(<BlogPostCategories />, { config });
			expect(container.textContent).toBe('');
		});

		it('filters out Uncategorized categories', async () => {
			vi.spyOn(wordpressFunctions, 'getWordPressCategories').mockResolvedValue(['Technology', 'Uncategorized', 'News']);

			const config = createConfig({
				integrations: {
					wordpress: {
						site: 'example.com'
					}
				}
			});

			renderWithProviders(<BlogPostCategories />, { config });

			await waitFor(() => {
				expect(screen.getByRole('img', { name: 'technology' })).toBeInTheDocument();
				expect(screen.getByRole('img', { name: 'news' })).toBeInTheDocument();
				expect(screen.queryByRole('img', { name: 'uncategorized' })).not.toBeInTheDocument();
			});
		});
	});
});

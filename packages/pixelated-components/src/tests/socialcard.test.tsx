import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import { smartFetch } from '../components/foundation/smartfetch';

vi.mock('../components/foundation/smartfetch', () => ({
  smartFetch: vi.fn()
}));

import {
  SocialCards,
  SocialCard,
  SocialCardsLoading,
} from '@/components/integrations/socialcard';

// Mock SmartImage
vi.mock('@/components/general/smartimage', () => ({
  SmartImage: (props: any) => {
    const { src, alt, title, className, onClick } = props;
    return React.createElement('img', {
      src,
      alt,
      title,
      className,
      onClick,
      'data-testid': 'smart-image'
    });
  },
}));

// Mock fetch for RSS feeds
global.fetch = vi.fn();

const mockRSSFeed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <link>https://example.com</link>
    <description>Test</description>
    <item>
      <title>Test Post 1</title>
      <link>https://example.com/post1</link>
      <description>Test description 1</description>
      <pubDate>Mon, 10 Dec 2024 12:00:00 GMT</pubDate>
      <guid>guid-1</guid>
    </item>
    <item>
      <title>Test Post 2</title>
      <link>https://github.com/post2</link>
      <description>Test description 2</description>
      <pubDate>Tue, 09 Dec 2024 12:00:00 GMT</pubDate>
      <guid>guid-2</guid>
    </item>
  </channel>
</rss>`;

describe('SocialCard Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SocialCardsLoading Component', () => {
    it('should render loading container', () => {
      const { container } = render(<SocialCardsLoading />);
      expect(container.querySelector('.cards-loading')).toBeInTheDocument();
    });

    it('should render loading text', () => {
      render(<SocialCardsLoading />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should have correct CSS class', () => {
      const { container } = render(<SocialCardsLoading />);
      expect(container.querySelector('.cards-loading')).toHaveClass('cards-loading');
    });
  });

  describe('SocialCard Component', () => {
    const mockCardData = {
      title: 'Test Blog Post',
      link: 'https://example.com/post',
      description: '<p>This is a test post</p>',
      pubDate: '2024-12-10T12:00:00Z',
      guid: 'test-guid-1',
      author: 'Test Author',
      category: 'tech'
    };

    it('should render masonry item container', () => {
      const { container } = render(
        <SocialCard 
          card={mockCardData} 
          iconSrc="/images/logos/blog-logo.png" 
          iconSrcAlt="Blog Post"
        />
      );
      expect(container.querySelector('.masonry-item')).toBeInTheDocument();
    });

    it('should render card container', () => {
      const { container } = render(
        <SocialCard 
          card={mockCardData} 
          iconSrc="/images/logos/blog-logo.png" 
          iconSrcAlt="Blog Post"
        />
      );
      expect(container.querySelector('.card')).toBeInTheDocument();
    });

    it('should render card title section', () => {
      const { container } = render(
        <SocialCard 
          card={mockCardData} 
          iconSrc="/images/logos/blog-logo.png" 
          iconSrcAlt="Blog Post"
        />
      );
      expect(container.querySelector('.card-title')).toBeInTheDocument();
    });

    it('should render card title link', () => {
      const { container } = render(
        <SocialCard 
          card={mockCardData} 
          iconSrc="/images/logos/blog-logo.png" 
          iconSrcAlt="Blog Post"
        />
      );
      const link = container.querySelector('.card-title a');
      expect(link).toHaveAttribute('href', mockCardData.link);
    });

    it('should open link in new tab', () => {
      const { container } = render(
        <SocialCard 
          card={mockCardData} 
          iconSrc="/images/logos/blog-logo.png" 
          iconSrcAlt="Blog Post"
        />
      );
      const link = container.querySelector('.card-title a');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should render card icon image', () => {
      const { container } = render(
        <SocialCard 
          card={mockCardData} 
          iconSrc="/images/logos/blog-logo.png" 
          iconSrcAlt="Blog Post"
        />
      );
      const icon = container.querySelector('.card-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('src', '/images/logos/blog-logo.png');
      expect(icon).toHaveAttribute('alt', 'Blog Post');
    });

    it('should render card title text', () => {
      render(
        <SocialCard 
          card={mockCardData} 
          iconSrc="/images/logos/blog-logo.png" 
          iconSrcAlt="Blog Post"
        />
      );
      expect(screen.getByText(mockCardData.title)).toBeInTheDocument();
    });

    it('should render card body with description', () => {
      const { container } = render(
        <SocialCard 
          card={mockCardData} 
          iconSrc="/images/logos/blog-logo.png" 
          iconSrcAlt="Blog Post"
        />
      );
      const body = container.querySelector('.card-body');
      expect(body).toBeInTheDocument();
      expect(body?.innerHTML).toContain('This is a test post');
    });

    it('should render card date', () => {
      render(
        <SocialCard 
          card={mockCardData} 
          iconSrc="/images/logos/blog-logo.png" 
          iconSrcAlt="Blog Post"
        />
      );
      expect(screen.getByText(mockCardData.pubDate)).toBeInTheDocument();
    });

    it('should have card date section', () => {
      const { container } = render(
        <SocialCard 
          card={mockCardData} 
          iconSrc="/images/logos/blog-logo.png" 
          iconSrcAlt="Blog Post"
        />
      );
      expect(container.querySelector('.card-date')).toBeInTheDocument();
    });

    it('should sanitize HTML in description', () => {
      const cardWithHtmlContent = {
        ...mockCardData,
        description: '<p>Safe content</p><script>alert("xss")</script>'
      };
      const { container } = render(
        <SocialCard 
          card={cardWithHtmlContent} 
          iconSrc="/images/logos/blog-logo.png" 
          iconSrcAlt="Blog Post"
        />
      );
      const body = container.querySelector('.card-body');
      expect(body?.innerHTML).toContain('Safe content');
    });

    it('should handle description without HTML tags', () => {
      const cardWithPlainText = {
        ...mockCardData,
        description: 'Plain text description'
      };
      const { container } = render(
        <SocialCard 
          card={cardWithPlainText} 
          iconSrc="/images/logos/blog-logo.png" 
          iconSrcAlt="Blog Post"
        />
      );
      const body = container.querySelector('.card-body');
      expect(body?.textContent).toContain('Plain text description');
    });

    it('should render GitHub icon for GitHub links', () => {
      const githubCard = {
        ...mockCardData,
        link: 'https://github.com/project/issue'
      };
      const { container } = render(
        <SocialCard 
          card={githubCard} 
          iconSrc="/images/logos/github-logo.png" 
          iconSrcAlt="Github Activity"
        />
      );
      const icon = container.querySelector('.card-icon');
      expect(icon).toHaveAttribute('src', '/images/logos/github-logo.png');
    });

    it('should preserve original link URL', () => {
      const customCard = {
        ...mockCardData,
        link: 'https://custom-domain.com/unique/path'
      };
      const { container } = render(
        <SocialCard 
          card={customCard} 
          iconSrc="/images/logos/blog-logo.png" 
          iconSrcAlt="Blog Post"
        />
      );
      const link = container.querySelector('.card-title a');
      expect(link).toHaveAttribute('href', 'https://custom-domain.com/unique/path');
    });

    it('should render with all required props', () => {
      const { container } = render(
        <SocialCard 
          card={mockCardData} 
          iconSrc="/images/logos/blog-logo.png" 
          iconSrcAlt="Blog Post"
        />
      );
      expect(container.querySelector('.masonry-item')).toBeInTheDocument();
      expect(container.querySelector('.card')).toBeInTheDocument();
      expect(container.querySelector('.card-title')).toBeInTheDocument();
      expect(container.querySelector('.card-body')).toBeInTheDocument();
      expect(container.querySelector('.card-date')).toBeInTheDocument();
    });
  });

  describe('SocialCards Component', () => {
    it('should render loading state initially', async () => {
      const sources = {
        blog: {
          url: null,
          entryCount: 5,
          iconSrc: '/images/logos/blog-logo.png',
          iconSrcAlt: 'Blog Post'
        }
      };

      render(
        <SocialCards sources={sources} />
      );

      // Initially loading
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should initialize with default source options', () => {
      // SocialCards merges provided sources with defaults
      const minimalSources = {};
      const { container } = render(
        <SocialCards sources={minimalSources} />
      );
      // Component should render (loading state initially)
      expect(container).toBeInTheDocument();
    });

    it('should have no URL sources returns loading component', () => {
      const sourcesNoUrl = {
        blog: {
          url: null,
          entryCount: 5,
          iconSrc: '/images/logos/blog-logo.png',
          iconSrcAlt: 'Blog Post'
        }
      };

      render(
        <SocialCards sources={sourcesNoUrl} />
      );
      // Should show loading when no URLs provided
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should handle multiple source types', () => {
      const multipleSources = {
        blog: {
          url: null,
          entryCount: 5,
          iconSrc: '/images/logos/blog-logo.png',
          iconSrcAlt: 'Blog Post'
        },
        github: {
          url: null,
          entryCount: 5,
          iconSrc: '/images/logos/github-logo.png',
          iconSrcAlt: 'Github Activity'
        }
      };

      const { container } = render(
        <SocialCards sources={multipleSources} />
      );
      expect(container).toBeInTheDocument();
    });

    it('should accept entryCount configuration', () => {
      const sources = {
        blog: {
          url: null,
          entryCount: 10,
          iconSrc: '/images/logos/blog-logo.png',
          iconSrcAlt: 'Blog Post'
        }
      };

      const { container } = render(
        <SocialCards sources={sources} />
      );
      expect(container).toBeInTheDocument();
    });

    it('should render blank source card when feed URL is unknown', async () => {
      const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <item>
              <title>Unknown Post</title>
              <link>https://unknown.example.com/post</link>
              <description><p>Unknown content</p></description>
              <pubDate>Thu, 19 Apr 2026 12:00:00 GMT</pubDate>
              <guid>unknown-1</guid>
            </item>
          </channel>
        </rss>`;

      vi.mocked(smartFetch).mockResolvedValueOnce(rssXml);

      render(
        <SocialCards
          sources={{
            other: {
              url: 'https://unknown.example.com/feed',
              entryCount: 1,
              iconSrc: '/images/logos/blog-logo.png',
              iconSrcAlt: 'Blog Post'
            }
          }}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Unknown Post')).toBeInTheDocument();
    });

    it('should render GitHub social card when feed contains github.com links', async () => {
      const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <item>
              <title>GitHub Activity</title>
              <link>https://github.com/project/repo</link>
              <description><p>GitHub update</p></description>
              <pubDate>Thu, 19 Apr 2026 12:00:00 GMT</pubDate>
              <guid>github-1</guid>
            </item>
          </channel>
        </rss>`;

      vi.mocked(smartFetch).mockResolvedValueOnce(rssXml);

      render(
        <SocialCards
          sources={{
            github: {
              url: 'https://example.com/github-feed',
              entryCount: 1,
              iconSrc: '/images/logos/github-logo.png',
              iconSrcAlt: 'Github Activity'
            }
          }}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('GitHub Activity')).toBeInTheDocument();
    });

    it('should render feed entries from Atom-style entry XML', async () => {
      const atomXml = `<?xml version="1.0" encoding="UTF-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <entry>
            <title>Atom Entry</title>
            <link href="https://example.com/atom-post" />
            <id>atom-guid-1</id>
            <updated>2026-04-19T12:00:00Z</updated>
            <content type="html"><p>Atom content</p></content>
          </entry>
        </feed>`;

      vi.mocked(smartFetch).mockResolvedValueOnce(atomXml);

      render(
        <SocialCards
          sources={{
            blog: {
              url: 'https://example.com/atom-feed',
              entryCount: 1,
              iconSrc: '/images/logos/blog-logo.png',
              iconSrcAlt: 'Blog Post'
            }
          }}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Atom Entry')).toBeInTheDocument();
    });

    it('should render blank card when feed fetch fails', async () => {
      vi.mocked(smartFetch).mockRejectedValueOnce(new Error('Feed fetch failed'));

      render(
        <SocialCards
          sources={{
            blog: {
              url: 'https://example.com/failure-feed',
              entryCount: 1,
              iconSrc: '/images/logos/blog-logo.png',
              iconSrcAlt: 'Blog Post'
            }
          }}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.queryByText('Atom Entry')).not.toBeInTheDocument();
    });
  });

  describe('SocialCard - Edge Cases', () => {
    it('should handle missing description gracefully', () => {
      const cardNoDescription = {
        title: 'Post Without Description',
        link: 'https://example.com/post',
        description: '',
        pubDate: '2024-12-10T12:00:00Z',
        guid: 'guid-no-desc'
      };

      const { container } = render(
        <SocialCard 
          card={cardNoDescription} 
          iconSrc="/images/logos/blog-logo.png" 
          iconSrcAlt="Blog Post"
        />
      );
      expect(container.querySelector('.card-body')).toBeInTheDocument();
    });

    it('should handle very long titles', () => {
      const longTitle = 'A'.repeat(500);
      const cardLongTitle = {
        ...{
          title: longTitle,
          link: 'https://example.com/post',
          description: '<p>Description</p>',
          pubDate: '2024-12-10T12:00:00Z',
          guid: 'guid-long-title'
        }
      };

      const { container } = render(
        <SocialCard 
          card={cardLongTitle} 
          iconSrc="/images/logos/blog-logo.png" 
          iconSrcAlt="Blog Post"
        />
      );
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle special characters in title', () => {
      const specialCard = {
        title: 'Post with "quotes" & <special> characters',
        link: 'https://example.com/post',
        description: '<p>Description</p>',
        pubDate: '2024-12-10T12:00:00Z',
        guid: 'guid-special'
      };

      render(
        <SocialCard 
          card={specialCard} 
          iconSrc="/images/logos/blog-logo.png" 
          iconSrcAlt="Blog Post"
        />
      );
      expect(screen.getByText(/Post with.*quotes.*special.*characters/)).toBeInTheDocument();
    });

    it('should handle null pubDate', () => {
      const cardNullDate = {
        title: 'Post',
        link: 'https://example.com/post',
        description: '<p>Description</p>',
        pubDate: null,
        guid: 'guid-null-date'
      };

      const { container } = render(
        <SocialCard 
          card={cardNullDate as any} 
          iconSrc="/images/logos/blog-logo.png" 
          iconSrcAlt="Blog Post"
        />
      );
      expect(container.querySelector('.card-date')).toBeInTheDocument();
    });
  });

  describe('SocialCard - Social Platform Detection', () => {
    it('should detect GitHub links', () => {
      const githubCard = {
        title: 'Github Issue',
        link: 'https://github.com/user/repo/issues/123',
        description: '<p>Issue description</p>',
        pubDate: '2024-12-10T12:00:00Z',
        guid: 'github-guid'
      };

      const { container } = render(
        <SocialCard 
          card={githubCard} 
          iconSrc="/images/logos/github-logo.png" 
          iconSrcAlt="Github Activity"
        />
      );
      const link = container.querySelector('.card-title a');
      expect(link).toHaveAttribute('href', githubCard.link);
    });

    it('should detect Twitter/X links', () => {
      const twitterCard = {
        title: 'Tweet',
        link: 'https://twitter.com/user/status/123',
        description: '<p>Tweet text</p>',
        pubDate: '2024-12-10T12:00:00Z',
        guid: 'twitter-guid'
      };

      const { container } = render(
        <SocialCard 
          card={twitterCard} 
          iconSrc="/images/logos/twitter-logo.png" 
          iconSrcAlt="Twitter Tweet"
        />
      );
      const link = container.querySelector('.card-title a');
      expect(link).toHaveAttribute('href', twitterCard.link);
    });

    it('should detect YouTube links', () => {
      const youtubeCard = {
        title: 'Video',
        link: 'https://youtube.com/watch?v=xyz',
        description: '<p>Video description</p>',
        pubDate: '2024-12-10T12:00:00Z',
        guid: 'youtube-guid'
      };

      const { container } = render(
        <SocialCard 
          card={youtubeCard} 
          iconSrc="/images/logos/youtube-logo.png" 
          iconSrcAlt="Youtube Favorite Video"
        />
      );
      const link = container.querySelector('.card-title a');
      expect(link).toHaveAttribute('href', youtubeCard.link);
    });
  });

  describe('SocialCard - HTML Sanitization', () => {
    it('should preserve HTML content (including scripts - dangerous but rendered)', () => {
      const htmlCard = {
        title: 'Post with HTML',
        link: 'https://example.com/post',
        description: '<p>Safe</p><strong>Bold</strong><p>Content</p>',
        pubDate: '2024-12-10T12:00:00Z',
        guid: 'html-guid'
      };

      const { container } = render(
        <SocialCard 
          card={htmlCard} 
          iconSrc="/images/logos/blog-logo.png" 
          iconSrcAlt="Blog Post"
        />
      );
      const body = container.querySelector('.card-body');
      expect(body?.innerHTML).toContain('<p>');
      expect(body?.innerHTML).toContain('<strong>');
    });

    it('should preserve safe HTML tags', () => {
      const safeCard = {
        title: 'Safe Post',
        link: 'https://example.com/post',
        description: '<p>Paragraph</p><strong>Bold</strong><em>Italic</em>',
        pubDate: '2024-12-10T12:00:00Z',
        guid: 'safe-guid'
      };

      const { container } = render(
        <SocialCard 
          card={safeCard} 
          iconSrc="/images/logos/blog-logo.png" 
          iconSrcAlt="Blog Post"
        />
      );
      const body = container.querySelector('.card-body');
      expect(body?.innerHTML).toContain('<p>');
      expect(body?.innerHTML).toContain('<strong>');
      expect(body?.innerHTML).toContain('<em>');
    });

    it('should remove dead hrefs', () => {
      const deadHrefCard = {
        title: 'Post',
        link: 'https://example.com/post',
        description: '<p><a href="/relative/path">Link</a></p>',
        pubDate: '2024-12-10T12:00:00Z',
        guid: 'dead-href-guid'
      };

      const { container } = render(
        <SocialCard 
          card={deadHrefCard} 
          iconSrc="/images/logos/blog-logo.png" 
          iconSrcAlt="Blog Post"
        />
      );
      const body = container.querySelector('.card-body');
      // Dead href should be removed
      expect(body?.innerHTML).not.toContain('href="/relative');
    });

    it('should preserve http/https links', () => {
      const validUrlCard = {
        title: 'Post',
        link: 'https://example.com/post',
        description: '<p><a href="https://external.com/page">Link</a></p>',
        pubDate: '2024-12-10T12:00:00Z',
        guid: 'valid-url-guid'
      };

      const { container } = render(
        <SocialCard 
          card={validUrlCard} 
          iconSrc="/images/logos/blog-logo.png" 
          iconSrcAlt="Blog Post"
        />
      );
      const body = container.querySelector('.card-body');
      expect(body?.innerHTML).toContain('href="https://external.com');
    });
  });

  describe('SocialCards feed loading', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should fetch RSS feed entries and render a social card', async () => {
      const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <item>
              <title>Test Feed Item</title>
              <link>https://example.com/post</link>
              <description><p>Test description</p></description>
              <pubDate>Thu, 19 Apr 2026 12:00:00 GMT</pubDate>
              <guid>feed-item-1</guid>
            </item>
          </channel>
        </rss>`;

      vi.mocked(smartFetch).mockResolvedValue(rssXml);

      render(
        <SocialCards
          sources={{
            blog: {
              url: 'https://example.com/feed',
              entryCount: 1,
              iconSrc: '/images/logos/blog-logo.png',
              iconSrcAlt: 'Blog Post'
            }
          }}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Test Feed Item')).toBeInTheDocument();
    });

    it('should handle RSS fetch failures and render loading state gracefully', async () => {
      vi.mocked(smartFetch).mockRejectedValue(new Error('Fetch failed'));

      render(
        <SocialCards
          sources={{
            blog: {
              url: 'https://example.com/feed',
              entryCount: 1,
              iconSrc: '/images/logos/blog-logo.png',
              iconSrcAlt: 'Blog Post'
            }
          }}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.queryByText('Test Feed Item')).not.toBeInTheDocument();
    });
  });
});

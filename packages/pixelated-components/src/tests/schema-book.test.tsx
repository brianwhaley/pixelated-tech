import React from 'react';
import { renderWithConfig } from '../test/test-utils';
import { SchemaBook } from '@/components/foundation/schema';

describe('SchemaBook component', () => {
  it('renders a JSON-LD script tag for a book', () => {
    const book = {
      name: 'Test Book',
      description: 'A description',
      genre: ['Fiction', 'Mystery'],
      isFamilyFriendly: 'true',
    };

    const { container } = renderWithConfig(<SchemaBook book={book} />);
    const script = container.querySelector('script[type="application/ld+json"]');

    expect(script).not.toBeNull();
    expect(script?.textContent).toContain('Test Book');
    expect(script?.textContent).toContain('Fiction');
    expect(script?.textContent).toContain('Mystery');
    expect(script?.textContent).toContain('true');
  });

  it('accepts genre as an array of strings', () => {
    const book = {
      name: 'Genre Array Book',
      genre: ['History', 'Biography'],
    };

    const { container } = renderWithConfig(<SchemaBook book={book} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = script?.textContent ? JSON.parse(script.textContent) : null;

    expect(schema).toBeDefined();
    expect(Array.isArray(schema.genre)).toBe(true);
    expect(schema.genre).toEqual(['History', 'Biography']);
  });

  it('normalizes isFamilyFriendly string values into boolean', () => {
    const book = {
      name: 'Family Friendly Book',
      isFamilyFriendly: 'yes',
    };

    const { container } = renderWithConfig(<SchemaBook book={book} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = script?.textContent ? JSON.parse(script.textContent) : null;

    expect(schema).toBeDefined();
    expect(schema.isFamilyFriendly).toBe(true);
  });

  it('includes sameAs on the book when present', () => {
    const book = {
      name: 'SameAs Book',
      sameAs: [
        'https://example.com/book-page',
        'https://goodreads.com/book/show/12345',
      ],
    };

    const { container } = renderWithConfig(<SchemaBook book={book} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = script?.textContent ? JSON.parse(script.textContent) : null;

    expect(schema).toBeDefined();
    expect(schema.sameAs).toEqual([
      'https://example.com/book-page',
      'https://goodreads.com/book/show/12345',
    ]);
  });
});

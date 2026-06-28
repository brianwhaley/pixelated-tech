import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render, renderWithProviders } from '../test/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoremIpsum } from '@/components/integrations/loremipsum';
import { pixelatedConfig } from '../test/test-data';

describe('LoremIpsum', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches default 1 paragraph and renders it (direct)', async () => {
    const mock = vi.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify({ paragraphs: ['one'] }) });
    // @ts-ignore
    global.fetch = mock;

    renderWithProviders(<LoremIpsum />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('one')).toBeInTheDocument());
    expect(mock).toHaveBeenCalledWith(expect.stringContaining('https://lorem-api.com/api/lorem?paragraphs=1'), expect.anything());
  });

  it('retries via proxy when direct fetch fails and proxy is configured', async () => {
    const failFirst = vi.fn()
      .mockRejectedValueOnce(new TypeError('Network error'))
      .mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify({ paragraphs: ['proxied'] }) });
    // @ts-ignore
    global.fetch = failFirst;

    renderWithProviders(<LoremIpsum paragraphs={1} />);
    await waitFor(() => expect(screen.getByText('proxied')).toBeInTheDocument());
    expect(failFirst).toHaveBeenNthCalledWith(1, expect.stringContaining('https://lorem-api.com/api/lorem?paragraphs=1'), expect.anything());
    expect(failFirst).toHaveBeenNthCalledWith(2, expect.stringContaining(encodeURIComponent('https://lorem-api.com/api/lorem?paragraphs=1')), expect.anything());
  });

  it('uses global proxy from usePixelatedConfig', async () => {
    const GLOBAL = pixelatedConfig?.integrations?.global?.proxyUrl;

    const failFirst = vi.fn()
      .mockRejectedValueOnce(new TypeError('Network error'))
      .mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify({ paragraphs: ['globally-proxied'] }) });
    // @ts-ignore
    global.fetch = failFirst;

    renderWithProviders(<LoremIpsum paragraphs={1} />);
    await waitFor(() => expect(screen.getByText('globally-proxied')).toBeInTheDocument());

    // first call = direct, second call = global proxy
    expect(failFirst).toHaveBeenNthCalledWith(1, expect.stringContaining('https://lorem-api.com/api/lorem?paragraphs=1'), expect.anything());
    expect(failFirst).toHaveBeenNthCalledWith(2, expect.stringContaining(encodeURIComponent('https://lorem-api.com/api/lorem?paragraphs=1')), expect.anything());
    if (GLOBAL) {
      expect(failFirst).toHaveBeenNthCalledWith(2, expect.stringContaining(GLOBAL), expect.anything());
    }
  });

  it('splits JSON string into paragraphs', async () => {
    const payload = JSON.stringify('para one\n\npara two');
    // @ts-ignore
    global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => payload });

    renderWithProviders(<LoremIpsum />);
    await waitFor(() => expect(screen.getByText('para one')).toBeInTheDocument());
    expect(screen.getByText('para two')).toBeInTheDocument();
  });

  it('parses JSON object with paragraphs into separate paragraphs', async () => {
    const payload = JSON.stringify({ paragraphs: ['first paragraph', 'second paragraph'] });
    // @ts-ignore
    global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => payload });

    renderWithProviders(<LoremIpsum />);
    await waitFor(() => expect(screen.getByText('first paragraph')).toBeInTheDocument());
    expect(screen.getByText('second paragraph')).toBeInTheDocument();
  });

  it('parses JSON object with text property into paragraph elements', async () => {
    const payload = JSON.stringify({ text: 'line one\n\nline two' });
    // @ts-ignore
    global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => payload });

    renderWithProviders(<LoremIpsum />);
    await waitFor(() => expect(screen.getByText('line one')).toBeInTheDocument());
    expect(screen.getByText('line two')).toBeInTheDocument();
  });
});

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test/test-utils';
import { LoremIpsum } from '../components/integrations/loremipsum';
import { smartFetch } from '../components/foundation/smartfetch';

vi.mock('../components/foundation/smartfetch', () => ({
  smartFetch: vi.fn(),
}));

describe('LoremIpsum Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders paragraphs when API returns a JSON array', async () => {
    (vi.mocked(smartFetch) as any).mockResolvedValueOnce(JSON.stringify(['First paragraph', 'Second paragraph']));

    renderWithProviders(<LoremIpsum paragraphs={2} />);

    await waitFor(() => expect(screen.getByText('First paragraph')).toBeInTheDocument());
    expect(screen.getByText('Second paragraph')).toBeInTheDocument();
  });

  it('renders plain text paragraphs when JSON parsing fails', async () => {
    (vi.mocked(smartFetch) as any).mockResolvedValueOnce('Line one\nLine two');

    renderWithProviders(<LoremIpsum paragraphs={2} />);

    await waitFor(() => expect(screen.getByText('Line one')).toBeInTheDocument());
    expect(screen.getByText('Line two')).toBeInTheDocument();
  });

  it('renders paragraphs from a JSON object with paragraphs property', async () => {
    (vi.mocked(smartFetch) as any).mockResolvedValueOnce(JSON.stringify({ paragraphs: ['First', 'Second'] }));

    renderWithProviders(<LoremIpsum paragraphs={2} />);

    await waitFor(() => expect(screen.getByText('First')).toBeInTheDocument());
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('renders paragraphs from a JSON object with text property', async () => {
    (vi.mocked(smartFetch) as any).mockResolvedValueOnce(JSON.stringify({ text: 'Alpha\nBeta' }));

    renderWithProviders(<LoremIpsum paragraphs={2} />);

    await waitFor(() => expect(screen.getByText('Alpha')).toBeInTheDocument());
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('displays an error message when the fetch fails', async () => {
    (vi.mocked(smartFetch) as any).mockRejectedValueOnce(new Error('Network failure'));

    renderWithProviders(<LoremIpsum paragraphs={1} />, { config: {} });

    await waitFor(() => expect(screen.getByText('Network failure')).toBeInTheDocument());
  });
});

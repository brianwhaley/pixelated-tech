// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderWithProviders } from '../test/test-utils';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { NerdJoke } from '../components/pixelated/nerdjoke';
import { smartFetch } from '../components/foundation/smartfetch';
import { pixelatedConfig } from '../test/test-data';

vi.mock('../components/foundation/smartfetch', () => ({
  smartFetch: vi.fn(),
}));

const mockJokeData = {
  question: 'Why did the programmer quit his job?',
  answer: 'Because he didn\'t get arrays.'
};

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockJokeData),
  })
) as any;

describe('NerdJoke Component', () => {
  beforeEach(() => {
    vi.mocked(smartFetch).mockResolvedValue(mockJokeData as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    cleanup();
  });

  describe('Basic Rendering', () => {
    it('should render main nerdJoke container', () => {
      const { container } = renderWithProviders(<NerdJoke />);
      expect(container.querySelector('.nerd-joke')).toBeInTheDocument();
    });

    it('should render row-12col grid container', () => {
      const { container } = renderWithProviders(<NerdJoke />);
      expect(container.querySelector('.row-12col')).toBeInTheDocument();
    });

    it('should render both buttons', () => {
      renderWithProviders(<NerdJoke />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('should render pause/play button', () => {
      const { container } = renderWithProviders(<NerdJoke />);
      const pauseButton = container.querySelector('.left button');
      expect(pauseButton?.textContent).toContain('Pause');
    });

    it('should render next joke button', () => {
      const { container } = renderWithProviders(<NerdJoke />);
      const nextButton = container.querySelector('.right button');
      expect(nextButton?.textContent).toContain('Next Joke');
    });

    it('should load and display the initial joke from smartFetch', async () => {
      renderWithProviders(<NerdJoke />);

      await screen.findByText(/Why did the programmer quit his job\?/);
      expect(screen.getByText(/Because he didn't get arrays\./)).toBeInTheDocument();
    });

    it('should fetch a new joke when Next Joke button is clicked', async () => {
      const nextJoke = { question: 'What do you call a programmer from Finland?', answer: 'Nerdic.' };
      vi.mocked(smartFetch).mockResolvedValueOnce(mockJokeData as any).mockResolvedValueOnce(nextJoke as any);

      renderWithProviders(<NerdJoke />);
      await screen.findByText(/Why did the programmer quit his job\?/);

      const nextButton = screen.getByRole('button', { name: /Next Joke/i });
      nextButton.click();

      await screen.findByText(/What do you call a programmer from Finland\?/);
      expect(screen.getByText(/Nerdic\./)).toBeInTheDocument();
    });

    it('should handle smartFetch failures without crashing', async () => {
      vi.mocked(smartFetch).mockRejectedValueOnce(new Error('Fetch failed'));
      renderWithProviders(<NerdJoke />);

      await waitFor(() => {
        expect(vi.mocked(smartFetch)).toHaveBeenCalled();
      });
      expect(screen.getByText(/Q:/)).toBeInTheDocument();
    });

    it('should render joke timer section', () => {
      const { container } = renderWithProviders(<NerdJoke />);
      expect(container.querySelector('.joke-timer')).toBeInTheDocument();
    });

    it('should render joke text section', () => {
      const { container } = renderWithProviders(<NerdJoke />);
      expect(container.querySelector('.joke-text')).toBeInTheDocument();
    });

    it('should render svg timer element', () => {
      const { container } = renderWithProviders(<NerdJoke />);
      expect(container.querySelector('.joke-timer-svg')).toBeInTheDocument();
    });

    it('should have grid layout classes', () => {
      const { container } = renderWithProviders(<NerdJoke />);
      expect(container.querySelector('.grid-s1-e5')).toBeInTheDocument();
      expect(container.querySelector('.grid-s9-e13')).toBeInTheDocument();
      expect(container.querySelector('.grid-s1-e13')).toBeInTheDocument();
      expect(container.querySelector('.grid-s1-e11')).toBeInTheDocument();
      expect(container.querySelector('.grid-s11-e13')).toBeInTheDocument();
    });
  });

  describe('Button Functionality', () => {
    it('should render pause button with correct class', () => {
      const { container } = renderWithProviders(<NerdJoke />);
      const buttons = container.querySelectorAll('button');
      expect(buttons[0]).toHaveClass('joke-button');
    });

    it('should render next joke button with correct class', () => {
      const { container } = renderWithProviders(<NerdJoke />);
      const buttons = container.querySelectorAll('button');
      expect(buttons[1]).toHaveClass('joke-button');
    });

    it('should toggle pause/play state when pause button is clicked', async () => {
      vi.useFakeTimers();
      renderWithProviders(<NerdJoke />);

      const pauseButton = screen.getByRole('button', { name: /Pause/i });
      fireEvent.click(pauseButton);
      fireEvent.click(pauseButton);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText(/Q:/)).toBeInTheDocument();
      vi.useRealTimers();
    });
  });
});

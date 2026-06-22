/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '../test/test-utils';
import { screen, waitFor } from '@testing-library/react';
import React, { useState, useEffect } from 'react';
import { SiteHealthAxeCore } from '../components/admin/site-health/site-health-axe-core';
import type { AxeCoreResponse, AxeCoreData } from '../components/admin/site-health/site-health-types';
import { mockAxeCoreResponse, mockAxeCoreData, mockAxeCoreViolation } from '../test/test-data';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the SiteHealthTemplate component
vi.mock('../components/admin/site-health/site-health-template', () => ({
  SiteHealthTemplate: ({ children, endpoint, siteName }: any) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [data, setData] = useState(null);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [loading, setLoading] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [error, setError] = useState<string | null>(null);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (!siteName) return;

      setLoading(true);
      // Simulate the endpoint call
      const url = `http://localhost:3000${endpoint.endpoint}?siteName=${siteName}`;
      global.fetch(url, { method: 'GET' })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(result => {
          if (!result.success) {
            throw new Error(result.error || 'API request failed');
          }
          return endpoint.responseTransformer ? endpoint.responseTransformer(result) : result;
        })
        .then(setData)
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
    }, [siteName, endpoint]);

    if (!siteName) return null;
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    return <>{children(data)}</>;
  }
}));

describe('SiteHealthAxeCore', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  const mockResponse: AxeCoreResponse = mockAxeCoreResponse;
  const mockData: AxeCoreData = mockAxeCoreData;
  const mockViolation = mockAxeCoreViolation;

  it('renders nothing when no siteName is provided', () => {
    const { container } = render(<SiteHealthAxeCore siteName="" />);
    expect(container.firstChild).toBeNull();
  });

  it('fetches data and renders site information', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    render(<SiteHealthAxeCore siteName="test-site" />);

    await waitFor(() => {
      expect(screen.getByText('test site')).toBeInTheDocument();
    });

    expect(screen.getByText('URL: https://test-site.com')).toBeInTheDocument();
  });

  it('displays accessibility summary statistics', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    render(<SiteHealthAxeCore siteName="test-site" />);

    await waitFor(() => {
      expect(screen.getByText('Accessibility Summary')).toBeInTheDocument();
    });

    expect(screen.getByText('Violations :')).toBeInTheDocument();
    expect(screen.getByText('Passes :')).toBeInTheDocument();
    expect(screen.getByText('Incomplete :')).toBeInTheDocument();
  });

  it('renders violation details with impact indicators', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    render(<SiteHealthAxeCore siteName="test-site" />);

    await waitFor(() => {
      expect(screen.getByText('Accessibility Violations')).toBeInTheDocument();
    });

    expect(screen.getByText('Elements must have sufficient color contrast')).toBeInTheDocument();
  });

  it('displays error message when API fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: false,
        error: 'API Error'
      })
    });

    render(<SiteHealthAxeCore siteName="test-site" />);

    await waitFor(() => {
      expect(screen.getByText('Error: API Error')).toBeInTheDocument();
    });
  });

  it('renders violation details with long HTML truncated', async () => {
    const longHtml = '<div>' + 'a'.repeat(200) + '</div>';
    const violationWithLongHtml = {
      ...mockViolation,
      nodes: [{
        target: [], // No target to trigger HTML fallback
        html: longHtml,
        failureSummary: 'Fix it'
      }]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: [{ ...mockData, result: { ...mockData.result, violations: [violationWithLongHtml] } }]
      })
    });

    render(<SiteHealthAxeCore siteName="test-site" />);

    await waitFor(() => {
      // The truncation adds '...' and limits to 100 chars
      expect(screen.getByText(/aaaaaaaaaa\.\.\./)).toBeInTheDocument();
    });
  });

  it('renders violation details with target selectors', async () => {
    const violationWithTarget = {
      ...mockViolation,
      nodes: [{
        target: ['.class1', '#id2'],
        html: '<div />',
        failureSummary: 'Fix it'
      }]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: [{ ...mockData, result: { ...mockData.result, violations: [violationWithTarget] } }]
      })
    });

    render(<SiteHealthAxeCore siteName="test-site" />);

    await waitFor(() => {
      expect(screen.getByText('.class1, #id2')).toBeInTheDocument();
    });
  });

  it('displays violation impact levels summary', async () => {
    const mockDataWithAllImpacts = {
      ...mockData,
      summary: {
        ...mockData.summary,
        critical: 1, serious: 1, moderate: 1, minor: 1, violations: 4
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: [mockDataWithAllImpacts]
      })
    });

    render(<SiteHealthAxeCore siteName="test-site" />);

    await waitFor(() => {
      expect(screen.getByText('Violation Impact Levels')).toBeInTheDocument();
      expect(screen.getByText('Critical :')).toBeInTheDocument();
      expect(screen.getByText('Serious :')).toBeInTheDocument();
      expect(screen.getByText('Moderate :')).toBeInTheDocument();
      expect(screen.getByText('Minor :')).toBeInTheDocument();
    });
  });

  it('shows no data message when data array is empty', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: []
      })
    });

    render(<SiteHealthAxeCore siteName="test-site" />);

    await waitFor(() => {
      expect(screen.getByText('No axe-core data available for this site.')).toBeInTheDocument();
    });
  });

  it('handles error status in data', async () => {
    const errorData = { ...mockData, status: 'error' as const, error: 'Data error' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: [errorData]
      })
    });

    render(<SiteHealthAxeCore siteName="test-site" />);

    await waitFor(() => {
      expect(screen.getByText('Error: Data error')).toBeInTheDocument();
    });
  });

  it('formats node information correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    render(<SiteHealthAxeCore siteName="test-site" />);

    await waitFor(() => {
      expect(screen.getByText('.button')).toBeInTheDocument();
    });
  });

  it('displays impact breakdown statistics', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    render(<SiteHealthAxeCore siteName="test-site" />);

    await waitFor(() => {
      expect(screen.getByText('Violation Impact Levels')).toBeInTheDocument();
    });

    expect(screen.getByText('Critical :')).toBeInTheDocument();
    expect(screen.getByText('Serious :')).toBeInTheDocument();
    expect(screen.getByText('Moderate :')).toBeInTheDocument();
    expect(screen.getByText('Minor :')).toBeInTheDocument();
  });
});
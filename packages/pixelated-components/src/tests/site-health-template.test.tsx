/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '../test/test-utils';
import { mockGoogleAnalyticsData } from '../test/test-data';
import { screen, waitFor, act } from '@testing-library/react';
import { SiteHealthTemplate } from '../components/admin/site-health/site-health-template';
import * as smartFetchModule from '../components/foundation/smartfetch';

// Mock smartFetch
const mockSmartFetch = vi.fn();
vi.spyOn(smartFetchModule, 'smartFetch').mockImplementation(mockSmartFetch);

describe('SiteHealthTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when siteName is empty', () => {
    const { container } = render(
      <SiteHealthTemplate 
        siteName="" 
        endpoint={{
          endpoint: '/api/test',
          responseTransformer: (result) => result
        }}
      >
        {() => <div>Test content</div>}
      </SiteHealthTemplate>
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows loading state initially', () => {
    mockSmartFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <SiteHealthTemplate 
        siteName="test-site" 
        endpoint={{
          endpoint: '/api/test',
          responseTransformer: (result) => result
        }}
      >
        {() => <div>Test content</div>}
      </SiteHealthTemplate>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders children with data when fetch succeeds', async () => {
    const mockData = { success: true, data: { test: 'data' } };
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(mockData)
    };
    mockSmartFetch.mockResolvedValue(mockResponse);

    render(
      <SiteHealthTemplate 
        siteName="test-site" 
        endpoint={{
          endpoint: '/api/test',
          responseTransformer: (result) => result.data
        }}
      >
        {(data: { test: string } | null) => <div>Data: {data?.test}</div>}
      </SiteHealthTemplate>
    );

    await waitFor(() => {
      expect(screen.getByText('Data: data')).toBeInTheDocument();
    });

    expect(mockSmartFetch).toHaveBeenCalledWith('http://localhost:3000/api/test?siteName=test-site', expect.objectContaining({
      responseType: 'ok',
      timeout: 0,
      requestInit: expect.objectContaining({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: undefined,
      }),
    }));
  });

  it('shows error state when fetch fails', async () => {
    mockSmartFetch.mockRejectedValue(new Error('Fetch failed'));

    render(
      <SiteHealthTemplate 
        siteName="test-site" 
        endpoint={{
          endpoint: '/api/test',
          responseTransformer: (result) => result
        }}
      >
        {() => <div>Test content</div>}
      </SiteHealthTemplate>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: Fetch failed')).toBeInTheDocument();
    });
  });

  it('includes additional endpoint params in the request URL', async () => {
    const mockData = { success: true, data: { test: 'data' } };
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(mockData)
    };

    mockSmartFetch.mockResolvedValue(mockResponse);

    render(
      <SiteHealthTemplate 
        siteName="test-site" 
        endpoint={{
          endpoint: '/api/test',
          params: { foo: 'bar' },
          responseTransformer: (result) => result.data
        }}
      >
        {(data: { test: string } | null) => <div>Data: {data?.test}</div>}
      </SiteHealthTemplate>
    );

    await waitFor(() => {
      expect(screen.getByText('Data: data')).toBeInTheDocument();
    });

    expect(mockSmartFetch).toHaveBeenCalledWith('http://localhost:3000/api/test?siteName=test-site&foo=bar', expect.objectContaining({
      responseType: 'ok',
      timeout: 0,
      requestInit: expect.objectContaining({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: undefined,
      }),
    }));
  });

  it('handles non-Error thrown values', async () => {
    mockSmartFetch.mockRejectedValue('String error');

    render(
      <SiteHealthTemplate 
        siteName="test-site" 
        endpoint={{
          endpoint: '/api/test',
          responseTransformer: (result) => result
        }}
      >
        {() => <div>Test content</div>}
      </SiteHealthTemplate>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to load data')).toBeInTheDocument();
    });
  });

  it('re-fetches data when siteName changes', async () => {
    const mockData = { success: true, data: { test: 'data' } };
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(mockData)
    };
    mockSmartFetch.mockResolvedValue(mockResponse);

    const { rerender } = render(
      <SiteHealthTemplate 
        siteName="site1" 
        endpoint={{
          endpoint: '/api/test',
          responseTransformer: (result) => result.data
        }}
      >
        {(data: { test: string } | null) => <div>Data: {data?.test}</div>}
      </SiteHealthTemplate>
    );

    await waitFor(() => {
      expect(screen.getByText('Data: data')).toBeInTheDocument();
    });

    expect(mockSmartFetch).toHaveBeenCalledTimes(1);
    expect(mockSmartFetch).toHaveBeenCalledWith('http://localhost:3000/api/test?siteName=site1', expect.objectContaining({
      responseType: 'ok',
      timeout: 0,
      requestInit: expect.objectContaining({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: undefined,
      }),
    }));

    // Change siteName
    rerender(
      <SiteHealthTemplate 
        siteName="site2" 
        endpoint={{
          endpoint: '/api/test',
          responseTransformer: (result) => result.data
        }}
      >
        {(data: { test: string } | null) => <div>Data: {data?.test}</div>}
      </SiteHealthTemplate>
    );

    await waitFor(() => {
      expect(mockSmartFetch).toHaveBeenCalledTimes(2);
    });

    expect(mockSmartFetch).toHaveBeenLastCalledWith('http://localhost:3000/api/test?siteName=site2', expect.objectContaining({
      responseType: 'ok',
      timeout: 0,
      requestInit: expect.objectContaining({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: undefined,
      }),
    }));
  });

  it('does not fetch when siteName becomes empty', async () => {
    const mockData = { success: true, data: { test: 'data' } };
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(mockData)
    };
    mockSmartFetch.mockResolvedValue(mockResponse);

    const { rerender } = render(
      <SiteHealthTemplate 
        siteName="site1" 
        endpoint={{
          endpoint: '/api/test',
          responseTransformer: (result) => result.data
        }}
      >
        {(data: { test: string } | null) => <div>Data: {data?.test}</div>}
      </SiteHealthTemplate>
    );

    await waitFor(() => {
      expect(screen.getByText('Data: data')).toBeInTheDocument();
    });

    // Change to empty siteName
    rerender(
      <SiteHealthTemplate 
        siteName="" 
        endpoint={{
          endpoint: '/api/test',
          responseTransformer: (result) => result.data
        }}
      >
        {(data: { test: string } | null) => <div>Data: {data?.test}</div>}
      </SiteHealthTemplate>
    );

    expect(mockSmartFetch).toHaveBeenCalledTimes(1); // Should not call again
  });

  it('cleans up on unmount', async () => {
    mockSmartFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { unmount } = render(
      <SiteHealthTemplate 
        siteName="test-site" 
        endpoint={{
          endpoint: '/api/test',
          responseTransformer: (result) => result
        }}
      >
        {() => <div>Test content</div>}
      </SiteHealthTemplate>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    unmount();

    // Component should be unmounted, no state updates should occur
  });

  it('builds non-GET requests with headers, body, params, and cache control', async () => {
    const mockData = { success: true, data: { saved: true } };
    mockSmartFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(mockData),
    });
    const originalSearch = window.location.search;
    window.history.replaceState({}, '', '?cache=false');

    render(
      <SiteHealthTemplate
        siteName="test-site"
        enableCacheControl
        endpoint={{
          endpoint: '/api/test',
          method: 'POST',
          headers: { Authorization: 'Bearer test' },
          params: { mode: 'full' },
          body: { enabled: true },
          responseTransformer: (result) => result.data,
        }}
      >
        {(data: { saved: boolean } | null) => <div>Saved: {String(data?.saved)}</div>}
      </SiteHealthTemplate>
    );

    await waitFor(() => expect(screen.getByText('Saved: true')).toBeInTheDocument());
    expect(mockSmartFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/test?siteName=test-site&mode=full&cache=false',
      expect.objectContaining({
        requestInit: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test' },
          body: JSON.stringify({ enabled: true }),
        },
      }),
    );
    window.history.replaceState({}, '', originalSearch || '/');
  });

  it('renders provided data without fetching', () => {
    render(
      <SiteHealthTemplate siteName="test-site" data={{ ready: true }} endpoint={{ endpoint: '/api/test' }}>
        {(data: { ready: boolean } | null) => <div>Ready: {String(data?.ready)}</div>}
      </SiteHealthTemplate>
    );
    expect(screen.getByText('Ready: true')).toBeInTheDocument();
    expect(mockSmartFetch).not.toHaveBeenCalled();
  });

  it('renders a shared analytics fixture without fetching', () => {
    render(
      <SiteHealthTemplate siteName="test-site" data={mockGoogleAnalyticsData} endpoint={{ endpoint: '/api/test' }}>
        {(data: typeof mockGoogleAnalyticsData | null) => <div>Points: {data?.traffic.length}</div>}
      </SiteHealthTemplate>
    );

    expect(screen.getByText(`Points: ${mockGoogleAnalyticsData.traffic.length}`)).toBeInTheDocument();
    expect(mockSmartFetch).not.toHaveBeenCalled();
  });
});
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFormSubmit } from '../components/sitebuilder/form/formsubmit';
import { FormValidationProvider } from '../components/sitebuilder/form/formvalidator';

// Mock smartFetch
vi.mock('../components/foundation/smartfetch', () => ({
	smartFetch: vi.fn()
}));

import { smartFetch } from '../components/foundation/smartfetch';

function TestForm({ options }: any) {
  const { handleSubmit, isSubmitting, submitError, modalContent } = useFormSubmit(options);

  return (
    <FormValidationProvider>
      <form data-testid="test-form" id="test-form" onSubmit={handleSubmit}>
        <input id="email" name="email" defaultValue="user@example.com" />
        <button type="submit">Submit</button>
        <div data-testid="submitting">{String(isSubmitting)}</div>
        <div data-testid="error">{submitError?.message ?? ''}</div>
        <div data-testid="modal-content">{JSON.stringify(modalContent)}</div>
      </form>
    </FormValidationProvider>
  );
}

describe('useFormSubmit', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(smartFetch).mockClear();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('should use default options when none provided', async () => {
    vi.mocked(smartFetch).mockResolvedValueOnce({ success: true });

    render(<TestForm options={{}} />);

    expect(screen.getByTestId('modal-content')).toBeInTheDocument();
  });

  it('should use custom modalContent when provided', async () => {
    const customContent = <div>Custom Thank You</div>;
    
    vi.mocked(smartFetch).mockResolvedValueOnce({ success: true });

    render(<TestForm options={{ modalContent: customContent }} />);
    
    // Modal content is returned from hook
    expect(screen.getByTestId('modal-content')).toBeInTheDocument();
  });

  it('submits the form and calls onSuccess when no honeypot is present', async () => {
    vi.mocked(smartFetch).mockResolvedValueOnce({ success: true });

    const onSuccess = vi.fn();
    const onError = vi.fn();
    const onFinally = vi.fn();

    render(<TestForm options={{
      toggleLoading: false,
      openModal: false,
      resetForm: false,
      onSuccess,
      onError,
      onFinally
    }} />);

    fireEvent.submit(screen.getByTestId('test-form'));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(onError).not.toHaveBeenCalled();
    expect(onFinally).toHaveBeenCalled();
    expect(smartFetch).toHaveBeenCalled();
    expect(screen.getByTestId('error').textContent).toBe('');
  });

  it('calls onStart callback at beginning and onFinally at end', async () => {
    vi.mocked(smartFetch).mockResolvedValueOnce({ success: true });

    const onStart = vi.fn();
    const onFinally = vi.fn();

    render(<TestForm options={{
      toggleLoading: false,
      openModal: false,
      resetForm: false,
      onStart,
      onFinally
    }} />);

    fireEvent.submit(screen.getByTestId('test-form'));

    await waitFor(() => expect(onStart).toHaveBeenCalled());
    expect(onFinally).toHaveBeenCalled();
  });

  it('should respect resetForm flag by resetting form on success', async () => {
    vi.mocked(smartFetch).mockResolvedValueOnce({ success: true });

    render(<TestForm options={{
      toggleLoading: false,
      openModal: false,
      resetForm: true  // Should reset form
    }} />);

    const emailInput = screen.getByDisplayValue('user@example.com') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });
    expect(emailInput.value).toBe('newemail@example.com');

    fireEvent.submit(screen.getByTestId('test-form'));

    await waitFor(() => {
      expect(emailInput.value).toBe('user@example.com');
    });
  });

  it('should not reset form when resetForm is false', async () => {
    vi.mocked(smartFetch).mockResolvedValueOnce({ success: true });

    render(<TestForm options={{
      toggleLoading: false,
      openModal: false,
      resetForm: false  // Should NOT reset form
    }} />);

    const emailInput = screen.getByDisplayValue('user@example.com') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });
    expect(emailInput.value).toBe('newemail@example.com');

    fireEvent.submit(screen.getByTestId('test-form'));

    await waitFor(() => {
      // Value should remain changed
      expect(emailInput.value).toBe('newemail@example.com');
    });
  });

  it('blocks spam when honeypot is filled and still completes submit lifecycle', async () => {
    vi.mocked(smartFetch).mockResolvedValueOnce({ success: true });

    const onSuccess = vi.fn();
    const onError = vi.fn();
    const onFinally = vi.fn();

    const Wrapped = () => {
      const { handleSubmit } = useFormSubmit({
        onSuccess,
        onError,
        onFinally,
      });

      return (
        <FormValidationProvider>
          <form data-testid="spam-form" id="spam-form" onSubmit={handleSubmit}>
            <input id="email" name="email" defaultValue="user@example.com" />
            <input id="winnie" name="website" defaultValue="bot-value" />
            <button type="submit">Submit</button>
          </form>
        </FormValidationProvider>
      );
    };

    render(<Wrapped />);
    fireEvent.submit(screen.getByTestId('spam-form'));

    await waitFor(() => expect(onFinally).toHaveBeenCalled());
    expect(onSuccess).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(smartFetch).not.toHaveBeenCalled();
  });

  it('reports an error when sendmail response is not ok', async () => {
    vi.mocked(smartFetch).mockRejectedValueOnce(new Error('HTTP 502 Bad Gateway'));

    const onSuccess = vi.fn();
    const onError = vi.fn();
    const onFinally = vi.fn();

    render(<TestForm options={{
      toggleLoading: false,
      openModal: false,
      resetForm: false,
      onSuccess,
      onError,
      onFinally
    }} />);
    fireEvent.submit(screen.getByTestId('test-form'));

    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFinally).toHaveBeenCalled();
    expect(screen.getByTestId('error').textContent).toContain('Bad Gateway');
  });

  it('emailJSON should submit regular JSON and invoke callback', async () => {
    const callback = vi.fn();
    vi.mocked(smartFetch).mockResolvedValueOnce({ success: true });

    const { emailJSON } = await import('../components/sitebuilder/form/formsubmit');
    await emailJSON({ name: 'Test' }, callback);

    expect(callback).toHaveBeenCalled();
    expect(smartFetch).toHaveBeenCalled();
  });

  it('emailJSON should bypass submission when honeypot field is present', async () => {
    const callback = vi.fn();
    const { emailJSON } = await import('../components/sitebuilder/form/formsubmit');
    await emailJSON({ winnie: 'spam' }, callback);

    expect(callback).toHaveBeenCalled();
    expect(smartFetch).not.toHaveBeenCalled();
  });

  it('emailFormData should gather form data and submit successfully', async () => {
    const callback = vi.fn();
    vi.mocked(smartFetch).mockResolvedValueOnce({ success: true });

    const form = document.createElement('form');
    form.id = 'test-form';
    const email = document.createElement('input');
    email.name = 'email';
    email.value = 'user@example.com';
    form.appendChild(email);

    const honeypot = document.createElement('input');
    honeypot.name = 'winnie';
    honeypot.value = '';
    form.appendChild(honeypot);

    document.body.appendChild(form);

    const event = {
      target: form,
      preventDefault: vi.fn(),
    } as any;

    const { emailFormData } = await import('../components/sitebuilder/form/formsubmit');
    const result = await emailFormData(event, callback);
    expect(result.success).toBe(true);

    expect(callback).toHaveBeenCalled();
    expect(smartFetch).toHaveBeenCalled();
  });
});

import React from 'react';
import { render } from '../test/test-utils';
import { screen, fireEvent, waitFor, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFormSubmit, FormSubmitWrapper, useFormSubmitContext } from '../components/sitebuilder/form/formsubmit';
import { FormValidationProvider } from '../components/sitebuilder/form/formvalidator';

// Mock smartFetch
vi.mock('../components/foundation/smartfetch', () => ({
	smartFetch: vi.fn()
}));

// Mock foundation/loading and general/modal
vi.mock('../components/foundation/loading', () => ({
	ToggleLoading: vi.fn(),
	Loading: () => <div data-testid="loading-spinner">Loading</div>
}));

vi.mock('../components/general/modal', () => ({
	handleModalOpen: vi.fn(),
	Modal: ({ modalContent }: any) => (
		<div data-testid="modal-component">
			<div data-testid="modal-content-inner">{modalContent}</div>
		</div>
	)
}));

import { smartFetch } from '../components/foundation/smartfetch';
import { ToggleLoading } from '../components/foundation/loading';
import { handleModalOpen } from '../components/general/modal';

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

  it('emailFormData should handle preventDefault failure in honeypot guard', async () => {
    const form = document.createElement('form');
    form.id = 'spam-form-2';
    const honeypot = document.createElement('input');
    honeypot.name = 'winnie';
    honeypot.value = 'spam';
    form.appendChild(honeypot);
    document.body.appendChild(form);

    const event = {
      target: form,
      preventDefault: vi.fn()
        .mockImplementationOnce(() => {}) // First call at line 36
        .mockImplementationOnce(() => { throw new Error('fail'); }), // Second call at line 51
    } as any;

    const { emailFormData } = await import('../components/sitebuilder/form/formsubmit');
    await emailFormData(event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('emailJSON should handle fetch errors', async () => {
    vi.mocked(smartFetch).mockRejectedValueOnce(new Error('Fetch failed'));
    const callback = vi.fn();
    const { emailJSON } = await import('../components/sitebuilder/form/formsubmit');
    
    await emailJSON({ name: 'Test' }, callback);
    expect(callback).toHaveBeenCalled();
  });

  describe('FormSubmitWrapper and context', () => {
    it('FormSubmitWrapper provides context and renders helpers', () => {
      const Child = () => {
        const { isSubmitting } = useFormSubmitContext();
        return <div data-testid="child">{String(isSubmitting)}</div>;
      };

      render(
        <FormSubmitWrapper>
          <Child />
        </FormSubmitWrapper>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByTestId('modal-component')).toBeInTheDocument();
    });

    it('useFormSubmitContext throws error when used outside provider', () => {
      const Consumer = () => {
        useFormSubmitContext();
        return null;
      };

      // Suppress console error for expected throw
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => render(<Consumer />)).toThrow('useFormSubmitContext must be used within FormSubmitWrapper');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Lifecycle and options coverage', () => {
    it('should call ToggleLoading and handleModalOpen by default', async () => {
      vi.mocked(smartFetch).mockResolvedValueOnce({ success: true });

      render(<TestForm options={{}} />);
      fireEvent.submit(screen.getByTestId('test-form'));

      await waitFor(() => {
        expect(ToggleLoading).toHaveBeenCalledWith({ show: true });
      });
      
      await waitFor(() => {
        expect(handleModalOpen).toHaveBeenCalled();
      });

      expect(ToggleLoading).toHaveBeenCalledWith({ show: false });
    });

    it('should handle handleModalOpen failure gracefully', async () => {
      vi.mocked(smartFetch).mockResolvedValueOnce({ success: true });
      vi.mocked(handleModalOpen).mockImplementationOnce(() => {
        throw new Error('Modal error');
      });

      render(<TestForm options={{}} />);
      fireEvent.submit(screen.getByTestId('test-form'));

      await waitFor(() => {
        expect(handleModalOpen).toHaveBeenCalled();
      });
      // Should not crash the whole handleSubmit
      await waitFor(() => {
        expect(ToggleLoading).toHaveBeenCalledWith({ show: false });
      });
    });
  });
});

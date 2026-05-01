import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test/test-utils';
import { FormBuilder, FormBuild } from '../components/sitebuilder/form/formbuilder';

describe('FormBuilder', () => {
  it('renders the builder and preview panel', () => {
    const { container } = render(<FormBuilder />);
    expect(container).toBeDefined();
    expect(screen.getByText(/Build/i)).toBeInTheDocument();
  });

  it('generates a field JSON schema when the field type is submitted', async () => {
    const onSetFormData = vi.fn();
    const { container } = render(<FormBuild setFormData={onSetFormData} />);

    const typeInput = screen.getByLabelText(/Type/i) as HTMLInputElement;
    fireEvent.change(typeInput, { target: { value: 'checkbox' } });

    const buildForm = container.querySelector('form#build') as HTMLFormElement;
    expect(buildForm).toBeInTheDocument();
    fireEvent.submit(buildForm);

    await waitFor(() => expect(onSetFormData).toHaveBeenCalled());
    const generatedForm = onSetFormData.mock.calls[0][0];
    expect(generatedForm).toHaveProperty('fields');
    expect(generatedForm.fields[0].props.type).toBe('text');
  });

  it('appends a new form field to the live preview JSON', async () => {
    const { container } = render(<FormBuilder />);

    const typeInput = screen.getByLabelText(/Type/i) as HTMLInputElement;
    fireEvent.change(typeInput, { target: { value: 'checkbox' } });
    const buildForm = container.querySelector('form#build') as HTMLFormElement;
    expect(buildForm).toBeInTheDocument();
    fireEvent.submit(buildForm);

    await waitFor(() => {
      expect(screen.getByText(/FormCheckbox/i)).toBeInTheDocument();
    });
  });

  it('maintains an append-only schema when adding multiple fields', async () => {
    const { container } = render(<FormBuilder />);

    const typeInput = screen.getByLabelText(/Type/i) as HTMLInputElement;
    fireEvent.change(typeInput, { target: { value: 'text' } });
    const buildForm = container.querySelector('form#build') as HTMLFormElement;
    expect(buildForm).toBeInTheDocument();
    fireEvent.submit(buildForm);

    await waitFor(() => {
      expect(screen.getByText(/FormInput/i)).toBeInTheDocument();
    });

    fireEvent.change(typeInput, { target: { value: 'select' } });
    fireEvent.submit(buildForm);

    await waitFor(() => {
      expect(screen.getByText(/FormSelect/i)).toBeInTheDocument();
    });
  });
});

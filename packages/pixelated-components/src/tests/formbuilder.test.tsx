// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '../test/test-utils';
import { screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { FormBuilder, FormBuild } from '../components/sitebuilder/form/formbuilder';
import * as formEngineUtilities from '../components/sitebuilder/form/formengineutilities';

afterEach(() => {
  cleanup();
});

describe('FormBuilder', () => {
  it('renders the builder and preview panel', () => {
    const { container } = render(<FormBuilder />);
    expect(container).toBeDefined();
    expect(screen.getByText(/Build/i)).toBeInTheDocument();
  });

  it('generates a field JSON schema when the field type is submitted', async () => {
    const onSetFormData = vi.fn();
    const { container } = render(<FormBuild setFormData={onSetFormData} />);

    const typeInput = container.querySelector('input#type') as HTMLInputElement;
    fireEvent.change(typeInput, { target: { value: 'text' } });

    const buildForm = container.querySelector('form') as HTMLFormElement;
    expect(buildForm).toBeInTheDocument();
    fireEvent.submit(buildForm);

    await waitFor(() => expect(onSetFormData).toHaveBeenCalled());
    const generatedForm = onSetFormData.mock.calls[0][0];
    expect(generatedForm).toHaveProperty('fields');
    expect(generatedForm.fields[0].props.type).toBe('text');
  });

  it('marks the type field as disabled in the generated schema', async () => {
    const onSetFormData = vi.fn();
    const { container } = render(<FormBuild setFormData={onSetFormData} />);

    const typeInput = container.querySelector('input#type') as HTMLInputElement;
    fireEvent.change(typeInput, { target: { value: 'text' } });

    const buildForm = container.querySelector('form') as HTMLFormElement;
    fireEvent.submit(buildForm);

    await waitFor(() => expect(onSetFormData).toHaveBeenCalled());
    const generatedForm = onSetFormData.mock.calls[0][0];
    const typeField = generatedForm.fields.find(
      (field: { props?: { name?: string } }) => field.props?.name === 'type'
    );
    expect(typeField).toBeDefined();
    expect(typeField.props.disabled).toBe(true);
    expect(typeField.props.list).toBe('inputTypes');
  });

  it('handles a submit when the type field is missing', async () => {
    const onSetFormData = vi.fn();
    const mapTypeSpy = vi.spyOn(formEngineUtilities, 'mapTypeToComponent').mockReturnValue('FormInput');
    const { container } = render(<FormBuild setFormData={onSetFormData} />);

    const typeInput = container.querySelector('input#type') as HTMLInputElement;
    typeInput.remove();

    const buildForm = container.querySelector('form') as HTMLFormElement;
    fireEvent.submit(buildForm);

    await waitFor(() => expect(onSetFormData).toHaveBeenCalled());
    const generatedForm = onSetFormData.mock.calls[0][0];
    expect(generatedForm).toHaveProperty('fields');
    expect(mapTypeSpy).toHaveBeenCalledWith('');
    mapTypeSpy.mockRestore();
  });

  it('appends a new form field to the live preview JSON', async () => {
    const { container } = render(<FormBuilder />);

    const typeInput = container.querySelector('input#type') as HTMLInputElement;
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

    const typeInput = container.querySelector('input#type') as HTMLInputElement;
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

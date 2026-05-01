import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../test/test-utils';
import {
  FormLabel,
  FormSectionHeader,
  FormInput,
  FormSelect,
  FormTextarea,
  FormRadio,
  FormCheckbox,
  FormButton,
  FormDataList,
  FormHoneypot,
  FormGooglePlacesInput,
  FormTagInput,
  FormFieldset,
} from '../components/sitebuilder/form/formcomponents';
import { FormValidationProvider } from '../components/sitebuilder/form/formvalidator';

describe('FormComponents', () => {
  it('renders FormLabel with tooltip text', () => {
    render(<FormLabel id="field-id" label="Test Label" tooltip="Helpful info" />);

    expect(screen.getByText('Test Label')).toBeInTheDocument();
    const tooltipButton = screen.getByRole('button', { name: /Show more info/i });
    fireEvent.click(tooltipButton);
    expect(screen.getByText('Helpful info')).toBeInTheDocument();
  });

  it('renders FormSectionHeader with title and text', () => {
    render(
      <FormSectionHeader title="Section Title" text="Section helper text" />
    );

    expect(screen.getByText('Section Title')).toBeInTheDocument();
    expect(screen.getByText('Section helper text')).toBeInTheDocument();
  });

  it('renders FormInput as a controlled text input', () => {
    render(
      <FormValidationProvider>
        <FormInput id="input-id" name="input-name" label="Input Label" type="text" defaultValue="hello" />
      </FormValidationProvider>
    );

    expect(screen.getByLabelText('Input Label')).toHaveValue('hello');
  });

  it('renders FormSelect with option elements', () => {
    render(
      <FormValidationProvider>
        <FormSelect
          id="select-id"
          name="select-name"
          label="Select Label"
          options={[
            { value: 'a', text: 'Option A' },
            { value: 'b', text: 'Option B' }
          ]}
        />
      </FormValidationProvider>
    );

    expect(screen.getByLabelText('Select Label')).toBeInTheDocument();
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('renders FormTextarea with placeholder text', () => {
    render(
      <FormValidationProvider>
        <FormTextarea id="textarea-id" name="textarea-name" label="Notes" placeholder="Enter details" />
      </FormValidationProvider>
    );

    expect(screen.getByPlaceholderText('Enter details')).toBeInTheDocument();
  });

  it('renders FormRadio options and allows selection', () => {
    render(
      <FormValidationProvider>
        <FormRadio
          id="radio-id"
          name="radio-group"
          label="Choose One"
          options={[
            { value: 'one', text: 'One' },
            { value: 'two', text: 'Two' }
          ]}
        />
      </FormValidationProvider>
    );

    const optionOne = screen.getByLabelText('One') as HTMLInputElement;
    fireEvent.click(optionOne);

    expect(optionOne.checked).toBe(true);
  });

  it('renders FormCheckbox options and toggles checkbox state', () => {
    render(
      <FormValidationProvider>
        <FormCheckbox
          id="checkbox-id"
          name="checkbox-group"
          label="Pick Items"
          options={[
            { value: 'x', text: 'X' },
            { value: 'y', text: 'Y' }
          ]}
        />
      </FormValidationProvider>
    );

    const optionX = screen.getByLabelText('X') as HTMLInputElement;
    fireEvent.click(optionX);

    expect(optionX.checked).toBe(true);
  });

  it('renders FormButton and calls onClick handler', () => {
    const onClick = vi.fn();
    render(<FormButton type="button" id="button-id" text="Press me" onClick={onClick} />);

    fireEvent.click(screen.getByText('Press me'));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders FormDataList options with provided items', () => {
    const { container } = render(<FormDataList id="datalist-id" items={['apple', 'banana']} />);

    const datalist = container.querySelector('datalist');
    expect(datalist).toBeInTheDocument();
    expect(datalist?.querySelectorAll('option')).toHaveLength(2);
  });

  it('renders FormHoneypot as a hidden input', () => {
    render(
      <FormValidationProvider>
        <FormHoneypot id="winnie" />
      </FormValidationProvider>
    );

    const honeypotInput = screen.getByRole('textbox', { hidden: true });
    expect(honeypotInput).toHaveAttribute('id', 'winnie');
    expect(honeypotInput).toHaveAttribute('name', 'website');
  });

  it('renders FormTagInput and allows adding and removing tags', () => {
    const onChange = vi.fn();

    render(
      <FormValidationProvider>
        <FormTagInput id="tag-input" label="Tags" onChange={onChange} />
      </FormValidationProvider>
    );

    const input = screen.getByRole('textbox', { name: /Add new tag/i });
    fireEvent.change(input, { target: { value: 'new-tag' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(['new-tag']);
    expect(screen.getByText('new-tag')).toBeInTheDocument();

    const removeButton = screen.getByRole('button', { name: /Remove new-tag/i });
    fireEvent.click(removeButton);

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('renders FormFieldset without errors', () => {
    const { container } = render(<FormFieldset />);
    expect(container).toBeDefined();
  });

  it('renders FormGooglePlacesInput with tooltip and vertical display', () => {
    render(
      <FormValidationProvider>
        <FormGooglePlacesInput
          id="address-input"
          name="address"
          label="Address"
          tooltip="Find your location"
          display="vertical"
        />
      </FormValidationProvider>
    );

    expect(screen.getByLabelText('Address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Show more info/i })).toBeInTheDocument();
  });
});


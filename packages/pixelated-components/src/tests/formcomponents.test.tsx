import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '../test/test-utils';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
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

// Hoist mocks to top level
vi.mock('../components/integrations/googleplaces', () => ({
  getGooglePlacesService: vi.fn()
}));

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

  it('renders FormRadio with controlled onChange', () => {
    const onChange = vi.fn();
    render(
      <FormValidationProvider>
        <FormRadio
          id="radio-id"
          name="radio-group"
          label="Choose One"
          onChange={onChange}
          options={[
            { value: 'one', text: 'One' },
          ]}
        />
      </FormValidationProvider>
    );

    fireEvent.click(screen.getByLabelText('One'));
    expect(onChange).toHaveBeenCalledWith('one');
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
    expect(optionX).toHaveAttribute('name', 'checkbox-group');
    fireEvent.click(optionX);

    expect(optionX.checked).toBe(true);
  });

  it('renders FormCheckbox with controlled onChange (add and remove)', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <FormValidationProvider>
        <FormCheckbox
          id="checkbox-id"
          name="checkbox-group"
          label="Pick Items"
          onChange={onChange}
          options={[
            { value: 'x', text: 'X' },
          ]}
        />
      </FormValidationProvider>
    );

    const optionX = screen.getByLabelText('X') as HTMLInputElement;
    
    // Add
    fireEvent.click(optionX);
    expect(onChange).toHaveBeenCalledWith(['x']);

    // Remove
    // We must pass the current state back as 'checked' or 'value'
    // Looking at FormCheckbox PropTypes: 'value' isn't there, but it uses it?
    // Wait, let's check FormCheckbox PropTypes.
    /*
    FormCheckbox.propTypes = {
        // ...
        onChange: PropTypes.func,
    };
    */
    // It doesn't have 'value' or 'checked' in propTypes! 
    // But FormCheckboxOption uses props.parent.checked.
    
    rerender(
      <FormValidationProvider>
        <FormCheckbox
          id="checkbox-id"
          name="checkbox-group"
          label="Pick Items"
          onChange={onChange}
          {...{checked: ['x']} as any} 
          options={[
            { value: 'x', text: 'X' },
          ]}
        />
      </FormValidationProvider>
    );
    
    const optionXAgain = screen.getByLabelText('X') as HTMLInputElement;
    expect(optionXAgain.checked).toBe(true);
    
    fireEvent.click(optionXAgain);
    expect(onChange).toHaveBeenLastCalledWith([]);
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
        <FormHoneypot />
      </FormValidationProvider>
    );

    const honeypotInput = screen.getByRole('textbox', { hidden: true });
    expect(honeypotInput).toHaveAttribute('id', 'winnie');
    expect(honeypotInput).toHaveAttribute('name', 'pooh');
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

  describe('FormTagInput Extra Coverage', () => {
    it('should add tag on comma and remove on backspace', () => {
      const onChange = vi.fn();
      render(
        <FormValidationProvider>
          <FormTagInput id="tag-input" label="Tags" defaultValue={['tag1']} onChange={onChange} />
        </FormValidationProvider>
      );

      const input = screen.getByRole('textbox', { name: /Add new tag/i });
      fireEvent.change(input, { target: { value: 'tag2' } });
      fireEvent.keyDown(input, { key: ',', code: 'Comma' });

      expect(onChange).toHaveBeenCalledWith(['tag1', 'tag2']);
      
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.keyDown(input, { key: 'Backspace', code: 'Backspace' });
      expect(onChange).toHaveBeenCalledWith(['tag1']);
    });

    it('should prevent duplicate tags', () => {
      render(
        <FormValidationProvider>
          <FormTagInput id="tag-input" label="Tags" defaultValue={['tag1']} />
        </FormValidationProvider>
      );

      const input = screen.getByRole('textbox', { name: /Add new tag/i });
      fireEvent.change(input, { target: { value: 'tag1' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(screen.queryAllByText('tag1')).toHaveLength(1);
    });

    it('should work as a controlled component', () => {
      const { rerender } = render(
        <FormValidationProvider>
          <FormTagInput id="tag-input" label="Tags" value={['controlled1']} />
        </FormValidationProvider>
      );

      expect(screen.getByText('controlled1')).toBeInTheDocument();

      rerender(
        <FormValidationProvider>
          <FormTagInput id="tag-input" label="Tags" value={['controlled2']} />
        </FormValidationProvider>
      );
      expect(screen.queryByText('controlled1')).not.toBeInTheDocument();
      expect(screen.getByText('controlled2')).toBeInTheDocument();
    });
  });

  describe('FormTooltip interaction', () => {
    it('should toggle on key down (Enter/Space)', () => {
      render(<FormLabel id="tip" label="Label" tooltip="Secret Info" />);
      const icon = screen.getByRole('button');
      
      fireEvent.keyDown(icon, { key: 'Enter' });
      expect(screen.getByText('Secret Info')).toBeInTheDocument();
      
      fireEvent.keyDown(icon, { key: ' ' }); // Space
      expect(screen.queryByText('Secret Info')).not.toBeInTheDocument();
    });

    it('should toggle on mouse events', () => {
      render(<FormLabel id="tip" label="Label" tooltip="Mouse Info" />);
      const icon = screen.getByRole('button');
      
      fireEvent.mouseEnter(icon);
      expect(screen.getByText('Mouse Info')).toBeInTheDocument();
      
      fireEvent.mouseLeave(icon);
      expect(screen.queryByText('Mouse Info')).not.toBeInTheDocument();
    });
  });

  describe('FormInput Validation Flow', () => {
    it('should show validation error on blur', async () => {
      render(
        <FormValidationProvider>
          <FormInput id="email" label="Email" validate="isValidEmailAddress" />
        </FormValidationProvider>
      );

      const input = screen.getByLabelText('Email');
      fireEvent.change(input, { target: { value: 'invalid-email' } });
      fireEvent.blur(input);

      const errorIcons = await screen.findAllByRole('button', { name: /Show more info/i });
      fireEvent.mouseEnter(errorIcons[0]);
      expect(await screen.findAllByText(/isValidEmailAddress validation failed/i)).toHaveLength(2);
    });

    it('should show custom errorMessage instead of system error', async () => {
      render(
        <FormValidationProvider>
          <FormInput id="email" label="Email" validate="isValidEmailAddress" errorMessage="Bad email buddy" />
        </FormValidationProvider>
      );

      const input = screen.getByLabelText('Email');
      fireEvent.change(input, { target: { value: 'invalid' } });
      fireEvent.blur(input);

      expect(await screen.findByText('Bad email buddy')).toBeInTheDocument();
    });
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

  describe('FormGooglePlacesInput Logic', () => {
    it('should fetch predictions on input change', async () => {
      const mockService = {
        getPlacePredictions: vi.fn().mockResolvedValue([
          { placeId: '123', fullText: '123 Main St', mainText: '123 Main St' }
        ]),
        getPlaceDetails: vi.fn(),
        isValidCountry: vi.fn().mockReturnValue(true)
      };

      const { getGooglePlacesService } = await import('../components/integrations/googleplaces');
      vi.mocked(getGooglePlacesService).mockReturnValue(mockService as any);

      render(
        <FormValidationProvider>
          <FormGooglePlacesInput id="addr" label="Address" />
        </FormValidationProvider>
      );

      const input = screen.getByLabelText('Address');
      fireEvent.change(input, { target: { value: '123' } });
      
      // Using a longer wait instead of fake timers for simplicity/reliability in this env
      await new Promise(r => setTimeout(r, 600));

      const prediction = await screen.findByText('123 Main St');
      expect(prediction).toBeInTheDocument();
    });

    it('should select a place and call onAddressParsed', async () => {
      const onAddressParsed = vi.fn();
      const mockService = {
        getPlacePredictions: vi.fn().mockResolvedValue([
          { placeId: '123', fullText: '123 Main St', mainText: '123 Main St' }
        ]),
        getPlaceDetails: vi.fn().mockResolvedValue({
          street1: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zip: '12345',
          country: 'US'
        }),
        isValidCountry: vi.fn().mockReturnValue(true)
      };

      const { getGooglePlacesService } = await import('../components/integrations/googleplaces');
      vi.mocked(getGooglePlacesService).mockReturnValue(mockService as any);

      render(
        <FormValidationProvider>
          <FormGooglePlacesInput id="addr" label="Address" onAddressParsed={onAddressParsed} />
        </FormValidationProvider>
      );

      const input = screen.getByLabelText('Address');
      fireEvent.change(input, { target: { value: '123' } });
      
      await new Promise(r => setTimeout(r, 600));
      
      const predBtn = await screen.findByRole('option');
      const button = predBtn.querySelector('button');
      if (button) {
        fireEvent.mouseDown(button);
      }

      await waitFor(() => {
        expect(onAddressParsed).toHaveBeenCalledWith(expect.objectContaining({
          city: 'Anytown'
        }));
      });
    });
  });
});


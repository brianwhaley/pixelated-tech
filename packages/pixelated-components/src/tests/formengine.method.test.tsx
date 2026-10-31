import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { render } from '../test/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { FormEngine } from '../components/sitebuilder/form/formengine';

describe('FormEngine — default method and submit hardening', () => {
  it('defaults to method="post" when no method prop is supplied', () => {
    const minimal = { fields: [] } as any;
    const { container } = render(<FormEngine id="f1" name="f1" formData={minimal} />);
    const form = container.querySelector('form') as HTMLFormElement | null;
    expect(form).not.toBeNull();
    // HTMLFormElement.method returns lowercase string
    expect(form!.method).toBe('post');
    // attribute presence as a fallback assertion
    expect(form!.getAttribute('method')).toBe('post');
  });

  it('preventDefault has been called before onSubmitHandler is invoked', () => {
    const minimal = { fields: [] } as any;
    const handler = vi.fn((e: Event) => {
      // the synthetic event passed to the consumer should already be prevented
      expect((e as Event).defaultPrevented).toBe(true);
    });

    const { container } = render(
      <FormEngine id="f2" name="f2" formData={minimal} onSubmitHandler={handler} />
    );

    const form = container.querySelector('form') as HTMLFormElement;
    expect(form).not.toBeNull();

    fireEvent.submit(form);
    expect(handler).toHaveBeenCalled();
  });

  it('keeps the submitted form available through event.target after async validation', async () => {
    const formData = {
      fields: [{
        component: 'FormInput',
        props: {
          id: 'name',
          name: 'name',
          type: 'text',
          required: true,
        },
      }],
    } as any;
    const handler = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
      const submittedForm = event.target as HTMLFormElement;
      expect(submittedForm).toBeInstanceOf(HTMLFormElement);
      expect(new FormData(submittedForm).get('name')).toBe('Jane');
    });

    const { container } = render(
      <FormEngine id="f3" name="f3" formData={formData} onSubmitHandler={handler} />
    );

    const form = container.querySelector('form') as HTMLFormElement;
    const input = form.elements.namedItem('name') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Jane' } });
    fireEvent.submit(form);

    await waitFor(() => expect(handler).toHaveBeenCalled());
  });
});

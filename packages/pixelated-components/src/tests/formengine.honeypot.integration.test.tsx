import React from 'react';
import { render } from '../test/test-utils';
import { fireEvent, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FormEngine } from '../components/sitebuilder/form/formengine';
import { requestForm } from '../test/test-data';
import { processFormData } from '../components/sitebuilder/form/formsubmit';

// Integration: ensure FormEngine + processFormData reliably drop honeypot values
describe('FormEngine → processFormData integration (honeypot)', () => {
  it('drops submissions when DOM #winnie is filled (FormEngine wiring)', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const mockCallback = vi.fn();

    // Render a minimal form via FormEngine — include a honeypot field
    const localForm = {
      fields: [
        { component: 'FormInput', props: { id: 'name', name: 'name', type: 'text' } },
        { component: 'FormHoneypot' },
        { component: 'FormButton', props: { type: 'submit', id: 'submit', text: 'Send' } }
      ]
    } as any;

    const Wrapper = () => (
      <FormEngine id="integrationForm" name="integrationForm" formData={localForm} onSubmitHandler={(e: Event) => processFormData(e, mockCallback as any)} />
    );

    const { container } = render(<Wrapper />);

    // set honeypot DOM value (simulate bot)
    const hp = container.querySelector('#winnie') as HTMLInputElement | null;
    expect(hp).not.toBeNull();
    if (hp) hp.value = 'bot-signal';

    // submit the form (user click)
    const submit = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    await act(async () => fireEvent.click(submit));

    // processFormData should have prevented network call and invoked callback
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockCallback).toHaveBeenCalled();
  });
});

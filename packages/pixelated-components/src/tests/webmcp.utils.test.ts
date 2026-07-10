import { describe, it, expect } from 'vitest';
import { getWebMcpFieldType, applyWebMcpFormAttributes, applyWebMcpFieldAttributes } from '@/components/foundation/webmcp.utils';

describe('WebMCP foundation helpers', () => {
  it('should derive field type from props.type', () => {
    expect(getWebMcpFieldType({ component: 'FormInput' }, { type: 'checkbox' })).toBe('checkbox');
    expect(getWebMcpFieldType({ component: 'FormInput' }, { type: 'radio' })).toBe('radio');
    expect(getWebMcpFieldType({ component: 'FormInput' }, { type: 'date' })).toBe('date');
    expect(getWebMcpFieldType({ component: 'FormInput' }, { type: 'number' })).toBe('number');
  });

  it('should derive field type from component name when props.type is absent', () => {
    expect(getWebMcpFieldType({ component: 'FormCheckbox' }, {})).toBe('checkbox');
    expect(getWebMcpFieldType({ component: 'FormRadio' }, {})).toBe('radio');
    expect(getWebMcpFieldType({ component: 'FormTextarea' }, {})).toBe('text');
    expect(getWebMcpFieldType({ component: 'FormUnknown' }, {})).toBe('text');
  });

  it('should annotate form props with tool metadata and description when siteName exists', () => {
    const formProps: any = { id: 'test-form' };
    const formData = { properties: { name: 'contact-form' } };
    applyWebMcpFormAttributes(formProps, formData, 'Example Site');
    expect(formProps['data-webmcp-enabled']).toBe('true');
    expect(formProps['data-webmcp-tool']).toBe('contact-form');
    expect(formProps['data-webmcp-tool-description']).toBe('contact-form for Example Site');
  });

  it('should annotate form props without description when no siteName exists', () => {
    const formProps: any = { id: 'test-form' };
    const formData = { properties: {} };
    applyWebMcpFormAttributes(formProps, formData, undefined);
    expect(formProps['data-webmcp-enabled']).toBe('true');
    expect(formProps['data-webmcp-tool']).toBe('test-form');
    expect(formProps['data-webmcp-tool-description']).toBeUndefined();
  });

  it('should annotate field props correctly', () => {
    const fieldProps: any = { name: 'email', label: 'Email', required: true };
    const fieldSchema = { component: 'FormInput' };
    applyWebMcpFieldAttributes(fieldProps, fieldSchema, 0, {});
    expect(fieldProps['data-webmcp-field-name']).toBe('email');
    expect(fieldProps['data-webmcp-field-type']).toBe('text');
    expect(fieldProps['data-webmcp-field-label']).toBe('Email');
    expect(fieldProps['data-webmcp-field-required']).toBe('true');
  });
});

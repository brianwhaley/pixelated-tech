import { describe, it, expect } from 'vitest';
import { getPropTypeInfo, generateFormFieldFromPropType } from '../components/sitebuilder/page/lib/propTypeIntrospection';

describe('PropType Introspection', () => {
  it('exports getPropTypeInfo as a function', () => {
    expect(typeof getPropTypeInfo).toBe('function');
  });

  it('returns select metadata for known component props', () => {
    const info = getPropTypeInfo({}, 'Callout', 'variant');
    expect(info.type).toBe('select');
    expect(Array.isArray(info.options)).toBe(true);
    expect(info.options?.length).toBeGreaterThan(0);
  });

  it('detects object shape propType structures', () => {
    const info = getPropTypeInfo({ _propType: 'shape', shapeTypes: { title: { type: 'string' } } });
    expect(info.type).toBe('object');
    expect(info.options).toEqual({ title: { type: 'string' } });
    expect(info.isRequired).toBe(true);
  });

  it('detects arrayOf propType structures', () => {
    const info = getPropTypeInfo({ _propType: 'arrayOf', elementType: { name: 'string' } });
    expect(info.type).toBe('array');
    expect(info.elementType).toEqual({ name: 'string' });
  });

  it('maps basic PropTypes names to field types', () => {
    expect(getPropTypeInfo({ name: 'number' }).type).toBe('number');
    expect(getPropTypeInfo({ name: 'bool' }).type).toBe('checkbox');
    expect(getPropTypeInfo({ name: 'func' }).type).toBe('function');
    expect(getPropTypeInfo({ name: 'node' }).type).toBe('children');
    expect(getPropTypeInfo({ name: 'object' }).type).toBe('json');
  });

  it('preserves optional prop types when isRequired exists', () => {
    const info = getPropTypeInfo({ isRequired: true, name: 'string' });
    expect(info.isRequired).toBe(false);
  });

  it('generates a FormSelect field configuration for select metadata', () => {
    const result = generateFormFieldFromPropType('variant', { name: 'string' }, undefined, 'Callout');
    expect(result.component).toBe('FormSelect');
    expect(result.props.options).toBeDefined();
    expect(result.props.options[0]).toEqual({ value: '', text: '-- Select --' });
  });

  it('generates a number input field configuration', () => {
    const result = generateFormFieldFromPropType('columns', { name: 'number' });
    expect(result.component).toBe('FormInput');
    expect(result.props.type).toBe('number');
  });

  it('generates a checkbox field configuration for bool props', () => {
    const result = generateFormFieldFromPropType('responsive', { name: 'bool' });
    expect(result.component).toBe('FormInput');
    expect(result.props.type).toBe('checkbox');
  });

  it('generates a JSON text field for object prop types', () => {
    const result = generateFormFieldFromPropType('settings', { name: 'object' });
    expect(result.component).toBe('FormInput');
    expect(result.props.placeholder).toContain('JSON object');
  });

  it('generates an array input field configuration', () => {
    const result = generateFormFieldFromPropType('items', { _propType: 'arrayOf', elementType: { name: 'string' } });
    expect(result.component).toBe('FormInput');
    expect(result.props.placeholder).toContain('Comma-separated values');
  });
});

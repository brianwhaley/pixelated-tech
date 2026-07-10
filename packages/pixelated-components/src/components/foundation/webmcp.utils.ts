
export function getWebMcpFieldType(field: any, props: any) {
	if (props.type) {
		const type = String(props.type).toLowerCase();
		if (type === 'checkbox') return 'checkbox';
		if (type === 'radio') return 'radio';
		if (type === 'date') return 'date';
		if (type === 'number' || type === 'range') return 'number';
		return 'text';
	}
	const component = String(field.component || '').toLowerCase();
	if (component.includes('checkbox')) return 'checkbox';
	if (component.includes('radio')) return 'radio';
	if (component.includes('date')) return 'date';
	if (component.includes('textarea')) return 'text';
	return 'text';
}

export function applyWebMcpFormAttributes(formProps: any, formData: any, siteName?: string) {
	const toolName =
		formData?.properties?.name ||
		formProps.name ||
		formProps.id ||
		'form-tool';
	formProps['data-webmcp-enabled'] = 'true';
	formProps['data-webmcp-tool'] = toolName;
	if (siteName) {
		formProps['data-webmcp-tool-description'] = `${toolName} for ${siteName}`;
	}
}

export function applyWebMcpFieldAttributes(fieldProps: any, fieldSchema: any, fieldIndex: number, formData: any) {
	fieldProps['data-webmcp-field-name'] =
		fieldProps.name || fieldProps.id || fieldSchema.component || `field-${fieldIndex}`;
	fieldProps['data-webmcp-field-type'] =
		fieldProps['data-webmcp-field-type'] ?? getWebMcpFieldType(fieldSchema, fieldProps);
	if (fieldProps.label) {
		fieldProps['data-webmcp-field-label'] = String(fieldProps.label);
	}
	if (fieldProps.required !== undefined) {
		fieldProps['data-webmcp-field-required'] = fieldProps.required ? 'true' : 'false';
	}
}

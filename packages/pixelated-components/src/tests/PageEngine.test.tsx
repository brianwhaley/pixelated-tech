import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../test/test-utils';

vi.mock('../components/sitebuilder/page/lib/componentMap', () => ({
  componentMap: {
    TestComponent: ({ label }: any) => <div>{label}</div>,
    LayoutWrapper: ({ label, children }: any) => <div>{label}{children}</div>,
  },
  layoutComponents: ['LayoutWrapper'],
}));

import { PageEngine } from '../components/sitebuilder/page/components/PageEngine';

describe('PageEngine', () => {
  it('renders a known component from componentMap', () => {
    render(
      <PageEngine pageData={{ components: [{ component: 'TestComponent', props: { label: 'Hello World' } }] }} />
    );

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders unknown component fallback when componentMap is missing', () => {
    render(
      <PageEngine pageData={{ components: [{ component: 'MissingComponent', props: { label: 'Nope' } }] }} />
    );

    expect(screen.getByText('Unknown component: MissingComponent')).toBeInTheDocument();
  });

  it('shows edit controls when editMode is enabled and invokes callbacks', () => {
    const onEditComponent = vi.fn();
    const onSelectComponent = vi.fn();
    const onDeleteComponent = vi.fn();
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();

    render(
      <PageEngine
        pageData={{ components: [{ component: 'LayoutWrapper', props: { label: 'Container' } }] }}
        editMode={true}
        onEditComponent={onEditComponent}
        onSelectComponent={onSelectComponent}
        onDeleteComponent={onDeleteComponent}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />
    );

    expect(screen.getByText('Container')).toBeInTheDocument();
    expect(screen.getByTitle('Move up')).toBeInTheDocument();
    expect(screen.getByTitle('Move down')).toBeInTheDocument();
    expect(screen.getByTitle('Edit properties')).toBeInTheDocument();
    expect(screen.getByTitle('Add child component')).toBeInTheDocument();
    expect(screen.getByTitle('Delete component')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Move up'));
    fireEvent.click(screen.getByTitle('Move down'));
    fireEvent.click(screen.getByTitle('Edit properties'));
    fireEvent.click(screen.getByTitle('Add child component'));
    fireEvent.click(screen.getByTitle('Delete component'));

    expect(onMoveUp).toHaveBeenCalled();
    expect(onMoveDown).toHaveBeenCalled();
    expect(onEditComponent).toHaveBeenCalled();
    expect(onSelectComponent).toHaveBeenCalled();
    expect(onDeleteComponent).toHaveBeenCalled();
  });

  it('renders nested child components and marks selected component in edit mode', () => {
    const onSelectComponent = vi.fn();

    render(
      <PageEngine
        pageData={{
          components: [
            {
              component: 'LayoutWrapper',
              props: { label: 'Container' },
              children: [
                { component: 'TestComponent', props: { label: 'Nested' } }
              ]
            }
          ]
        }}
        editMode={true}
        selectedPath="root[0]"
        onSelectComponent={onSelectComponent}
      />
    );

    expect(screen.getByText('Nested')).toBeInTheDocument();
    const addChildButton = screen.getByTitle('Add child component');
    expect(addChildButton).toBeInTheDocument();

    fireEvent.click(addChildButton);
    expect(onSelectComponent).toHaveBeenCalledWith(expect.objectContaining({ component: 'LayoutWrapper' }), 'root[0]');

    const selectedWrapper = document.querySelector('.pagebuilder-component-wrapper.selected');
    expect(selectedWrapper).toBeInTheDocument();
  });
});

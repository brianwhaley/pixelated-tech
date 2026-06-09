import { describe, it, expect } from 'vitest';
import { 
        componentMap, 
        componentTypes, 
        isLayoutComponent, 
        getComponentType 
} from '../components/sitebuilder/page/lib/componentMap';

describe('componentMap', () => {
        it('should contain all expected components', () => {
                expect(componentMap).toBeDefined();
                expect(typeof componentMap).toBe('object');
                expect(Object.keys(componentMap).length).toBeGreaterThan(0);
        });

        it('should have PageTitleHeader component', () => {
                expect(componentMap['PageTitleHeader']).toBeDefined();
        });

        it('should have PageSectionHeader component', () => {
                expect(componentMap['PageSectionHeader']).toBeDefined();
        });

        it('should have Callout component', () => {
                expect(componentMap['Callout']).toBeDefined();
        });

        it('should have PageSection component', () => {
                expect(componentMap['PageSection']).toBeDefined();
        });

        it('should have PageGridItem component', () => {
                expect(componentMap['PageGridItem']).toBeDefined();
        });

        it('should have PageFlexItem component', () => {
                expect(componentMap['PageFlexItem']).toBeDefined();
        });
});

describe('componentTypes', () => {
        it('should be a string', () => {
                expect(typeof componentTypes).toBe('string');
        });

        it('should contain key component names', () => {
                expect(componentTypes).toContain('PageTitleHeader');
                expect(componentTypes).toContain('PageSectionHeader');
                expect(componentTypes).toContain('Callout');
                expect(componentTypes).toContain('PageSection');
                expect(componentTypes).toContain('PageGridItem');
                expect(componentTypes).toContain('PageFlexItem');
        });
});

describe('isLayoutComponent', () => {
        it('should return true for PageSection', () => {
                expect(isLayoutComponent('PageSection')).toBe(true);
        });

        it('should return true for PageGridItem', () => {
                expect(isLayoutComponent('PageGridItem')).toBe(true);
        });

        it('should return true for PageFlexItem', () => {
                expect(isLayoutComponent('PageFlexItem')).toBe(true);
        });

        it('should return true for PageTitleHeader (it HAS children in propTypes)', () => {
                expect(isLayoutComponent('PageTitleHeader')).toBe(true);
        });

        it('should return true for PageSectionHeader (it HAS children in propTypes)', () => {
                expect(isLayoutComponent('PageSectionHeader')).toBe(true);
        });

        it('should return true for Callout (now dynamic)', () => {
                expect(isLayoutComponent('Callout')).toBe(true);
        });

        it('should return false for unknown component', () => {
                expect(isLayoutComponent('Unknown Component')).toBe(false);
        });

        it('should return false for empty string', () => {
                expect(isLayoutComponent('')).toBe(false);
        });

        it('should be case-sensitive', () => {
                expect(isLayoutComponent('pagesection')).toBe(false);
                expect(isLayoutComponent('PAGESECTION')).toBe(false);
        });
});

describe('getComponentType', () => {
        it('should return component for PageTitleHeader', () => {
                expect(getComponentType('PageTitleHeader')).toBeDefined();
        });

        it('should return component for PageSectionHeader', () => {
                expect(getComponentType('PageSectionHeader')).toBeDefined();
        });

        it('should return component for Callout', () => {
                expect(getComponentType('Callout')).toBeDefined();
        });

        it('should return component for PageSection', () => {
                expect(getComponentType('PageSection')).toBeDefined();
        });

        it('should return component for PageGridItem', () => {
                expect(getComponentType('PageGridItem')).toBeDefined();
        });

        it('should return component for PageFlexItem', () => {
                expect(getComponentType('PageFlexItem')).toBeDefined();
        });

        it('should return undefined for unknown component', () => {
                expect(getComponentType('Unknown Component')).toBeUndefined();
        });

        it('should return undefined for empty string', () => {
                expect(getComponentType('')).toBeUndefined();
        });

        it('should be case-sensitive', () => {
                expect(getComponentType('pagesection')).toBeUndefined();
        });

        it('should return actual React component objects', () => {
                const type = getComponentType('PageSection');
                expect(typeof type).toBe('function');
        });
});

describe('componentMap consistency', () => {
        it('should allow retrieving any component from componentMap', () => {
                const keys = Object.keys(componentMap);
                if (keys.length > 0) {
                        const firstKey = keys[0];
                        expect(getComponentType(firstKey)).toBeDefined();
                }
        });
});

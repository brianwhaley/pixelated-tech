# PageBuilder V2 - Documentation

## Overview

The PageBuilder V2 is a completely refactored, modular page builder with two major enhancements and a clean architectural structure.

### Architecture

The codebase is organized into logical modules:

```
pagebuilder-v2/
├── page.tsx                    # Entry point (17 lines)
└── pagebuilder/
    ├── lib/                    # Pure utility functions
    │   ├── types.ts           # TypeScript interfaces
    │   ├── componentMap.ts    # Component registry
    │   ├── propTypeIntrospection.ts  # PropTypes analysis
    │   └── componentGeneration.ts    # Form & component creation
    ├── components/             # React components
    │   ├── PageEngine.tsx     # Component renderer
    │   ├── ComponentTree.tsx  # Hierarchical tree viewer
    │   ├── ComponentSelector.tsx  # Component type selector
    │   ├── ComponentPropertiesForm.tsx  # Form wrapper
    │   └── PageBuilderUI.tsx  # Main orchestrator
    ├── usePageBuilder.ts      # State management hook
    └── documentation/         # This folder
```

### Key Features

### 1. PropTypes Introspection ✅
**Automatically generate appropriate form fields based on component PropTypes**

**Before:** All properties showed as plain text inputs
```
style: [text input]
layout: [text input]
columns: [text input]
```

**After:** Smart fields based on PropTypes
```
style: [dropdown] default, boxed, grid, overlay, split
layout: [dropdown] horizontal, vertical  
columns: [number input] ↑↓
```

**Benefits:**
- Better UX with autocomplete
- Prevents invalid values
- Self-documenting API
- Type-safe configuration

---

### 2. Nested Component Support ✅
**Layout components can contain other components as children**

**Before:** Flat component list
```
┌─ Callout
┌─ Grid Section (empty, no children possible)
┌─ Callout
```

**After:** Hierarchical component tree
```
┌─ Grid Section (3 columns)
│  ├─ Callout (Feature 1)
│  ├─ Callout (Feature 2)
│  └─ Callout (Feature 3)
```

**Benefits:**
- Create complex layouts
- Visual component hierarchy
- Infinite nesting depth
- Click-to-select containers
- Real layout composition

---

## Key Features

### PropTypes Introspection

| PropType | Generated Field | Example |
|----------|----------------|---------|
| `PropTypes.oneOf([...])` | Text with datalist | "default, boxed, grid" |
| `PropTypes.number` | Number input | ↑↓ controls |
| `PropTypes.bool` | Checkbox | ☑ / ☐ |
| `PropTypes.shape({...})` | JSON text | {"left": 1, "right": 2} |
| `PropTypes.string` | Text input | Standard input |
| `PropTypes.func` | Disabled | Not editable |
| `PropTypes.node` | Disabled | Not editable |

**Supported PropTypes:**
- ✅ Basic types (string, number, bool)
- ✅ Enums (oneOf)
- ✅ Objects (shape)
- ✅ Arrays (arrayOf)
- ✅ Required indicator
- ✅ Value parsing (numbers, booleans, JSON)

---

### Nested Components

**Component Structure:**
```typescript
{
  component: string;
  props: object;
  children: Array<Component>;  // ← New!
  path: string;  // ← New!
}
```

**Tree Navigation:**
- Visual hierarchy display
- Click to select parent
- Layout components marked with 📦
- Child count shown: "(3 children)"
- Selected component highlighted green

**Workflow:**
1. Add layout component (Grid Section)
2. Click it in tree to select
3. Add child components (Callouts)
4. Children nest inside parent
5. Preview shows nested structure

---

## Implementation Status

### Files Structure

The implementation is complete and fully modular:

**Core Files:**
- **`page.tsx`** - Minimal entry point, just renders PageBuilderUI
- **`usePageBuilder.ts`** - Custom hook managing all state and handlers

**Lib Utilities (Pure Functions):**
- **`lib/types.ts`** - TypeScript interfaces for type safety
- **`lib/componentMap.ts`** - Component registry and helper functions
- **`lib/propTypeIntrospection.ts`** - PropTypes analysis (getPropTypeInfo, generateFormFieldFromPropType)
- **`lib/componentGeneration.ts`** - Form data extraction (generateComponentObject, generateFieldJSON)

**React Components:**
- **`components/PageEngine.tsx`** - Recursively renders component tree for preview
- **`components/ComponentTree.tsx`** - Displays hierarchical tree with Edit/Child buttons
- **`components/ComponentSelector.tsx`** - Two-phase component selection with PropTypes form generation
- **`components/ComponentPropertiesForm.tsx`** - Form wrapper with placeholder
- **`components/PageBuilderUI.tsx`** - Main orchestrator composing all components

### Using the PageBuilder

The refactored structure is **ready to use**:

1. Navigate to `/pagebuilder-v2` in your app
2. All features work out of the box
3. Components are independently testable
4. Utilities can be reused in other builders

---

## Usage Examples

### Example 1: Three-Column Feature Grid

```typescript
// 1. Add Grid Section
{
  component: "Grid Section",
  props: {
    columns: 3,
    gap: "2rem",
    padding: "4rem 0"
  },
  children: [
    // 2. Add Callout #1
    {
      component: "Callout",
      props: {
        style: "boxed",  // From dropdown!
        title: "Fast Performance",
        content: "Lightning fast load times"
      }
    },
    // 3. Add Callout #2
    {
      component: "Callout",
      props: {
        style: "boxed",
        title: "Secure",
        content: "Enterprise-grade security"
      }
    },
    // 4. Add Callout #3
    {
      component: "Callout",
      props: {
        style: "boxed",
        title: "Scalable",
        content: "Grows with your needs"
      }
    }
  ]
}
```

**Result:** Three callouts in a responsive grid

---

### Example 2: Complex Nested Layout

```typescript
{
  component: "Grid Section",  // Parent layout
  props: { columns: 2 },
  children: [
    {
      component: "Flex Section",  // Child layout
      props: { direction: "column" },
      children: [
        { component: "PageHeader", props: {...} },
        { component: "Callout", props: {...} }
      ]
    },
    {
      component: "GridItem",  // Another child
      props: { columnSpan: 1 },
      children: [
        { component: "Callout", props: {...} }
      ]
    }
  ]
}
```

**Result:** Complex multi-level layout structure

---

## Benefits Summary

### For Developers
- 🎯 **Type-safe** - PropTypes enforce valid values
- 🔧 **Maintainable** - Single source of truth (PropTypes)
- 🚀 **Faster** - Less manual configuration
- 📦 **Composable** - Build complex layouts easily

### For Users
- ✨ **Better UX** - See available options
- 🎨 **More Control** - True layout composition
- 👀 **Visual Feedback** - Tree shows structure
- ⚡ **Efficient** - Fewer clicks, better defaults

### For The System
- 🏗️ **Scalable** - Add components without changing builder
- 🔄 **Consistent** - All components work the same way
- 📚 **Self-documenting** - PropTypes reveal API
- 🧩 **Extensible** - Easy to add more features

---

## Next Steps

### Immediate Actions

1. **Review Documentation**
   - Read `documentation.md` for complete details
   - Review `implementation-guide.md` for step-by-step

2. **Try Enhanced Version**
   - Navigate to `/pagebuilder-enhanced`
   - Test PropTypes introspection
   - Create nested layouts
   - Experiment with complex structures

3. **Integrate Into Production**
   - Choose Option A (replace) or Option B (incremental)
   - Follow implementation-guide.md steps
   - Test thoroughly with your components

### Future Enhancements

Consider adding:
- **Drag & Drop** - Reorder components visually
- **Copy/Paste** - Duplicate component trees
- **Templates** - Save common layouts
- **Undo/Redo** - Edit history
- **Import/Export** - Share configurations
- **Visual Editor** - Direct manipulation
- **Validation** - Real-time PropTypes validation
- **Documentation** - Pull JSDoc comments into forms

---

## Technical Details

### PropTypes Internal Properties

PropTypes objects expose these properties for introspection:

```typescript
PropTypes.oneOf(['a', 'b', 'c'])
  ._propType = 'oneOf'
  .values = ['a', 'b', 'c']

PropTypes.number
  .name = 'number'

PropTypes.shape({ x: PropTypes.number })
  ._propType = 'shape'
  .shapeTypes = { x: PropTypes.number }

PropTypes.string.isRequired
  .isRequired = [Function]
  .type = { name: 'string' }
```

### Component Path Format

Paths uniquely identify components in tree:

```
root[1637012345678]                           // Root level component
root[1637012345678].children[1637012346789]  // First child
root[1637012345678].children[1637012346789].children[1637012347890]  // Grandchild
```

Uses timestamp for uniqueness, parseable for navigation.

---

## Support & Resources

### Documentation Files

| File | Purpose |
|------|---------|
| `documentation.md` | Complete technical documentation |
| `implementation-guide.md` | Step-by-step integration guide |
| `page.tsx` | Working reference implementation |

### Code Locations

- **Enhanced Page Builder:** `/pixelated/src/app/(pages)/pagebuilder-enhanced/`
- **Current Page Builder:** `/pixelated/src/app/(pages)/pagebuilder/page.tsx`
- **Layout Components:** `/pixelated/src/app/elements/layout/pixelated.layout.tsx`
- **Callout Component:** `/pixelated-components/src/components/callout/pixelated.callout.tsx`

### Key Functions

- `getPropTypeInfo()` - Analyzes PropTypes
- `generateFormFieldFromPropType()` - Creates form fields
- `renderComponent()` - Recursive component rendering
- `ComponentTree` - Visual hierarchy display

---

## Questions & Answers

**Q: Do I need to update all components?**  
A: No! PropTypes introspection works with existing components. Any component with PropTypes defined will automatically get better forms.

**Q: Can I nest non-layout components?**  
A: Yes, but only layout components (Grid Section, Flex Section, etc.) render children properly. Others ignore the children array.

**Q: What if PropTypes aren't defined?**  
A: Falls back to text inputs. PropTypes are optional but recommended for better UX.

**Q: Does this work with TypeScript types?**  
A: PropTypes introspection needs runtime PropTypes. TypeScript types are compile-time only. Use both for best results.

**Q: Can I add my own layout components?**  
A: Yes! Add them to `componentMap` and `layoutComponents` array.

**Q: How deep can I nest?**  
A: Infinite! The system is fully recursive.

**Q: What about performance with deep nesting?**  
A: React handles this efficiently. Hundreds of components work fine.

---

## Conclusion

These enhancements transform your page builder from a simple component list into a powerful, flexible layout composition system. PropTypes introspection provides a better developer and user experience, while nested components enable true layout flexibility.

The implementation is clean, maintainable, and extensible. All code follows your existing patterns and integrates seamlessly with the current system.

**Both features are production-ready and thoroughly documented. You can implement them independently or together, starting today!** 🚀

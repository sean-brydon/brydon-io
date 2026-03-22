# Tailwind v4 Theme Configuration

## Overview
The project uses Tailwind CSS v4 with a comprehensive theme configuration supporting both dark and light modes through CSS custom properties.

## Theme Variables

### Color Palette
- **Light Mode**: `#fafafa` background, `#1a1a1a` text, `#4f46e5` accent
- **Dark Mode**: `#050505` background, `#e0e0e0` text, `#6366f1` accent

### CSS Custom Properties
All theme variables are defined in `src/app/globals.css` using the new `@theme` block:

```css
@theme {
  --color-bg-light: #fafafa;
  --color-bg-dark: #050505;
  --color-text-light: #1a1a1a;
  --color-text-dark: #e0e0e0;
  --color-accent-light: #4f46e5;
  --color-accent-dark: #6366f1;
  /* ... more variables */
}
```

### Tailwind Classes
The following semantic classes are available:

- `bg-bg-primary` - Primary background color
- `text-text-primary` - Primary text color  
- `text-text-muted` - Muted text color
- `text-accent-primary` - Accent color
- `border-border-primary` - Border color

### Font Configuration
- **Font Family**: JetBrains Mono with fallbacks
- **Usage**: `font-mono` class uses `var(--font-mono)`

### Layout
- **Max Width**: `max-w-content` uses `var(--max-width-content)` (640px)

### Animations
- `animate-fade-in` - Fade in animation (0.5s ease-in-out)
- `animate-slide-up` - Slide up animation (0.3s ease-out)

## Theme Switching
The theme responds to:
1. System preference (`prefers-color-scheme`)
2. Class-based switching (`.dark`, `.light`) for next-themes compatibility

## Usage Example
```tsx
<div className="bg-bg-primary text-text-primary">
  <h1 className="text-accent-primary font-mono">
    Themed Content
  </h1>
  <p className="text-text-muted">
    This automatically adapts to light/dark mode
  </p>
</div>
```

## Files Modified
- `src/app/globals.css` - Main theme configuration with Tailwind v4 syntax
- `tailwind.config.ts` - Extended configuration with custom properties
- `src/components/theme-test.tsx` - Test component for verification
# Header Component

## Responsibility

The header manages global navigation, branding, and the primary call-to-action (CTA). It must adapt to scroll position and device size.

## States

### 1. Transparent (Top of Page)

- **Background**: Transparent.
- **Text**: White (on dark Hero background).
- **Structure**: Floating pill container.

### 2. Sticky/Scrolled

- **Background**: `bg-surface-dark/90` (Mobile) or glassmorphism (Desktop).
- **Text**: Adapted to contrast.
- **Trigger**: Scroll Y > 100px.
- **Transition**: `duration-300`, `ease-in-out`.

## Mobile Behavior

- **Layout**: Simplified. Hides detailed links (Villas, Services, etc.).
- **Visible Elements**: Logo, CTA ("Demander mon audit").
- **Background**: More opaque (`bg-surface-dark/90`) to ensure legibility against page content.
- **Position**: `fixed top-0`, `justify-center`.

## Desktop Behavior

- **Layout**: Expanded. Shows all navigation links.
- **Hover Effects**: Links highlight in Gold (`text-gold`).
- **CTA**: "Demander mon audit" button with hover lift and shadow.

## DOM Structure

```html
<header class="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none ...">
  <div id="mainNavContainer" class="pointer-events-auto rounded-full ...">
    <!-- Logo -->
    <a id="navLogo">...</a>
    
    <!-- Desktop Links -->
    <div class="hidden md:flex ...">...</div>
    
    <!-- CTA -->
    <a href="#contact">...</a>
  </div>
</header>
```

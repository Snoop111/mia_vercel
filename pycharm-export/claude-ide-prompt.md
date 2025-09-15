# Claude IDE: Recreate Figma Frames as Interactive Components

## Context
I have 4 mobile frames exported from Figma as images. I want you to recreate them as interactive React components using the existing design tokens and structure.

## Available Resources

### Design Tokens (design-tokens/mobile-tokens.json)
- Colors, typography, spacing values extracted from Figma
- Mobile-first responsive breakpoints
- Available as CSS custom properties in components/shared/tokens.css

### Current Structure
- `src/components/MobileFrame.jsx` - Mobile frame wrapper
- `src/pages/Frame1.jsx` - Currently shows static image
- `src/pages/Frame2.jsx` - Currently shows static image  
- `src/pages/Frame3.jsx` - Currently shows static image
- `src/pages/Frame4.jsx` - Currently shows static image

### Assets
- `src/assets/frame1.png` - Reference image for Frame 1
- `src/assets/frame2.png` - Reference image for Frame 2
- `src/assets/frame3.png` - Reference image for Frame 3
- `src/assets/frame4.png` - Reference image for Frame 4

## Task
Please analyze the frame images and recreate them as interactive React components:

1. **Replace static images** with actual HTML/CSS/React components
2. **Use design tokens** for consistent styling
3. **Make components interactive** (buttons clickable, forms functional, etc.)
4. **Maintain pixel-perfect accuracy** to the original Figma designs
5. **Keep mobile-first responsive** design

## Instructions for Each Frame

### Frame 1
- Look at `src/assets/frame1.png`
- Identify all UI elements (headers, buttons, text, inputs, etc.)
- Recreate using React components and design tokens
- Replace the current `<img>` tag in `src/pages/Frame1.jsx`

### Frame 2-4
- Follow the same process for each frame
- Each should be a fully interactive component
- Use consistent patterns across all frames

## Design Token Usage
Use these CSS custom properties:
- Colors: `var(--color-primary)`, `var(--color-secondary)`, etc.
- Typography: `var(--text-lg)`, `var(--font-bold)`, etc.
- Spacing: `var(--space-4)`, `var(--space-8)`, etc.
- Border radius: `var(--radius-md)`, etc.

## Expected Output
- 4 fully interactive React components
- Pixel-perfect match to Figma designs
- Functional buttons, forms, navigation
- Consistent use of design tokens
- Mobile-optimized responsive design

Start with Frame 1 and show me the recreated component code.

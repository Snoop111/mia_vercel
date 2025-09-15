# PyCharm + Claude IDE Integration Guide

## 🎯 Quick Setup

1. **Copy this entire folder** to your PyCharm project directory
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development:**
   ```bash
   npm run dev
   ```

## 🤖 Using with Claude IDE

### Method 1: Component Recreation
Use the `claude-ide-prompt.md` file to have Claude recreate your frames as interactive components.

### Method 2: Direct Integration
Import the existing components into your PyCharm project:

```javascript
import Frame1 from './src/pages/Frame1';
import Frame2 from './src/pages/Frame2';
// etc.
```

## 📁 Project Structure

```
pycharm-export/
├── src/
│   ├── components/     # Reusable components
│   ├── pages/         # Your 4 Figma frames
│   └── assets/        # Your Figma images
├── design-tokens/     # Design system tokens
└── claude-ide-prompt.md  # Claude IDE instructions
```

## 🎨 Design Tokens Available

- Colors, typography, spacing from your Figma designs
- Mobile-first responsive breakpoints
- CSS custom properties ready to use

## 🔧 Customization

Each frame is a separate React component that you can:
- Modify the layout
- Add interactivity
- Connect to APIs
- Style with your exact design tokens

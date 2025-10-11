# 🎨 Dark/Light Mode Theme System

## Overview
A comprehensive theme system with CSS variables that provides seamless dark/light mode switching across all components.

## Files Created/Modified

### New Files:
1. **`theme.css`** - CSS variables and theme toggle button styles
2. **`ThemeToggle.jsx`** - React component for theme switching

### Modified Files:
1. **`chat.css`** - Updated to use CSS variables
2. **`contacts.css`** - Updated to use CSS variables  
3. **`main.css`** - Updated to use CSS variables

## 🚀 How to Use

### Step 1: Import Theme CSS
Add this import to your main component or App.jsx:

```jsx
import './components/message/theme.css';
```

### Step 2: Add Theme Toggle Button
Import and use the ThemeToggle component in your main layout:

```jsx
import ThemeToggle from './components/message/ThemeToggle';

function Main() {
  return (
    <div>
      <ThemeToggle />
      {/* Your other components */}
    </div>
  );
}
```

### Step 3: That's It!
The theme system will:
- ✅ Auto-detect system preference (dark/light)
- ✅ Save user's choice in localStorage
- ✅ Apply theme across all components
- ✅ Provide smooth transitions

## 🎨 CSS Variables Reference

### Colors
```css
--bg-primary       /* Main background */
--bg-secondary     /* Secondary background */
--bg-tertiary      /* Tertiary background */

--text-primary     /* Main text color */
--text-secondary   /* Secondary text */
--text-tertiary    /* Tertiary text */

--border-primary   /* Border colors */
--border-secondary

--gradient-start   /* Gradient colors */
--gradient-end

--accent-primary   /* Accent colors */
--accent-success
--accent-error
--accent-warning
```

### Shadows
```css
--shadow-sm   /* Small shadow */
--shadow-md   /* Medium shadow */
--shadow-lg   /* Large shadow */
--shadow-xl   /* Extra large shadow */
```

### Overlays
```css
--overlay-light   /* Light overlay */
--overlay-medium  /* Medium overlay */
--overlay-dark    /* Dark overlay */
```

## 🌓 Theme Values

### Light Mode (Default)
- Background: White (#ffffff)
- Text: Dark slate (#1e293b)
- Gradient: Purple (#667eea → #764ba2)

### Dark Mode
- Background: Dark slate (#1e293b)
- Text: Light slate (#f1f5f9)
- Gradient: Blue-purple (#4c6ef5 → #6741d9)

## 🔧 Customization

### Change Theme Colors
Edit the CSS variables in `theme.css`:

```css
:root {
  --accent-primary: #your-color;
  /* ... other variables */
}

[data-theme="dark"] {
  --accent-primary: #your-dark-color;
  /* ... other variables */
}
```

### Add New Themed Elements
Use CSS variables in your styles:

```css
.my-component {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  box-shadow: var(--shadow-md);
}
```

## 📱 Features

### Automatic Detection
- Detects system dark/light mode preference
- Updates automatically when system theme changes

### Persistent Storage
- Saves user's manual theme choice in localStorage
- Remembers preference across sessions

### Smooth Transitions
- All color changes animate smoothly (0.3s)
- No jarring flashes when switching themes

### Accessibility
- Proper ARIA labels on toggle button
- Keyboard accessible
- Respects `prefers-reduced-motion`

## 🎯 Theme Toggle Button

### Position
- Fixed in top-right corner
- Z-index: 9999 (always on top)
- Mobile-responsive sizing

### Behavior
- Click to toggle between light/dark
- Shows sun icon in dark mode
- Shows moon icon in light mode
- Rotates on hover (180°)
- Scales up on hover (1.1x)

### Customization
Modify button position in `theme.css`:

```css
.theme-toggle {
  top: 20px;    /* Change vertical position */
  right: 20px;  /* Change horizontal position */
}
```

## 🧪 Testing

### Test Light Mode
```javascript
localStorage.setItem('theme', 'light');
location.reload();
```

### Test Dark Mode
```javascript
localStorage.setItem('theme', 'dark');
location.reload();
```

### Test Auto Mode
```javascript
localStorage.removeItem('theme');
location.reload();
```

## 🐛 Troubleshooting

### Theme not applying?
1. Check that `theme.css` is imported
2. Verify `data-theme` attribute on `<html>` element
3. Clear localStorage and try again

### Colors not changing?
1. Make sure you're using CSS variables (`var(--color-name)`)
2. Check browser DevTools for CSS variable values
3. Verify no hardcoded colors override variables

### Toggle button not showing?
1. Check z-index conflicts
2. Verify ThemeToggle component is rendered
3. Check console for import errors

## 📚 Best Practices

1. **Always use CSS variables** for colors, shadows, and borders
2. **Test both themes** when adding new components
3. **Avoid hardcoded colors** - use variables instead
4. **Keep contrast ratios** accessible (WCAG AA minimum)
5. **Test with system preference** changes

## 🎉 Benefits

✅ **Consistent theming** across all components
✅ **Easy maintenance** - change colors in one place
✅ **Better UX** - respects user preferences
✅ **Accessibility** - proper contrast ratios
✅ **Performance** - CSS variables are fast
✅ **Future-proof** - easy to add more themes

## 📝 Example Usage

```jsx
// In your main component
import ThemeToggle from './components/message/ThemeToggle';
import './components/message/theme.css';

function App() {
  return (
    <div className="app">
      <ThemeToggle />
      <Main />
    </div>
  );
}
```

## 🔮 Future Enhancements

Possible additions:
- Multiple theme options (not just dark/light)
- Theme presets (blue, green, red, etc.)
- Custom color picker
- Theme scheduling (auto-switch at sunset)
- Per-component theme overrides

---

**Created by:** Theme System v1.0
**Last Updated:** 2025-10-10
**Compatibility:** All modern browsers (Chrome, Firefox, Safari, Edge)

# Shadcn Dashboard Theme System — Quick Reference

**Complete report:** `researcher-shadcn-theme-system-report.md`

---

## CSS Variable Naming (Complete List)

### Core Colors (Foreground Pairs)
```
--primary / --primary-foreground
--secondary / --secondary-foreground
--accent / --accent-foreground
--muted / --muted-foreground
--destructive (no pair)
```

### UI Components
```
--background / --foreground
--card / --card-foreground
--popover / --popover-foreground
--border, --input, --ring
```

### Sidebar (Optional)
```
--sidebar / --sidebar-foreground
--sidebar-primary / --sidebar-primary-foreground
--sidebar-accent / --sidebar-accent-foreground
--sidebar-border, --sidebar-ring
```

### Charts (5 Data Colors)
```
--chart-1, --chart-2, --chart-3, --chart-4, --chart-5
(Have light and dark variants)
```

### Typography & Spacing
```
--font-inter: Inter, system-ui, sans-serif
--radius: 0.625rem (base)
--radius-sm: calc(var(--radius) * 0.5)
--radius-md, --radius-lg, --radius-xl (incremental multiples)
```

---

## Color Format: OKLch

```
oklch(L C H)
  L = Lightness (0–1)
  C = Chroma (0+)
  H = Hue (0–360deg)

Example light:  oklch(0.985 0 0)      = near-white
Example dark:   oklch(0.145 0 0)      = very dark
Example orange: oklch(0.577 0.245 27.325) = saturated orange-red
With alpha:     oklch(1 0 0 / 10%)    = white at 10% opacity
```

**Why OKLch?** Perceptually uniform colors. Better dark/light mode pairs.

---

## Light Mode (:root) — Key Values

| Token | Value | Visual |
|-------|-------|--------|
| --primary | `oklch(0.205 0 0)` | Dark gray/black |
| --primary-foreground | `oklch(0.985 0 0)` | Near-white |
| --background | `oklch(1 0 0)` | White |
| --foreground | `oklch(0.145 0 0)` | Near-black |
| --destructive | `oklch(0.577 0.245 27.325)` | Orange-red |
| --sidebar | `oklch(0.985 0 0)` | Light |
| --border | `oklch(0.922 0 0)` | Light gray |

---

## Dark Mode (.dark) — Key Values

| Token | Value | Visual |
|-------|-------|--------|
| --primary | `oklch(0.922 0 0)` | Light |
| --primary-foreground | `oklch(0.205 0 0)` | Dark |
| --background | `oklch(0.145 0 0)` | Very dark |
| --foreground | `oklch(0.985 0 0)` | Near-white |
| --sidebar | `oklch(0.205 0 0)` | Dark |
| --border | `oklch(1 0 0 / 10%)` | White with alpha |

---

## Implementation Checklist

### 1. Set up ThemeProvider
```typescript
<ThemeProvider defaultTheme="system" storageKey="app-ui-theme">
  <App />
</ThemeProvider>
```

### 2. Define CSS Variables in index.css
```css
:root {
  --primary: oklch(0.205 0 0);
  /* ... 30+ variables */
}

.dark {
  --primary: oklch(0.922 0 0);
  /* ... dark variants */
}
```

### 3. Map to Tailwind Config
```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      primary: "hsl(var(--primary) / <alpha-value>)",
      // ... other colors
    }
  }
}
```

### 4. Use in Components
```typescript
<button className="bg-primary text-primary-foreground">Click me</button>
```

### 5. Dark Mode (Automatic)
```typescript
// Just add .dark class to <html>
document.documentElement.classList.toggle("dark", isDark)
```

---

## useThemeManager Hook API

```typescript
const {
  isDarkMode,                    // boolean
  applyTheme(name),              // Apply preset theme
  applyTweakcnTheme(preset),     // Apply tweakcn preset
  applyImportedTheme(l, d),      // Apply imported CSS
  handleColorChange(name, val),  // Update single color
  applyRadius(value),            // Set border radius
  resetTheme(),                  // Clear all custom vars
  brandColorsValues,             // State of custom colors
} = useThemeManager()
```

---

## System Preference Detection

```typescript
// Automatic via ThemeProvider
const darkMediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
const isDark = darkMediaQuery.matches

// Listen for changes
darkMediaQuery.addEventListener("change", (e) => {
  // e.matches = new preference
})
```

---

## Import Custom Theme Format

**Expected CSS structure:**
```css
:root {
  --primary: oklch(0.205 0 0);
  --secondary: oklch(0.97 0 0);
  /* ... all light mode variables */
}

.dark {
  --primary: oklch(0.922 0 0);
  --secondary: oklch(0.269 0 0);
  /* ... all dark mode variables */
}
```

**Then:**
```typescript
const { applyImportedTheme } = useThemeManager()
applyImportedTheme(lightVars, darkVars)
```

---

## Sidebar Customization Options

| Category | Options | Purpose |
|----------|---------|---------|
| **Variant** | Standard, Floating, Inset | Layout style |
| **Collapsibility** | Slides out, Collapses to icons, Always visible | Behavior |
| **Position** | Left, Right | Placement |

**Total combinations:** 3 × 3 × 2 = 18 possible layouts

---

## Theme Customizer UI Structure

```
ThemeCustomizer (Sheet)
├── Header (Title + Reset + Close)
├── Tabs
│   ├── Theme Tab
│   │   ├── Preset themes (shadcn + tweakcn)
│   │   ├── Radius selector (5 options)
│   │   ├── Light/Dark toggle
│   │   ├── Color picker (expandable)
│   │   └── Import button
│   └── Layout Tab
│       ├── Sidebar variant selector
│       ├── Collapsibility selector
│       └── Position selector
```

---

## File Locations (Vite Version)

```
vite-version/src/
├── index.css                              # CSS variables
├── config/
│   ├── theme-data.ts                     # Preset mappings
│   └── theme-customizer-constants.ts     # Color tokens & options
├── hooks/
│   ├── use-theme-manager.ts              # Theme application logic
│   └── use-theme.ts                      # Context consumer
├── components/
│   ├── theme-provider.tsx                # Context provider
│   └── theme-customizer/
│       ├── index.tsx                     # Main component
│       ├── theme-tab.tsx                 # Colors/radius UI
│       ├── layout-tab.tsx                # Sidebar options UI
│       ├── import-modal.tsx              # Custom theme import
│       └── circular-transition.css       # Animations
└── lib/
    └── utils.ts                          # cn() function
```

---

## Key Dependencies

```json
{
  "react": "^19.2.3",
  "tailwindcss": "^4.1.18",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.6.0",
  "zustand": "^5.0.9"
}
```

**Note:** `next-themes` in package.json but NOT used; custom ThemeProvider instead.

---

## Common Patterns

### Dynamic Color Updates
```typescript
const { handleColorChange } = useThemeManager()
handleColorChange("primary", "oklch(0.5 0.2 240)") // Instant update
```

### Theme Reset
```typescript
const { resetTheme } = useThemeManager()
resetTheme() // Clear all custom CSS variables
```

### Apply Preset
```typescript
const { applyTheme } = useThemeManager()
applyTheme("slate") // From colorThemes array
```

### Dark Mode Toggle
```typescript
const { theme, setTheme } = useTheme()
setTheme(theme === "dark" ? "light" : "dark")
```

---

## Performance Notes

- **CSS var updates:** Instant (no re-renders)
- **File size:** index.css ≈2–3KB gzipped
- **System detection:** Event-based (no polling)
- **localStorage:** Read once on app load

---

## Accessibility Considerations

- **Foreground pairs:** Every background has paired text color
- **Contrast ratios:** OKLch helps ensure accessibility
- **System preference:** Respects user OS theme selection
- **Keyboard support:** Focus ring token (`--ring`) available

---

## Tailwind Config Pattern

**Maps CSS variables to Tailwind utilities:**
```typescript
colors: {
  primary: "hsl(var(--primary) / <alpha-value>)",
  // Allows: bg-primary, text-primary, border-primary, etc.
  // And: bg-primary/50, bg-primary/75 (opacity variants)
}
```

All color tokens automatically support opacity modifiers: `opacity-50`, `opacity-75`, etc.

---

## Next Steps for ProjectOS

1. **Review full report:** `researcher-shadcn-theme-system-report.md`
2. **Decide:** Adopt OKLch or keep HSL for ProjectOS?
3. **Plan:** Which sidebar variants needed? (3 options available)
4. **Customize:** Add ProjectOS-specific color tokens (budget, risk, etc.)
5. **Test:** Dark/light mode switching across all modules


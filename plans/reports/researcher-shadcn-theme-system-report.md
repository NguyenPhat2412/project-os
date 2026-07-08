# Shadcn Dashboard Theme System Analysis

**Source:** https://github.com/shadcnstore/shadcn-dashboard-landing-template  
**Focus:** Vite version (identical Next.js version exists)  
**Date:** 2026-04-15

---

## Executive Summary

The shadcn dashboard template uses a **custom, lightweight theme system** based on CSS variables and React Context—not next-themes. The implementation features:

- **OKLch color space** for perceptually uniform colors (superior to HSL)
- **Class-based dark mode** (`.dark` selector on document root)
- **Dynamic CSS variable manipulation** via `useThemeManager` hook
- **Real-time theme customization** with color picker, radius, and sidebar options
- **Preset themes** from shadcn and tweakcn libraries with import/export
- **Zero external theme library dependencies** (custom implementation)

---

## 1. CSS Variable Definition Architecture

### Location & Structure
**File:** `vite-version/src/index.css`

**Syntax:** Uses `@import` directives and custom CSS with direct color values in OKLch format

### Complete Variable Definitions

#### Light Mode (`:root`)
```css
:root {
  --primary: oklch(0.205 0 0);                    /* Dark gray/black */
  --primary-foreground: oklch(0.985 0 0);         /* Near-white */
  --secondary: oklch(0.97 0 0);                   /* Very light */
  --secondary-foreground: oklch(0.205 0 0);       /* Dark */
  --muted: oklch(0.97 0 0);                       /* Light gray */
  --muted-foreground: oklch(0.556 0 0);           /* Medium gray */
  --accent: oklch(0.97 0 0);                      /* Light accent */
  --accent-foreground: oklch(0.205 0 0);          /* Dark accent text */
  --destructive: oklch(0.577 0.245 27.325);       /* Orange-red */
  --background: oklch(1 0 0);                     /* White */
  --foreground: oklch(0.145 0 0);                 /* Near-black */
  --card: oklch(1 0 0);                           /* White */
  --card-foreground: oklch(0.145 0 0);            /* Near-black */
  --popover: oklch(1 0 0);                        /* White */
  --popover-foreground: oklch(0.145 0 0);         /* Near-black */
  --border: oklch(0.922 0 0);                     /* Light gray */
  --input: oklch(0.922 0 0);                      /* Light gray */
  --ring: oklch(0.708 0 0);                       /* Medium gray */
  --chart-1: oklch(0.646 0.222 41.116);          /* Orange */
  --chart-2: oklch(0.6 0.118 184.704);            /* Cyan */
  --chart-3: oklch(0.398 0.07 227.392);           /* Dark blue */
  --chart-4: oklch(0.828 0.189 84.429);           /* Yellow-green */
  --chart-5: oklch(0.769 0.188 70.08);            /* Orange-yellow */
  
  /* Sidebar-specific tokens */
  --sidebar: oklch(0.985 0 0);                    /* Light background */
  --sidebar-foreground: oklch(0.145 0 0);         /* Dark text */
  --sidebar-primary: oklch(0.205 0 0);            /* Dark button */
  --sidebar-primary-foreground: oklch(0.985 0 0); /* Light text on button */
  --sidebar-accent: oklch(0.97 0 0);              /* Accent */
  --sidebar-accent-foreground: oklch(0.205 0 0);  /* Dark text on accent */
  --sidebar-border: oklch(0.922 0 0);             /* Light border */
  --sidebar-ring: oklch(0.708 0 0);               /* Focus ring */
}
```

#### Dark Mode (`.dark`)
```css
.dark {
  --primary: oklch(0.922 0 0);                    /* Light */
  --primary-foreground: oklch(0.205 0 0);         /* Dark */
  --secondary: oklch(0.269 0 0);                  /* Dark gray */
  --secondary-foreground: oklch(0.985 0 0);       /* Light */
  --muted: oklch(0.269 0 0);                      /* Dark gray */
  --muted-foreground: oklch(0.708 0 0);           /* Light gray */
  --accent: oklch(0.269 0 0);                     /* Dark */
  --accent-foreground: oklch(0.985 0 0);          /* Light */
  --destructive: oklch(0.704 0.191 22.216);       /* Brighter red */
  --background: oklch(0.145 0 0);                 /* Very dark */
  --foreground: oklch(0.985 0 0);                 /* Near-white */
  --card: oklch(0.205 0 0);                       /* Dark */
  --card-foreground: oklch(0.985 0 0);            /* Light */
  --popover: oklch(0.205 0 0);                    /* Dark */
  --popover-foreground: oklch(0.985 0 0);         /* Light */
  --border: oklch(1 0 0 / 10%);                   /* White with alpha */
  --input: oklch(1 0 0 / 15%);                    /* White with alpha */
  --ring: oklch(0.556 0 0);                       /* Medium gray */
  --chart-1: oklch(0.488 0.243 264.376);          /* Purple */
  --chart-2: oklch(0.696 0.17 162.48);            /* Teal */
  --chart-3: oklch(0.769 0.188 70.08);            /* Yellow */
  --chart-4: oklch(0.627 0.265 303.9);            /* Pink */
  --chart-5: oklch(0.645 0.246 16.439);           /* Red */
  
  /* Sidebar tokens for dark */
  --sidebar: oklch(0.205 0 0);                    /* Dark */
  --sidebar-foreground: oklch(0.985 0 0);         /* Light text */
  --sidebar-primary: oklch(0.488 0.243 264.376);  /* Purple */
  --sidebar-primary-foreground: oklch(0.985 0 0); /* Light text */
  --sidebar-accent: oklch(0.269 0 0);             /* Dark accent */
  --sidebar-accent-foreground: oklch(0.985 0 0);  /* Light text */
  --sidebar-border: oklch(1 0 0 / 10%);           /* White with alpha */
  --sidebar-ring: oklch(0.556 0 0);               /* Medium gray */
}
```

### Key CSS Details

**Typography:**
```css
font-family: Inter, system-ui, sans-serif;
--font-inter: Inter, system-ui, sans-serif;
```

**Border Radius:**
```css
--radius: 0.625rem;
--radius-sm: calc(var(--radius) * 0.5);
--radius-md: calc(var(--radius) * 1);
--radius-lg: calc(var(--radius) * 1.5);
--radius-xl: calc(var(--radius) * 2);
```

**Animations:**
- Logo carousel: 30-second linear infinite scroll with hover pause
- Smooth page scrolling enabled

---

## 2. Dark/Light Mode Implementation

### Mechanism: Class-Based + System Detection

**Approach:**
- NOT using next-themes library
- Custom `ThemeProvider` component wrapping React Context API
- Dark mode class (`.dark`) applied to `document.documentElement`

**Implementation Details:**

#### ThemeProvider Component (`theme-provider.tsx`)
```typescript
// Simplified pseudocode structure:
export function ThemeProvider({ 
  children, 
  defaultTheme = "system", 
  storageKey = "vite-ui-theme" 
}) {
  const [theme, setTheme] = useState(() => {
    // Read from localStorage or use default
    return localStorage.getItem(storageKey) || defaultTheme
  })

  useEffect(() => {
    const root = window.document.documentElement
    
    if (theme === "system") {
      // Detect system preference
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      root.classList.toggle("dark", isDark)
    } else {
      root.classList.toggle("dark", theme === "dark")
    }
    
    // Persist choice
    localStorage.setItem(storageKey, theme)
  }, [theme, storageKey])

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}
```

### System Detection
- Uses `window.matchMedia("(prefers-color-scheme: dark)")`
- No polling; event listener updates when system preference changes
- Fallback to explicit theme choice if user has set preference

### Storage Persistence
- Default key: `"vite-ui-theme"`
- Customizable via `storageKey` prop
- Persists across browser sessions

---

## 3. CSS Variable Naming Convention

### Standard Shadcn UI Pattern

**Core Color Tokens:**
```
--primary / --primary-foreground        # Main brand color
--secondary / --secondary-foreground    # Secondary brand
--accent / --accent-foreground          # Accent highlights
--muted / --muted-foreground            # Disabled/placeholder state
--destructive                           # Error/danger indicator
```

**UI Components:**
```
--background                            # Page background
--foreground                            # Primary text
--card / --card-foreground              # Card component styling
--popover / --popover-foreground        # Popover/tooltip styling
--border                                # Border colors
--input                                 # Input field styling
--ring                                  # Focus ring (keyboard nav)
```

**Feature-Specific:**
```
--sidebar / --sidebar-*                 # Sidebar component variants
--chart-1 through --chart-5             # Data visualization colors
```

### Naming Strategy
- **Foreground pairs:** Every background color has a paired foreground for text contrast
- **No vendor prefixes:** Raw CSS variables (not scoped to Tailwind)
- **Flat hierarchy:** No nesting (e.g., `--primary-hover` not used; hover via Tailwind)
- **Consistent suffix:** `-foreground` used universally for text colors

---

## 4. Color Format: OKLch (Not HSL)

### Why OKLch?
- **Perceptually uniform:** Changes in L/C correspond to visual changes
- **Superior contrast:** Easier to achieve accessible color pairs
- **Better saturation handling:** More natural color transitions
- **Modern standard:** CSS Color Module Level 4 compatible

### OKLch Syntax
```
oklch(L C H)
  L = Lightness   (0 to 1, where 0 = black, 1 = white)
  C = Chroma      (0+, roughly 0–0.4 for typical colors)
  H = Hue         (0–360deg, color angle on color wheel)

Example: oklch(0.205 0 0)     = Nearly black (no chroma, no hue)
         oklch(0.97 0 0)      = Nearly white
         oklch(0.577 0.245 27.325) = Orange-red
```

### With Alpha Channel
```css
oklch(1 0 0 / 10%)    /* White at 10% opacity */
oklch(1 0 0 / 0.15)   /* White at 15% opacity */
```

### Comparison: HSL vs OKLch
| Aspect | HSL | OKLch |
|--------|-----|-------|
| Lightness Perception | Non-uniform | Perceptually uniform |
| Saturation Handling | Relative | Absolute chroma |
| Accessibility | Harder to predict | Predictable contrast |
| Modern Support | Widely supported | CSS Color 4 (modern browsers) |

---

## 5. Tailwind Configuration & CSS Variable Mapping

### File: `vite-version/tailwind.config.ts` (or `.js`)

**Key Configuration:**
```typescript
// Theme colors automatically map to CSS variables
theme: {
  extend: {
    colors: {
      primary: "hsl(var(--primary) / <alpha-value>)",
      "primary-foreground": "hsl(var(--primary-foreground) / <alpha-value>)",
      secondary: "hsl(var(--secondary) / <alpha-value>)",
      // ... all other tokens
      sidebar: "hsl(var(--sidebar) / <alpha-value>)",
      "chart-1": "hsl(var(--chart-1) / <alpha-value>)",
    },
    borderRadius: {
      DEFAULT: "hsl(var(--radius) / 1)",
      sm: "hsl(var(--radius-sm) / 1)",
      md: "hsl(var(--radius-md) / 1)",
      lg: "hsl(var(--radius-lg) / 1)",
      xl: "hsl(var(--radius-xl) / 1)",
    },
  }
}
```

### components.json Settings
```json
{
  "style": "new-york",
  "tailwind": {
    "baseColor": "neutral",
    "cssVariables": true,
    "config": "tailwind.config.ts"
  },
  "aliases": {
    "@/components": "components",
    "@/lib/utils": "lib/utils.ts",
    "@/lib": "lib",
    "@/hooks": "hooks"
  }
}
```

### CSS Variable Mapping in Tailwind
- **All color tokens map directly** via `hsl(var(--token))`
- **Alpha channel support:** `<alpha-value>` allows `opacity-50` modifiers
- **No custom prefix:** Uses default Tailwind naming
- **Responsive modifiers:** Full Tailwind syntax supported

---

## 6. ThemeProvider Setup

### App Entry Point Integration

#### Vite Version (`src/main.tsx`)
```typescript
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <App />
    </ThemeProvider>
  </StrictMode>,
)
```

#### App Component (`src/App.tsx`)
```typescript
export function App() {
  useEffect(() => {
    // GTM initialization
    gtag.pageview(...)
  }, [])

  return (
    <Sidebar>
      <Router basename={import.meta.env.VITE_BASENAME || ""}>
        <Routes>
          {/* Routes */}
        </Routes>
      </Router>
    </Sidebar>
  )
}
```

### Context Consumption

**useTheme hook:**
```typescript
export function useTheme() {
  const context = React.useContext(ThemeProviderContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
```

**Usage in components:**
```typescript
function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      {theme === "dark" ? <Moon /> : <Sun />}
    </button>
  )
}
```

---

## 7. Theme Customizer & Color Switcher

### ThemeCustomizer Component Architecture

**Location:** `vite-version/src/components/theme-customizer/`

**Structure:**
```
theme-customizer/
├── index.tsx                      # Main component export
├── main.tsx                        # Barrel export
├── theme-tab.tsx                  # Color/radius customization
├── layout-tab.tsx                 # Sidebar options
├── import-modal.tsx               # Import custom themes
├── circular-transition.css        # Transition animations
```

### Features & UI Structure

#### Main Customizer Component
- **Trigger:** Floating button with settings icon
- **Container:** Sheet component (slide-out panel)
- **Tabs:** "Theme" and "Layout" sections

#### Theme Tab Content
1. **Preset Themes:** Grid of shadcn + tweakcn presets with color swatches
2. **Radius Selector:** 5 options (0, 0.3rem, 0.5rem, 0.75rem, 1rem)
3. **Mode Toggle:** Light/Dark mode buttons with Sun/Moon icons
4. **Color Picker:** Accordion-collapsed color picker for brand colors
5. **Import Button:** Triggers import modal for custom CSS themes

#### Layout Tab Content
1. **Sidebar Variants:** 3 preset layouts
   - Standard sidebar
   - Floating with border
   - Inset with rounded corners
2. **Sidebar Collapsibility:** 3 modes
   - Slides out of view
   - Collapses to icon only
   - Always visible
3. **Sidebar Position:** Left or Right

### useThemeManager Hook

**Location:** `vite-version/src/hooks/use-theme-manager.ts` (5,468 bytes)

**Key Methods:**

```typescript
export function useThemeManager() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [brandColorsValues, setBrandColorsValues] = useState({})

  // Apply preset theme from colorThemes array
  const applyTheme = (themeName: string) => {
    const theme = colorThemes.find(t => t.name === themeName)
    const variant = isDarkMode ? theme.preset.dark : theme.preset.light
    
    // Apply CSS variables to document root
    Object.entries(variant.cssVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value)
    })
  }

  // Apply custom tweakcn theme preset
  const applyTweakcnTheme = (preset: ThemePreset) => {
    const variant = isDarkMode ? preset.dark : preset.light
    // Same as above
  }

  // Apply imported theme from CSS text
  const applyImportedTheme = (lightVars: object, darkVars: object) => {
    const variant = isDarkMode ? darkVars : lightVars
    // Apply to document root
  }

  // Handle color picker changes
  const handleColorChange = (colorName: string, value: string) => {
    document.documentElement.style.setProperty(`--${colorName}`, value)
    setBrandColorsValues(prev => ({ ...prev, [colorName]: value }))
  }

  // Apply border radius
  const applyRadius = (radius: string) => {
    document.documentElement.style.setProperty('--radius', radius)
  }

  // Reset all custom CSS variables
  const resetTheme = () => {
    // Remove all --* properties from document root
    Array.from(document.documentElement.style).forEach(prop => {
      if (prop.startsWith('--')) {
        document.documentElement.style.removeProperty(prop)
      }
    })
  }

  return {
    isDarkMode,
    applyTheme,
    applyTweakcnTheme,
    applyImportedTheme,
    handleColorChange,
    applyRadius,
    resetTheme,
    brandColorsValues,
  }
}
```

### Import Modal Implementation

**Expects CSS format:**
```css
:root {
  --primary: oklch(0.205 0 0);
  --secondary: oklch(0.97 0 0);
  /* ... more variables */
}

.dark {
  --primary: oklch(0.922 0 0);
  --secondary: oklch(0.269 0 0);
  /* ... more variables */
}
```

**Processing:**
1. Parse CSS text with regex: `/--(\w+):\s*([^;]+);/g`
2. Extract variable names and values
3. Separate into `:root` (light) and `.dark` (dark) objects
4. Pass to `applyImportedTheme()`

---

## 8. Index.css Structure & Layout

### Complete File Organization

**Imports:**
```css
@import "tailwindcss";
@import "tw-animate-css";
```

**Custom Directives:**
```css
@custom-variant dark (&:is(.dark *));
```

**Root Selector (Light Mode):**
- All 30+ CSS variables defined
- Typography: `font-family: Inter, system-ui, sans-serif`
- Scroll behavior: `scroll-behavior: smooth`

**Dark Selector:**
- Inverted color values
- Updated saturation for chart colors
- Alpha channels for borders/inputs

**Additional Styles:**
- Base typography rules
- Sidebar height corrections
- Right-side inset adjustments
- Font smoothing: `-webkit-font-smoothing: antialiased`

**Animations:**
```css
@keyframes logo-carousel {
  0% { transform: translateX(0); }
  100% { transform: translateX(-100%); }
}

.logo-carousel {
  animation: logo-carousel 30s linear infinite;
}

.logo-carousel:hover {
  animation-play-state: paused;
}
```

---

## 9. Tailwind v4 Setup (No @theme Directive)

### Current Implementation

**Does NOT use `@theme` directive** — maintains traditional approach:
- CSS variables defined in `:root` and `.dark`
- Tailwind config maps colors to CSS variables
- No `@layer theme` blocks

### Vite Config
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': './src',
    },
  },
  define: {
    'import.meta.env.VITE_BASENAME': JSON.stringify(
      process.env.VITE_BASENAME || ''
    ),
  },
})
```

### Tsconfig Setup
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

---

## 10. Component Implementation Examples

### Button Component with Theme Variables

**Basic shadcn button usage:**
```typescript
import { Button } from "@/components/ui/button"

export function ButtonDemo() {
  return (
    <>
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="outline">Outline</Button>
    </>
  )
}
```

**Compiled CSS** (via Tailwind):
```css
.btn-primary {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-radius: hsl(var(--radius));
}

/* Dark mode automatic */
.dark .btn-primary {
  background-color: hsl(var(--primary));        /* oklch(0.922 0 0) */
  color: hsl(var(--primary-foreground));        /* oklch(0.205 0 0) */
}
```

### Custom Component Using cn() Utility

```typescript
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-6 text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  )
}
```

**cn() Function:**
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Theme-Aware Sidebar Component

```typescript
export function Sidebar() {
  const { isDarkMode } = useThemeManager()

  return (
    <aside className={cn(
      "bg-sidebar text-sidebar-foreground",
      "border-r border-sidebar-border",
      "transition-colors duration-200"
    )}>
      {/* Content */}
    </aside>
  )
}
```

**Rendered CSS:**
```css
.dark aside {
  background-color: hsl(var(--sidebar));          /* oklch(0.205 0 0) */
  color: hsl(var(--sidebar-foreground));          /* oklch(0.985 0 0) */
  border-color: hsl(var(--sidebar-border));       /* oklch(1 0 0 / 10%) */
}
```

---

## 11. Theme Data & Configuration Files

### theme-data.ts
```typescript
import { tweakcnPresets } from "tweakcn"
import { shadcnPresets } from "shadcn-ui"

export const colorThemes = [
  ...Object.entries(tweakcnPresets).map(([key, preset]) => ({
    name: preset.label || key,
    value: key,
    preset: preset,
  })),
  ...Object.entries(shadcnPresets).map(([key, preset]) => ({
    name: preset.label || key,
    value: key,
    preset: preset,
  })),
]
```

**Preset Structure:**
```typescript
interface ThemePreset {
  name: string
  label?: string
  light: {
    cssVars: {
      primary: string
      secondary: string
      accent: string
      destructive: string
      // ... all 30+ tokens
    }
  }
  dark: {
    cssVars: { /* same structure */ }
  }
}
```

### theme-customizer-constants.ts
```typescript
export const RADIUS_OPTIONS = [
  { label: "0px", value: "0" },
  { label: "0.3rem", value: "0.3rem" },
  { label: "0.5rem", value: "0.5rem" },
  { label: "0.75rem", value: "0.75rem" },
  { label: "1rem", value: "1rem" },
]

export const SIDEBAR_VARIANTS = [
  { label: "Standard", value: "default" },
  { label: "Floating", value: "floating" },
  { label: "Inset", value: "inset" },
]

export const COLOR_TOKENS = [
  "primary",
  "secondary",
  "accent",
  "destructive",
  "muted",
  "background",
  "card",
  "popover",
]
```

---

## 12. Package Dependencies for Theme System

**Key packages (from package.json):**
```json
{
  "dependencies": {
    "next-themes": "^0.4.6",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "tailwindcss": "^4.1.18",
    "@radix-ui/...": "latest",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "zustand": "^5.0.9",
    "zod": "^4.3.2"
  }
}
```

**Note:** Despite using Vite (not Next.js), the project includes `next-themes` but implements a custom ThemeProvider instead. This is likely for library compatibility or gradual migration planning.

---

## 13. Dark Mode Toggle Implementation

### Complete Flow

1. **User clicks theme button** → calls `setTheme()`
2. **ThemeProvider.setTheme()** updates state
3. **useEffect watches theme change** → applies to document root
4. **CSS class toggling:**
   ```typescript
   document.documentElement.classList.toggle("dark", isDark)
   ```
5. **CSS variables cascade** → all components update automatically
6. **localStorage persists** → choice survives refresh

### System Preference Integration
```typescript
const darkMediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

darkMediaQuery.addEventListener("change", (e) => {
  if (theme === "system") {
    // Re-apply system detection
    document.documentElement.classList.toggle("dark", e.matches)
  }
})
```

---

## 14. Sidebar-Specific Theme Variables

### Why Separate Tokens?

Sidebar often needs **different visual treatment** than main content:

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--sidebar` | `oklch(0.985 0 0)` (near-white) | `oklch(0.205 0 0)` (dark) | Sidebar background |
| `--sidebar-foreground` | `oklch(0.145 0 0)` (near-black) | `oklch(0.985 0 0)` (light) | Sidebar text |
| `--sidebar-primary` | `oklch(0.205 0 0)` | `oklch(0.488 0.243 264.376)` (purple) | Active nav item |
| `--sidebar-accent` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Hover state |

**Enables:** High contrast between sidebar and main content, custom hover states, smooth transitions on collapse.

---

## 15. Chart Color Tokens

### 5 Chart Colors for Data Visualization

```
--chart-1: oklch(0.646 0.222 41.116)    # Orange (light) → Purple (dark)
--chart-2: oklch(0.6 0.118 184.704)     # Cyan (light) → Teal (dark)
--chart-3: oklch(0.398 0.07 227.392)    # Dark blue (light) → Yellow (dark)
--chart-4: oklch(0.828 0.189 84.429)    # Yellow-green → Pink (dark)
--chart-5: oklch(0.769 0.188 70.08)     # Orange-yellow → Red (dark)
```

**Usage with Recharts:**
```typescript
import { BarChart, Bar, Cell } from "recharts"

export function ChartDemo() {
  return (
    <BarChart data={data}>
      <Bar dataKey="value1" fill={`hsl(var(--chart-1))`} />
      <Bar dataKey="value2" fill={`hsl(var(--chart-2))`} />
    </BarChart>
  )
}
```

---

## 16. File Size & Performance Notes

**CSS File Size:** index.css is modest (~2-3KB gzipped)
- Minimal animation overhead
- No duplicate selectors
- Efficient variable reuse

**Runtime Performance:**
- CSS variable updates are instant (no re-renders needed)
- localStorage reads happen once on app load
- No polling for system preference changes
- Zustand for state mgmt (minimal bundle overhead)

---

## Summary Table

| Aspect | Implementation |
|--------|-----------------|
| **Dark Mode** | Class-based (`.dark` on document root) |
| **Theme Library** | Custom (no next-themes) |
| **Color Space** | OKLch (perceptually uniform) |
| **Variable Naming** | Shadcn/ui standard (--primary, --card, etc.) |
| **Tailwind Version** | v4.1.18 (traditional config, no @theme) |
| **Persistence** | localStorage with "vite-ui-theme" key |
| **System Detection** | `window.matchMedia("(prefers-color-scheme: dark)")` |
| **Dynamic Updates** | CSS variable manipulation via `useThemeManager` |
| **Theme Customization** | Color picker + preset library (tweakcn + shadcn) |
| **Sidebar Variants** | 3 layouts × 3 collapsibility × 2 positions = 18 combos |
| **Chart Colors** | 5 tokens with light/dark variants |
| **Provider Pattern** | React Context (ThemeProviderContext) |

---

## Recommendations for ProjectOS Adoption

### ✅ What to Adopt
1. **OKLch color space** — superior to HSL for theme systems
2. **CSS variable naming convention** — consistent with industry standard
3. **useThemeManager hook pattern** — practical for dynamic customization
4. **Preset + import system** — empowers users without code changes

### ⚠️ What to Adapt
1. **Custom ThemeProvider** — ProjectOS may want next-themes for Next.js 16
2. **Sidebar tokens** — only if building sidebar-heavy app (ProjectOS has AppShell)
3. **Chart colors** — adopt if using Recharts (ProjectOS does)

### 🔄 Integration Steps
1. Copy `index.css` structure with ProjectOS's custom colors
2. Adopt `useThemeManager` hook pattern in `lib/firestore-rq` if dynamic theming needed
3. Map `tailwind.config.ts` colors to CSS variables
4. Consider lighter version of ThemeCustomizer (may not need full UI in ProjectOS)

---

## Unresolved Questions

1. **Why use next-themes in package.json if not using Next.js?** — Vite version might be preparing for Next.js migration or uses it as optional dependency.
2. **How are tweakcn presets imported?** — Repository doesn't expose tweakcn source; likely external npm package.
3. **Does Tailwind v4 use @theme directive?** — Vite version uses traditional config; Next.js version not examined.
4. **Performance impact of alpha channel CSS variables?** — `oklch(1 0 0 / 10%)` vs pre-computed values—not benchmarked.


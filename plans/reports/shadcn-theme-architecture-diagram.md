# Shadcn Dashboard Theme System — Architecture Diagrams

---

## 1. Data Flow: Theme Application

```
User Action (Toggle Dark/Light)
    ↓
useTheme() hook
    ↓
setTheme("dark" | "light" | "system")
    ↓
ThemeProvider.setTheme()
    ↓
Update React state
    ↓
useEffect watches theme change
    ↓
Apply to document.documentElement
    ├─ Remove existing classes
    ├─ Toggle .dark class
    └─ Persist to localStorage
    ↓
CSS cascade through :root and .dark selectors
    ↓
All CSS variables update simultaneously
    ↓
Tailwind utilities applied instantly
    ↓
All components reflect new theme
```

---

## 2. Component Hierarchy

```
App Root
│
├─ ThemeProvider
│  ├─ defaultTheme="system"
│  ├─ storageKey="vite-ui-theme"
│  └─ ThemeProviderContext
│     ├─ theme: string
│     └─ setTheme: (theme: string) => void
│
├─ [Child Components]
│  ├─ Button (uses bg-primary)
│  ├─ Card (uses bg-card)
│  ├─ Sidebar (uses bg-sidebar)
│  └─ Customizer
│     ├─ ThemeCustomizer (Sheet wrapper)
│     ├─ ThemeTab (colors + radius)
│     └─ LayoutTab (sidebar options)
│
└─ useTheme() hooks in descendants
   └─ Access theme state
```

---

## 3. CSS Variable Resolution Path

```
HTML Element
    ↓
Tailwind Class (e.g., bg-primary)
    ↓
Tailwind Config Mapping
    bg-primary → hsl(var(--primary) / <alpha-value>)
    ↓
CSS Variable Lookup
    var(--primary)
    ↓
:root or .dark selector
    ├─ If light mode → :root { --primary: oklch(0.205 0 0); }
    └─ If dark mode  → .dark { --primary: oklch(0.922 0 0); }
    ↓
Computed Color
    ├─ Light: rgb(52, 52, 52) [dark gray]
    └─ Dark:  rgb(235, 235, 235) [light gray]
    ↓
Rendered Element
```

---

## 4. Theme Manager Hook Lifecycle

```
Component mounts with useThemeManager()
    ↓
Initialize state
├─ isDarkMode (from system or saved preference)
├─ brandColorsValues (from applied theme)
└─ theme metadata
    ↓
    ├─ applyTheme(name)
    │  ├─ Find theme in colorThemes array
    │  ├─ Select dark or light variant
    │  ├─ Apply all CSS variables to document.documentElement.style
    │  └─ Extract brand colors into state
    │
    ├─ handleColorChange(colorName, value)
    │  ├─ Update single CSS variable
    │  ├─ document.documentElement.style.setProperty()
    │  └─ Update brandColorsValues state
    │
    ├─ applyRadius(value)
    │  ├─ Set --radius CSS variable
    │  └─ Cascades to --radius-sm, -md, -lg, -xl
    │
    └─ resetTheme()
       ├─ Iterate all --* properties
       ├─ Remove from document.documentElement.style
       └─ Clear state
```

---

## 5. Dark Mode Toggle Sequence

```
Timeline:

1. User clicks theme toggle
   ↓
2. setTheme("dark") called
   ↓
3. React state updates → re-render
   ↓
4. useEffect triggers
   ↓
5. Check theme value
   ├─ If "dark" → isDark = true
   ├─ If "light" → isDark = false
   └─ If "system" → isDark = matchMedia.matches
   ↓
6. DOM manipulation
   ├─ Get document.documentElement
   ├─ classList.remove("dark")
   ├─ classList.add("dark") [conditional]
   └─ All in one operation
   ↓
7. CSS cascade
   :root selectors no longer apply (overridden by .dark)
   .dark selectors now active
   ↓
8. All variables change
   --primary: oklch(0.205 0 0) → oklch(0.922 0 0)
   --background: oklch(1 0 0) → oklch(0.145 0 0)
   --sidebar: oklch(0.985 0 0) → oklch(0.205 0 0)
   (and 30+ more)
   ↓
9. Browser recalculates styles
   ↓
10. All components update (instant, no re-renders)
```

---

## 6. Theme Customizer UI Flow

```
ThemeCustomizer Component
│
├─ Sheet (expandable side panel)
│  │
│  ├─ Header
│  │  ├─ Title: "Customize"
│  │  ├─ Reset Button → calls resetTheme()
│  │  └─ Close Button → closes sheet
│  │
│  └─ Tabs
│     │
│     ├─ "Theme" Tab
│     │  │
│     │  ├─ Preset Themes
│     │  │  ├─ Grid of shadcn presets
│     │  │  │  └─ Each shows 4 color swatches
│     │  │  ├─ Grid of tweakcn presets
│     │  │  │  └─ Each shows 4 color swatches
│     │  │  └─ Random button → shuffle presets
│     │  │
│     │  ├─ Border Radius
│     │  │  └─ 5-column grid (0, 0.3rem, 0.5rem, 0.75rem, 1rem)
│     │  │     └─ Click → applyRadius(value)
│     │  │
│     │  ├─ Dark/Light Mode
│     │  │  ├─ Sun icon (light mode)
│     │  │  └─ Moon icon (dark mode)
│     │  │     └─ Click → re-applies theme with new variant
│     │  │
│     │  ├─ Color Picker (Expandable)
│     │  │  ├─ ColorPicker component
│     │  │  └─ For each token:
│     │  │     └─ handleColorChange(token, color)
│     │  │
│     │  └─ Import Button
│     │     └─ Opens ImportModal
│     │
│     └─ "Layout" Tab
│        │
│        ├─ Sidebar Variant
│        │  ├─ Standard
│        │  ├─ Floating
│        │  └─ Inset
│        │
│        ├─ Sidebar Collapsibility
│        │  ├─ Slides out
│        │  ├─ Collapses to icons
│        │  └─ Always visible
│        │
│        └─ Sidebar Position
│           ├─ Left
│           └─ Right
```

---

## 7. CSS Variable Inheritance & Cascade

```
document.documentElement
│
├─ Inline styles (setProperty)
│  │  Priority: HIGHEST
│  │
│  ├─ --primary: oklch(0.205 0 0)
│  ├─ --secondary: oklch(0.97 0 0)
│  ├─ --radius: 0.625rem
│  └─ ... (applied by useThemeManager)
│
└─ Stylesheet rules
   │
   ├─ :root { --primary: oklch(0.205 0 0); }
   │  Priority: Low (overridden by inline)
   │
   ├─ .dark { --primary: oklch(0.922 0 0); }
   │  Priority: Only active when .dark class present
   │
   └─ Cascade stops here (no further cascade)

Child elements inherit via `var(--primary)` lookup:
   ↓
   Button element
   ├─ class="bg-primary"
   ├─ Tailwind generates: { background-color: hsl(var(--primary) / 1) }
   ├─ var(--primary) resolves to computed value
   └─ Browser applies final color
```

---

## 8. Theme Preset Structure

```
ColorTheme (from colorThemes array)
│
├─ name: string (display name)
├─ value: string (identifier)
│
└─ preset: ThemePreset
   │
   ├─ light: {
   │  └─ cssVars: {
   │     ├─ primary: "oklch(...)"
   │     ├─ secondary: "oklch(...)"
   │     ├─ accent: "oklch(...)"
   │     ├─ destructive: "oklch(...)"
   │     ├─ muted: "oklch(...)"
   │     ├─ background: "oklch(...)"
   │     ├─ foreground: "oklch(...)"
   │     ├─ card: "oklch(...)"
   │     ├─ popover: "oklch(...)"
   │     ├─ border: "oklch(...)"
   │     ├─ input: "oklch(...)"
   │     ├─ ring: "oklch(...)"
   │     ├─ chart-1 through chart-5: "oklch(...)"
   │     └─ sidebar variants
   │  }
   │
   └─ dark: {
      └─ cssVars: { /* same structure, different values */ }
   }

When user selects theme:
   ↓
1. Find in colorThemes
2. Check isDarkMode
3. Get variant (light or dark)
4. Extract cssVars object
5. Apply to document.documentElement.style
```

---

## 9. System Preference Detection

```
window.matchMedia("(prefers-color-scheme: dark)")
│
├─ .matches: boolean (true if dark preferred)
│
├─ .addListener() [deprecated]
└─ .addEventListener("change", callback)
   │
   └─ Triggered when:
      ├─ User changes OS theme settings
      ├─ Time-based switching (sunset/sunrise)
      └─ App in background (system changes don't auto-apply)

ThemeProvider integration:
   ↓
   if (theme === "system") {
     const isDark = darkMediaQuery.matches
     document.documentElement.classList.toggle("dark", isDark)
   }
   ↓
   Respects system, but allows manual override
```

---

## 10. Storage & Persistence Flow

```
Application Lifecycle
│
├─ Page Load
│  ├─ ThemeProvider reads localStorage
│  │  └─ key: "vite-ui-theme" (configurable)
│  ├─ Falls back to defaultTheme prop if not found
│  └─ Applies theme to DOM
│
├─ User Changes Theme
│  ├─ setTheme() called
│  ├─ React state updates
│  ├─ useEffect executes
│  ├─ DOM updated (.dark class toggled)
│  └─ localStorage.setItem("vite-ui-theme", newTheme)
│
├─ Browser Closed
│  └─ Data persisted in storage
│
└─ Page Reopened
   ├─ ThemeProvider reads localStorage
   ├─ Previous theme restored
   └─ Matches user's last selection

Note: If browser storage disabled → falls back to defaultTheme each session
```

---

## 11. CSS Variable Update Methods

```
Method 1: Bulk Update (applyTheme)
   ↓
   const vars = { primary: "oklch(...)", secondary: "oklch(...)", ... }
   Object.entries(vars).forEach(([key, value]) => {
     document.documentElement.style.setProperty(`--${key}`, value)
   })

Method 2: Single Update (handleColorChange)
   ↓
   document.documentElement.style.setProperty("--primary", "oklch(0.5 0.2 240)")

Method 3: Reset (remove all)
   ↓
   Array.from(document.documentElement.style).forEach(prop => {
     if (prop.startsWith("--")) {
       document.documentElement.style.removeProperty(prop)
     }
   })

Performance: All instant, no re-renders needed
```

---

## 12. Component Integration Pattern

```
Shadcn UI Button Component
│
├─ TypeScript Definition
│  └─ interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}
│
├─ Component Implementation
│  └─ function Button({ className, ...props }: ButtonProps)
│     └─ return <button className={cn("...", className)} {...props} />
│
├─ Class String (Tailwind + shadcn)
│  └─ "inline-flex items-center justify-center whitespace-nowrap 
│      rounded-md bg-primary text-primary-foreground ... [variant specific]"
│
└─ Tailwind Processing
   │
   ├─ bg-primary → hsl(var(--primary) / 1)
   ├─ text-primary-foreground → hsl(var(--primary-foreground) / 1)
   └─ rounded-md → border-radius: hsl(var(--radius-md) / 1)
      └─ calc(var(--radius) * 1)
   │
   └─ At runtime:
      var(--primary) resolves based on .dark class
      ├─ Light: oklch(0.205 0 0)
      └─ Dark:  oklch(0.922 0 0)
```

---

## 13. Custom Theme Import Flow

```
User Action: Click Import Button
   ↓
ImportModal Opens
│
├─ User pastes CSS:
│  ├─ :root { --primary: oklch(...); ... }
│  └─ .dark { --primary: oklch(...); ... }
│
└─ User clicks "Import"
   ↓
Modal processing
├─ Regex parse: /--(\w+):\s*([^;]+);/g
├─ Extract variable names and values
├─ Separate into light and dark objects
│  ├─ lightVars: { primary: "oklch(...)", ... }
│  └─ darkVars: { primary: "oklch(...)", ... }
│
└─ Pass to ThemeCustomizer
   ↓
ThemeCustomizer.handleImport(lightVars, darkVars)
   ↓
useThemeManager.applyImportedTheme(lightVars, darkVars)
   ↓
Select variant based on isDarkMode
│
├─ If dark: apply darkVars
└─ If light: apply lightVars
   ↓
Apply all variables to document.documentElement.style
   ↓
Instant theme update (no re-render needed)
```

---

## 14. Responsive Behavior

```
Theme System (Non-Responsive)
│
└─ CSS Variables applied globally
   ├─ No media queries needed
   ├─ No container queries
   └─ Works at all breakpoints

However: ThemeCustomizer UI IS responsive
   ├─ Sheet component adapts to screen size
   ├─ Grid layouts adjust columns
   └─ Touch-friendly on mobile

Color token values remain constant across breakpoints
   └─ No media-query color changes
```

---

## 15. File Organization (Dependency Graph)

```
index.css
│ ├─ Imports: @import "tailwindcss"
│ ├─ Defines: 30+ CSS variables
│ └─ Selectors: :root and .dark
│
tailwind.config.ts
│ ├─ Imports: colors from CSS variables
│ └─ Maps: bg-primary → hsl(var(--primary))
│
use-theme-provider.tsx
│ ├─ Imports: React, useEffect, useState
│ ├─ Defines: ThemeProviderContext
│ └─ Exports: ThemeProvider component
│
use-theme.ts
│ ├─ Imports: useContext, ThemeProviderContext
│ └─ Exports: useTheme hook
│
use-theme-manager.ts
│ ├─ Imports: useState, useTheme
│ ├─ Depends on: colorThemes (from theme-data.ts)
│ └─ Exports: useThemeManager hook
│
theme-data.ts
│ ├─ Imports: tweakcnPresets, shadcnPresets
│ └─ Exports: colorThemes array
│
theme-customizer/index.tsx
│ ├─ Imports: useThemeManager, useTheme
│ ├─ Imports: ThemeTab, LayoutTab, ImportModal
│ └─ Exports: ThemeCustomizer component
│
theme-customizer/theme-tab.tsx
│ ├─ Imports: useThemeManager
│ ├─ Uses: colorThemes, COLOR_TOKENS
│ └─ Calls: applyTheme, applyRadius, handleColorChange
│
theme-customizer/import-modal.tsx
│ ├─ Imports: Dialog, Textarea
│ ├─ Parses: CSS text with regex
│ └─ Calls: applyImportedTheme callback
```

---

## Summary

| Layer | Technology | Responsibility |
|-------|-----------|-----------------|
| **CSS Variables** | Native CSS | Store color tokens in :root and .dark |
| **React Context** | React API | Manage theme state and persistence |
| **Tailwind Config** | Tailwind CSS | Map variables to utility classes |
| **Hooks** | React Hooks | Provide theme access and management |
| **Components** | React + shadcn/ui | Consume theme via utilities |
| **Storage** | localStorage API | Persist user preference |
| **Detection** | matchMedia API | Detect system preference |

**Result:** Unified, performant, accessible theme system with zero external dependencies for theme management.


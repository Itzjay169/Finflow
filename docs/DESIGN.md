# FinFlow Design System & Style Guide

Synthesized from Stitch fintech concepts, contemporary high-end financial dashboards, and modern glassmorphic aesthetics.

---

## 1. Visual Identity & Brand Philosophy
FinFlow brings high-velocity, modern financial intelligence to personal expense and income tracking.
- **Tone**: Crisp, vibrant, intelligent, trustworthy, and modern.
- **Core Aesthetic**: Multi-layered glassmorphism (`backdrop-filter: blur(16px)`), luminous chromatic edge highlights, deep spatial dark mode, crisp frosted light mode, and fluid micro-interactions.
- **Indian Financial Standard**: Full currency formatting support for Indian Rupee (`₹1,23,456.00`).

---

## 2. Color Palette & Semantic Tokens

### Primary & Brand Accents
- **Electric Indigo (Primary)**: `#6366F1` / Hover `#4F46E5` / Glow `rgba(99, 102, 241, 0.35)`
- **Violet Accent (Secondary)**: `#8B5CF6` / Gradient Stop `#A855F7`
- **Cyan / Teal (Tertiary)**: `#06B6D4` / `#14B8A6` (Telemetry & Charts)

### Financial Semantics
- **Income (Growth / Positive)**:
  - Base: `#10B981` (Emerald-500)
  - Light Fill: `rgba(16, 185, 129, 0.12)`
  - Glow: `rgba(16, 185, 129, 0.25)`
  - Text Light: `#059669` / Text Dark: `#34D399`
- **Expense (Outflow / Alert)**:
  - Base: `#F43F5E` (Rose-500) / `#EF4444` (Red-500)
  - Light Fill: `rgba(244, 63, 94, 0.12)`
  - Glow: `rgba(244, 63, 94, 0.25)`
  - Text Light: `#E11D48` / Text Dark: `#FB7185`
- **Net Savings / Neutral Warning**:
  - Warning / Caution: `#F59E0B` (Amber-500)
  - Info / Secondary: `#3B82F6` (Blue-500)

### Dark Theme Tokens (Default)
- **Background Canvas**: `#0B0F19` (Deep Charcoal Navy)
- **Card / Surface (Level 1)**: `rgba(17, 24, 39, 0.75)` with `backdrop-filter: blur(16px)`
- **Elevated Surface (Level 2)**: `rgba(31, 41, 55, 0.85)`
- **Card Border / Hairline Stroke**: `rgba(255, 255, 255, 0.08)`
- **Hover Border**: `rgba(99, 102, 241, 0.35)`
- **Text Primary**: `#F8FAFC` (Slate-50)
- **Text Secondary**: `#94A3B8` (Slate-400)
- **Text Muted**: `#64748B` (Slate-500)
- **Input Background**: `rgba(15, 23, 42, 0.6)`

### Light Theme Tokens
- **Background Canvas**: `#F8FAFC` (Slate-50)
- **Card / Surface (Level 1)**: `rgba(255, 255, 255, 0.85)` with `backdrop-filter: blur(16px)`
- **Elevated Surface (Level 2)**: `#FFFFFF`
- **Card Border / Hairline Stroke**: `rgba(15, 23, 42, 0.08)`
- **Hover Border**: `rgba(99, 102, 241, 0.35)`
- **Text Primary**: `#0F172A` (Slate-900)
- **Text Secondary**: `#475569` (Slate-600)
- **Text Muted**: `#94A3B8` (Slate-400)
- **Input Background**: `rgba(255, 255, 255, 0.9)`

---

## 3. Typography
- **Primary Font**: `Plus Jakarta Sans`, sans-serif (Headers, Body, Controls, Badges)
- **Numerical / Financial Telemetry**: `JetBrains Mono` or `Plus Jakarta Sans` with `tabular-nums`
- **Weights**:
  - Regular (`400`): Body, descriptions, subtext
  - Medium (`500`): Table content, form inputs, secondary buttons
  - SemiBold (`600`): Card titles, nav items, KPI labels, buttons
  - Bold (`700`): KPI numbers, section headers
  - ExtraBold (`800`): Hero headline, primary stats

---

## 4. Elevation, Radius & Micro-interactions
- **Border Radii**:
  - Buttons & Inputs: `rounded-xl` (`0.75rem` / 12px)
  - Cards & Modals: `rounded-2xl` (`1rem` / 16px)
  - Pills & Badges: `rounded-full` (`9999px`)
- **Card Glow & Lift**:
  - Default: `transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1)`
  - Hover: `transform: translateY(-2px)`, `box-shadow: 0 12px 30px -10px rgba(99, 102, 241, 0.2)`
- **Framer Motion Standards**:
  - Page Transitions: `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}`
  - Staggered Cards: Container `staggerChildren: 0.06`
  - Reduced Motion: Honor `prefers-reduced-motion` with `useReducedMotion()`.

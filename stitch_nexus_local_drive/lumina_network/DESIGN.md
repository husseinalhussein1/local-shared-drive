---
name: Lumina Network
colors:
  surface: '#0f131d'
  surface-dim: '#0f131d'
  surface-bright: '#353944'
  surface-container-lowest: '#0a0e18'
  surface-container-low: '#171b26'
  surface-container: '#1c1f2a'
  surface-container-high: '#262a35'
  surface-container-highest: '#313540'
  on-surface: '#dfe2f1'
  on-surface-variant: '#bbc9cf'
  inverse-surface: '#dfe2f1'
  inverse-on-surface: '#2c303b'
  outline: '#859399'
  outline-variant: '#3c494e'
  surface-tint: '#4cd6ff'
  primary: '#a4e6ff'
  on-primary: '#003543'
  primary-container: '#00d1ff'
  on-primary-container: '#00566a'
  inverse-primary: '#00677f'
  secondary: '#b7c8e1'
  on-secondary: '#213145'
  secondary-container: '#3a4a5f'
  on-secondary-container: '#a9bad3'
  tertiary: '#ffd59c'
  on-tertiary: '#442b00'
  tertiary-container: '#feb127'
  on-tertiary-container: '#6b4700'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#b7eaff'
  primary-fixed-dim: '#4cd6ff'
  on-primary-fixed: '#001f28'
  on-primary-fixed-variant: '#004e60'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffddb1'
  tertiary-fixed-dim: '#ffba49'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#624000'
  background: '#0f131d'
  on-background: '#dfe2f1'
  surface-variant: '#313540'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  headline-md-mobile:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.3'
  body-base:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-mono:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  container-max: 1440px
  gutter: 20px
---

## Brand & Style

The design system is engineered for a high-performance, local network environment, specifically tailored for academic and professional presentation contexts. The brand personality is technical, precise, and sophisticated, evoking the feeling of a cutting-edge laboratory or a high-end data center. 

The aesthetic leverages **Modern Minimalism** fused with refined **Glassmorphism**. By utilizing deep, atmospheric backgrounds and translucent surface layers, the interface achieves a sense of spatial depth that organizes complex file structures without visual clutter. The goal is to provide a "quiet" interface that recedes when not in use but feels responsive and powerful during active file management.

## Colors

The palette is anchored by a deep slate base to minimize eye strain and maximize the "pop" of digital content.

- **Primary (#00D1FF):** An electric cyan used exclusively for interactive states, progress indicators, and primary actions. It represents the "data flow" within the local network.
- **Surface:** Surfaces use varying levels of white-point transparency over the base navy. Background blurs (20px - 40px) are required to maintain legibility and depth.
- **Neutral:** A range of slates and grays provide hierarchical support for metadata and secondary labels.

## Typography

This design system utilizes **Geist** for its exceptional clarity and technical "developer-focused" aesthetic. The typography relies on generous line-heights and tight letter-spacing for headlines to maintain a premium feel. 

For data-heavy views (like file sizes or IP addresses), use the mono-spaced alternates provided within the Geist family to ensure numerical alignment. Labels should be set in uppercase with slight tracking to differentiate them from interactive body text.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a maximum container width for desktop viewing. A 12-column system is used for dashboard layouts, while file explorers should utilize a flexible CSS Grid for "Auto-fit" card layouts.

- **Desktop:** 12 columns, 24px gutters, 48px side margins.
- **Tablet:** 8 columns, 20px gutters, 24px side margins.
- **Mobile:** 4 columns, 16px gutters, 16px side margins.

Horizontal rhythm is strictly maintained using a 4px baseline grid, ensuring that all icons, text blocks, and glass surfaces align to a common technical grid.

## Elevation & Depth

Hierarchy is defined through **Tonal Stacking** and **Backdrop Blurs** rather than traditional drop shadows.

1.  **Level 0 (Base):** The #0B0F19 background.
2.  **Level 1 (Cards/Sidebar):** `rgba(255, 255, 255, 0.03)` with a 24px backdrop-blur and a 1px solid border of `rgba(255, 255, 255, 0.08)`.
3.  **Level 2 (Modals/Popovers):** `rgba(255, 255, 255, 0.06)` with a 40px backdrop-blur and a subtle `0 20px 40px rgba(0, 0, 0, 0.4)` shadow to separate from the main interface.

Hover states on interactive items should increase the border opacity and apply a very faint primary color glow (`rgba(0, 209, 255, 0.15)`).

## Shapes

The design system uses a **Rounded** shape language to soften the technical nature of the interface. This creates a more approachable, high-end "consumer-tech" feel rather than a stark industrial one.

- **Default (0.5rem):** Standard buttons, input fields, and file icons.
- **Large (1rem):** Main content containers, cards, and sidebar backgrounds.
- **Pill:** Status badges, user labels, and toggle switches.

## Components

### Buttons & Inputs
Buttons feature a solid primary background for high-priority actions. Secondary buttons should use the glassmorphic style with a white border. Inputs are semi-transparent with a 1px bottom border that glows primary cyan on focus.

### File Explorer Grid
File items are minimalist cards. Icons should be monochrome (white/gray) until hovered, at which point the primary accent color is introduced. Metadata (size, date) is shown in `body-sm` with 60% opacity.

### Tables
Professional tables utilize "zebra-striping" with very low opacity (`0.02`) instead of lines. Headers are set in `label-mono`. Row hover states should trigger a subtle brightness increase across the entire row.

### User Labels (Badges)
Badge-style labels use a pill-shaped container. For the "presentation" feel, include a small online/offline status dot next to usernames using a pulse animation for active users.

### Navigation
The sidebar should feel integrated into the background. Use "Active Indicators"—a 2px vertical line in primary cyan—to denote the current directory or view.
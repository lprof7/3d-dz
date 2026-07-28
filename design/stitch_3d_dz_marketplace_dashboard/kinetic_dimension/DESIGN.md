---
name: Kinetic Dimension
colors:
  surface: '#111318'
  surface-dim: '#111318'
  surface-bright: '#37393f'
  surface-container-lowest: '#0c0e13'
  surface-container-low: '#1a1b21'
  surface-container: '#1e1f25'
  surface-container-high: '#282a2f'
  surface-container-highest: '#33353a'
  on-surface: '#e2e2e9'
  on-surface-variant: '#e1bfb6'
  inverse-surface: '#e2e2e9'
  inverse-on-surface: '#2e3036'
  outline: '#a98a81'
  outline-variant: '#59413a'
  surface-tint: '#ffb59f'
  primary: '#ffb59f'
  on-primary: '#5f1500'
  primary-container: '#ff6a3d'
  on-primary-container: '#611600'
  inverse-primary: '#ae3104'
  secondary: '#5de6ff'
  on-secondary: '#00363e'
  secondary-container: '#00cbe6'
  on-secondary-container: '#00515d'
  tertiary: '#c0c6da'
  on-tertiary: '#2a3040'
  tertiary-container: '#9399ac'
  on-tertiary-container: '#2b3141'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbd1'
  primary-fixed-dim: '#ffb59f'
  on-primary-fixed: '#3b0a00'
  on-primary-fixed-variant: '#862200'
  secondary-fixed: '#a2eeff'
  secondary-fixed-dim: '#2fd9f4'
  on-secondary-fixed: '#001f25'
  on-secondary-fixed-variant: '#004e5a'
  tertiary-fixed: '#dce2f7'
  tertiary-fixed-dim: '#c0c6da'
  on-tertiary-fixed: '#151b2a'
  on-tertiary-fixed-variant: '#404757'
  background: '#111318'
  on-background: '#e2e2e9'
  surface-variant: '#33353a'
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Sora
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Sora
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  tech-label:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  price-display:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style
The design system is engineered for a premium, high-energy marketplace catering to 3D printing enthusiasts and digital creators. The brand personality is **innovative, technical, and high-performance**, evoking the excitement of manufacturing the future from a desktop.

The visual style blends **Futuristic Glassmorphism** with **High-Contrast Tech** elements. It utilizes deep layering, translucent surfaces, and vibrant "energy" accents to mimic a high-end software interface or a digital fabrication HUD. The UI should feel like a physical toolset—tactile yet ethereal—achieved through the strategic use of blurred glass, glowing outlines, and 3D depth cues.

## Colors
The palette is rooted in a "Deep Space" charcoal base, providing a high-contrast foundation for vibrant, filament-inspired accents.

- **Core Background:** A near-black charcoal (#0D0F14) that recedes, allowing 3D models to pop.
- **Primary (Filament Orange):** Used exclusively for high-priority calls to action, purchase buttons, and active states. It represents the heat and energy of the printing process.
- **Secondary (Electric Cyan):** Used for technical data, secondary actions, and progress indicators. It provides a "cool" digital counterpoint to the orange.
- **Glass Surfaces:** Semi-transparent versions of the surface color (#1A1D27 at 60-80% opacity) with a 1px inner border to simulate the edge of a glass pane.

## Typography
The system uses **Sora** for all primary interface elements to maintain a modern, geometric, and friendly tech aesthetic. Its wide apertures and distinct character shapes ensure legibility even in dark modes.

To reinforce the "maker" and "technical" nature of the platform, **JetBrains Mono** is utilized for functional data points—such as file sizes, print times, prices, and coordinate data. This monospaced contrast signals precision and engineering.

Headlines should use tight letter-spacing and heavy weights to command attention, while body text maintains generous line-height for readability against dark backgrounds.

## Layout & Spacing
The layout follows a **Fluid Grid** system designed to showcase dense galleries of 3D assets. A 12-column grid is used for desktop, collapsing to 4 columns on mobile.

- **Component Padding:** Elements like cards and modals use a generous 24px internal padding to maintain the "premium" feel.
- **Sectioning:** Large vertical gaps (stack-lg) are used between hero sections and content grids to prevent the dark UI from feeling cramped.
- **Pedestal Alignment:** Product cards are centered within their grid cells with extra bottom padding to accommodate the 3D "pedestal" shadow effect, ensuring the visual weight is balanced.

## Elevation & Depth
Depth is the cornerstone of this design system, achieved through **Layered Glassmorphism** and **Luminous Borders**.

1.  **Level 0 (Base):** The #0D0F14 background.
2.  **Level 1 (Cards/Panels):** #1A1D27 with a 1px stroke (#FFFFFF10). On hover, this stroke transitions to a subtle glow using the Primary or Secondary accent color.
3.  **Level 2 (Modals/Popovers):** Glassmorphic surfaces with a 12px Backdrop Blur and 70% opacity.
4.  **Shadows:** Instead of traditional black shadows, use "Ambient Glows"—ultra-diffused (40px-60px blur) low-opacity dropshadows that inherit the hue of the primary accent (#FF6A3D) to suggest the object is emitting light.
5.  **3D Pedestals:** Product images sit on a subtle elliptical gradient "floor" shadow to provide a sense of physical space.

## Shapes
The shape language is **boldly rounded** to contrast with the technical, sharp nature of 3D printing.

- **Standard Containers:** Use a 16px radius (rounded-lg) for product cards and content blocks.
- **Interactive Elements:** Buttons and input fields use a 12px radius. 
- **Large Sections:** Main hero containers or featured banners use a 24px radius (rounded-xl).
- **Accents:** Use circular "node" shapes for status indicators to mimic machine LEDs.

## Components
- **Buttons:** 
  - *Primary:* Solid #FF6A3D with white text. High-gloss finish with a subtle top-down gradient.
  - *Secondary:* Ghost style with #22D3EE border and text. On hover, fills with a 10% opacity cyan glow.
- **Product Cards:** Must feature a 3D pedestal shadow beneath the model render. The card background should be #1A1D27 with a transition to a "Filament Orange" outer glow on hover.
- **Technical Chips:** Using JetBrains Mono, these small tags (e.g., "STL", "OBJ", "12MB") should have a subtle dark-blue background and secondary text color.
- **Input Fields:** Darker than the surface (#0D0F14), with a 1px border that glows Electric Cyan when focused.
- **Progress Bars:** Use a dual-tone gradient from Secondary to Primary to represent the "printing" or "downloading" state, appearing like a glowing laser line.
- **3D HUD Elements:** Decorative 0.5pt lines and "crosshair" corner brackets around featured assets to enhance the tech-forward aesthetic.
# Nexar Design System

## Status

This document defines the visual direction for the Nexar employee carpool MVP. It is based on the supplied reference screens in `assets/Ref Designs/`, the Nexar logo lockups, and the paired icon assets in `assets/Icons/`.

The default experience is dark. Light-theme tokens are defined from the beginning so the application can support both themes without rewriting component styles.

## Design Intent

Nexar should feel quiet, precise, private, and useful during a daily commute. The interface is operational rather than promotional. Information should be easy to scan while walking, waiting for pickup, or checking an active trip.

The visual language is:

- Dark-first and monochrome with restrained semantic status colors.
- Mobile-first, with compact navigation and stacked task flows.
- Built from graphite panels, fine borders, rounded surfaces, and strong typography.
- Sparse and direct, with no social-feed patterns, decorative illustrations, or unnecessary dashboard density.
- Privacy-aware: approximate pickup zones and approved landmarks are visually distinct from exact locations.

## Reference Assets

### Reference screens

- `assets/Ref Designs/Legal.png`
- `assets/Ref Designs/FAQ.png`
- `assets/Ref Designs/NEXAR ROLE.png`
- `assets/Ref Designs/Details.png`

These references establish the charcoal background, graphite content panels, rounded containers, bright primary text, stacked mobile layouts, bold headings, and persistent bottom navigation treatment.

### Logos

- `assets/Nexar_logo_exp.svg`: expanded Nexar lockup for wider headers and desktop navigation.
- `assets/Nexar_logo_adj.svg`: compact mark for mobile headers and constrained surfaces.

The supplied SVG logos are black-only. They must be placed on sufficiently light surfaces. Do not place the black logo directly on the default charcoal canvas. If a white logo is needed on a dark surface, create and review a deliberate brand-approved derivative rather than applying an arbitrary CSS filter.

### Icons

The icon family provides explicit light and dark variants for:

- Account and home user
- Home and office
- Rides and chats
- Nex points
- Settings and theme
- Help and legal
- Hotspot and plus
- Menu and close

Use white variants on dark surfaces and black/graphite variants on light surfaces. Preserve the supplied SVG geometry. Icon-only controls require an accessible label and tooltip where the meaning is not universally familiar.

## Color System

Components must consume semantic variables, never raw color values. `html.dark` is the default theme. `html.light` is the future-ready alternate theme.

### Dark theme

```css
:root,
html.dark {
  color-scheme: dark;
  --color-canvas: #3a3838;
  --color-surface: #494848;
  --color-surface-raised: #5a5858;
  --color-surface-inset: #2b2b2b;
  --color-ink: #2b2b2b;
  --color-text-primary: #ffffff;
  --color-text-secondary: #c8c6c6;
  --color-text-muted: #9d9a9a;
  --color-border: #6d6a6a;
  --color-border-subtle: #585555;
  --color-focus: #ffffff;
  --color-success: #82c99a;
  --color-warning: #e7c477;
  --color-danger: #f18484;
  --color-info: #8fb9e8;
}
```

### Light theme

```css
html.light {
  color-scheme: light;
  --color-canvas: #f2f0ee;
  --color-surface: #ffffff;
  --color-surface-raised: #e8e5e2;
  --color-surface-inset: #2b2b2b;
  --color-ink: #2b2b2b;
  --color-text-primary: #2b2b2b;
  --color-text-secondary: #494848;
  --color-text-muted: #6b6868;
  --color-border: #b8b4b1;
  --color-border-subtle: #d6d1cd;
  --color-focus: #2b2b2b;
  --color-success: #287449;
  --color-warning: #876300;
  --color-danger: #a33434;
  --color-info: #245b8f;
}
```

The exact values may be tuned after browser contrast checks, but the semantic names and theme boundary should remain stable. Status colors are reserved for state, safety, validation, and alerts; they should not become decorative accents throughout the interface.

## Theme Contract

- Dark mode is the initial default and should not flash light during page load.
- Theme selection should be represented by a theme class or data attribute on the root HTML element.
- Components use semantic variables only.
- Icons and logos are selected by theme/surface context rather than recolored unpredictably at runtime.
- Theme transitions should be short and subdued; never animate an SOS action or safety confirmation.
- Future theme switching must preserve the user's selected theme without changing layout or information hierarchy.

## Typography

Use Poppins as the expressive rounded geometric display face and DM Sans as the calmer secondary interface face. Both are loaded intentionally through `next/font/google` rather than relying on a browser default stack. Define these roles:

- Display and heading: Poppins, with bold short onboarding, role-selection, and trip identity headings.
- Body and controls: DM Sans, for readable profile, verification, navigation, and trip information.
- Label and caption: DM Sans, for compact field names, metadata, privacy notes, and timestamps.

Typography should use strong weight contrast rather than excessive size. Display-scale text belongs on onboarding and role surfaces, not inside compact trip cards. Body text must remain comfortable on small screens. Letter spacing remains neutral.

## Geometry and Layout

- Use 8px spacing increments wherever practical.
- Use generous mobile page gutters and keep interactive controls within comfortable reach.
- Use approximately 8px to 16px corner radii based on surface size; avoid pill-shaped containers except for true status chips.
- Use thin borders to separate graphite surfaces instead of heavy shadows.
- Keep controls at stable dimensions so labels, loading states, and icons cannot shift layout.
- Avoid cards inside cards. Use full-width page bands for major sections and framed cards only for repeated trip/member items, dialogs, and focused tools.
- Use a compact bottom navigation on mobile. A wider sidebar may be used on desktop for repeated admin workflows.
- Keep maps, trip status, pickup/drop information, and safety actions visible without obscuring one another.

## Core Components

### App shell

The shell uses a compact header, the appropriate Nexar logo, a menu or close action where needed, and mobile bottom navigation. Desktop layouts may add a persistent navigation rail when it improves repeated workflows.

### Surfaces

Use graphite panels for forms, trip summaries, verification steps, and role selection. Surface hierarchy comes from tone, border, and spacing rather than large shadows or gradients.

### Inputs

Inputs use outlined or inset rows with clear labels, visible focus treatment, and explicit error states. Location inputs must identify whether they represent an approximate home zone, an approved pickup landmark, or an office entrance.

### Navigation

Use the supplied icon assets. Active navigation should be communicated through contrast, label, and a restrained surface treatment, not color alone.

### Trip state

Use compact status chips and clear text for `REQUESTED`, `MATCHED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, and `CANCELLED`. The lifecycle remains understandable without relying only on semantic color.

### Safety

Report, block, and SOS controls must be visually discoverable during an active trip. SOS is a high-priority action with a strong danger treatment, explicit confirmation, and no animation that delays activation.

### Maps and locations

Map surfaces should use approved landmarks and approximate zones where possible. Exact home addresses must never be exposed through a marker, tooltip, list, or accidental zoom state. Walking distance to an office entrance may be shown to the matched rider.

## Responsive Behavior

The supplied references are narrow phone compositions, so mobile is the baseline:

- Single-column flow for verification, profile, commute, and matching.
- Bottom navigation for primary authenticated sections.
- Full-width primary actions with stable minimum height.
- Compact but readable trip rows and member information.
- Map panels use a stable aspect ratio and never collapse below a usable height.

On desktop:

- Constrain reading width for forms and policy content.
- Use a two-column arrangement only when it improves map plus trip information scanning.
- Use a sidebar or wider navigation rail for admin and repeated operational workflows.
- Preserve the same hierarchy, spacing rhythm, and safety action placement.

## Interaction and Motion

Motion should clarify state, not decorate the product:

- Subtle page and panel entry transitions.
- Short navigation and theme transitions.
- Clear loading, success, error, empty, disabled, and retry states.
- Reduced-motion support through `prefers-reduced-motion`.
- No delayed or obscured report, block, or SOS interactions.
- Live trip updates should use restrained status changes rather than constant movement or flashing.

## Accessibility and Privacy

- Target WCAG AA contrast for text, icons, borders, focus indicators, status treatments, and SOS controls in both themes.
- Never use color as the only indication of trip state, validation, or danger.
- Provide visible keyboard focus on desktop.
- Provide labels and accessible names for every control.
- Support reduced motion and readable text scaling.
- Keep touch targets comfortable on mobile.
- Distinguish approximate home zones from exact matched-trip locations in both text and map treatment.
- Do not reveal another user's exact home address before or after matching.

## Screen Direction

The design system will be applied to these MVP surfaces:

1. Workplace and phone verification.
2. Profile, home zone, office entry time, and vehicle setup.
3. Driver/rider role selection.
4. Matching result and confirmation.
5. Driver active trip.
6. Rider active trip.
7. Trip completion and one-tap rating.
8. Report, block, and SOS flow.
9. Admin flagged-trip and suspension view.

Each screen should remain sparse and task-focused. The visual system supports the fields and privacy rules in `claude.md`; it should not introduce chat feeds, social profiles, payments, wallet balances, rewards, or marketplace discovery.

## Design Review Checklist

Before shipping a UI slice:

- Confirm dark mode is the default.
- Confirm light mode renders through semantic variables.
- Confirm the correct logo and icon variant is used for the surface.
- Confirm all text and controls meet contrast and focus requirements.
- Confirm mobile and desktop layouts do not overlap or shift unexpectedly.
- Confirm map and home-zone surfaces reveal only permitted location precision.
- Confirm loading, empty, error, disabled, and reduced-motion states.
- Confirm safety actions remain immediately reachable.
- Confirm no out-of-scope marketplace, payment, wallet, reward, or chat behavior was introduced.

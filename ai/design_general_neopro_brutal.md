# design.md — NeoPro Brutal General UI System

> A general-purpose UI/UX design system for websites, mobile apps, office apps, admin panels, portals, dashboards, landing pages, and content platforms.  
> Style direction: **Neobrutalism with a professional touch** — bold, structured, useful, accessible, and unique.

---

## 1. Design Direction

### Style Name

**NeoPro Brutalism**

A visual system that combines:

- **Neobrutalism:** strong borders, hard shadows, visible structure, bold blocks, tactile components.
- **Professional product design:** clean hierarchy, accessibility, responsive behavior, predictable interaction.
- **General-purpose usability:** suitable for public websites, internal office apps, mobile screens, dashboards, forms, booking apps, e-commerce, education platforms, portfolios, and service websites.

### Design Goal

The UI should feel:

- Bold but not childish
- Modern but not generic
- Expressive but not messy
- Professional but not boring
- Tactile but still clean
- Unique without copying any reference website

### Core Principles

1. **Clarity first**  
   Visual style must support understanding, not fight it.

2. **Bold structure**  
   Use borders, cards, panels, shadows, and grids to make layouts easy to scan.

3. **Reusable across products**  
   The system should work for websites, mobile apps, office tools, business portals, content pages, admin panels, and marketing pages.

4. **Professional restraint**  
   Do not make every component loud. Use brutalist elements intentionally.

5. **Accessibility by default**  
   Every component must be readable, keyboard-friendly, and responsive.

---

## 2. Suitable Use Cases

This design system can be used for:

- Business websites
- Portfolio websites
- Landing pages
- E-commerce websites
- Restaurant / cafe / FMCG websites
- Education websites
- Mobile apps
- Office management apps
- CRM apps
- HR apps
- Inventory systems
- Finance dashboards
- Admin panels
- Internal tools
- Booking platforms
- Productivity apps
- Content platforms
- Community websites
- Event websites
- Agency websites
- Service provider websites

The design should not feel locked to only SaaS or AI products.

---

## 3. Visual Identity

### Brand Personality

- Confident
- Clear
- Practical
- Bold
- Trustworthy
- Slightly rebellious
- Human-friendly
- Systematic
- Modern

### Visual Metaphors

Depending on the product, use different metaphors:

| Product Type | Visual Metaphor |
|---|---|
| Business website | Bold editorial blocks |
| Mobile app | Tactile cards and clear actions |
| Office app | Organized control desk |
| Dashboard | Command board |
| E-commerce | Product shelf / catalog blocks |
| Education | Learning cards / progress map |
| Restaurant / FMCG | Product tiles and menu boards |
| Portfolio | Showcase grid |
| Booking app | Schedule board |
| Community app | Noticeboard |

---

## 4. Color System

### Base Palette

Use a neutral foundation with strong accent colors.

```css
:root {
  --background: #F4F0E8;
  --surface: #FFFDF7;
  --surface-muted: #E8E1D4;

  --foreground: #151515;
  --foreground-muted: #5B554E;

  --border: #151515;
  --shadow: #151515;

  --primary: #FF5A1F;
  --primary-hover: #E94E18;
  --primary-soft: #FFE0D2;

  --secondary: #1F7AFF;
  --secondary-hover: #1765D8;
  --secondary-soft: #DDEBFF;

  --accent: #D7FF3F;
  --accent-soft: #F0FFC2;

  --success: #19A35B;
  --success-soft: #D9F8E7;

  --warning: #FFB800;
  --warning-soft: #FFF1BF;

  --danger: #E63946;
  --danger-soft: #FFD8DD;

  --info: #5B5FEF;
  --info-soft: #E3E4FF;
}
```

### Color Roles

| Token | Use |
|---|---|
| Background | Main app/site background |
| Surface | Cards, panels, forms, modals |
| Surface muted | Secondary areas and muted sections |
| Foreground | Main text |
| Foreground muted | Captions and secondary text |
| Border | Component outlines |
| Shadow | Hard brutalist shadows |
| Primary | Main call-to-action |
| Secondary | Links, alternate actions |
| Accent | Highlights and featured content |
| Success | Positive states |
| Warning | Attention states |
| Danger | Errors and destructive actions |
| Info | Neutral system messages |

### Color Rules

- Use black borders as a signature visual element.
- Use one main accent color per page section.
- Avoid too many loud blocks in one screen.
- Use soft color backgrounds for status states.
- Make sure text contrast is strong.
- Never rely only on color to communicate state.

---

## 5. Typography

### Recommended Fonts

```css
--font-heading: "Space Grotesk", "Inter", sans-serif;
--font-body: "Inter", system-ui, sans-serif;
--font-mono: "JetBrains Mono", "IBM Plex Mono", monospace;
```

### Type Scale

```css
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
--text-3xl: 2rem;
--text-4xl: 2.75rem;
--text-5xl: 4rem;
--text-6xl: 5.5rem;
```

### Typography Rules

- Headings should be bold and compact.
- Body text should remain highly readable.
- Use mono font for labels, codes, numbers, status, timestamps, and keyboard shortcuts.
- Avoid overly decorative fonts.
- Use large headings for marketing pages and smaller compact headings for office apps.
- Mobile screens should use shorter headings and generous line height.

### Example Heading

```css
.heading-xl {
  font-family: var(--font-heading);
  font-size: clamp(2.8rem, 7vw, 5.5rem);
  line-height: 0.92;
  letter-spacing: -0.055em;
  font-weight: 800;
}
```

---

## 6. Spacing System

Use an 8px spacing base.

```css
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-5: 1.25rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-10: 2.5rem;
--space-12: 3rem;
--space-16: 4rem;
--space-20: 5rem;
--space-24: 6rem;
```

### Spacing Rules

| Area | Recommended Spacing |
|---|---|
| Website section padding | `72px–120px` |
| Mobile section padding | `40px–64px` |
| Card padding | `20px–32px` |
| Compact card padding | `14px–20px` |
| Form field gap | `14px–20px` |
| Dashboard panel gap | `16px–24px` |
| Mobile screen padding | `16px–20px` |
| Navbar horizontal padding | `20px–40px` |

---

## 7. Border, Radius, and Shadow

### Borders

```css
--border-thin: 1px solid var(--border);
--border-base: 2px solid var(--border);
--border-thick: 3px solid var(--border);
--border-heavy: 4px solid var(--border);
```

### Radius

```css
--radius-none: 0;
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px;
--radius-xl: 20px;
--radius-pill: 999px;
```

### Shadows

```css
--shadow-hard-sm: 3px 3px 0 var(--shadow);
--shadow-hard-md: 5px 5px 0 var(--shadow);
--shadow-hard-lg: 8px 8px 0 var(--shadow);
--shadow-hard-xl: 12px 12px 0 var(--shadow);
```

### Rules

- Use hard shadows for important interactive elements.
- Use smaller shadows on mobile.
- Use heavier borders for hero panels, modals, and featured cards.
- Use lighter borders for dense office screens.
- Hover should reduce shadow and shift the component slightly.

```css
.neo-hover {
  transition: transform 140ms ease, box-shadow 140ms ease;
}

.neo-hover:hover {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 var(--shadow);
}
```

---

## 8. Layout System

### Page Container

```css
.container {
  width: min(100% - 32px, 1200px);
  margin-inline: auto;
}
```

### Wide Container

```css
.container-wide {
  width: min(100% - 32px, 1440px);
  margin-inline: auto;
}
```

### Mobile Container

```css
.mobile-container {
  width: min(100% - 24px, 430px);
  margin-inline: auto;
}
```

### 12-Column Grid

```css
.grid-12 {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 24px;
}
```

### Common Layout Patterns

| Pattern | Use |
|---|---|
| Single column | Articles, forms, mobile pages |
| Two column | Hero sections, detail pages |
| Three column | Feature grids, product cards |
| Sidebar + content | Office apps, dashboards |
| Topbar + content | Mobile apps, lightweight apps |
| Split panel | Auth pages, settings pages |
| Masonry grid | Portfolios, galleries |
| Table layout | Admin and office tools |

---

## 9. Background Patterns

### Blueprint Grid

```css
.bg-grid {
  background-color: var(--background);
  background-image:
    linear-gradient(rgba(21, 21, 21, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(21, 21, 21, 0.06) 1px, transparent 1px);
  background-size: 28px 28px;
}
```

### Dotted Background

```css
.bg-dots {
  background-image: radial-gradient(var(--foreground) 1px, transparent 1px);
  background-size: 18px 18px;
  opacity: 0.08;
}
```

### Section Block

```css
.section-block {
  border-top: 3px solid var(--border);
  border-bottom: 3px solid var(--border);
  background: var(--surface);
}
```

### Rules

- Use background patterns lightly.
- Do not reduce readability.
- Keep forms and tables on plain surfaces.
- Use patterns mainly in hero, footer, empty states, and marketing sections.

---

# 10. Component Foundation

Every component should follow this base visual grammar:

```css
.neo-box {
  background: var(--surface);
  border: var(--border-base);
  box-shadow: var(--shadow-hard-md);
  border-radius: var(--radius-md);
}
```

### Component Requirements

Every reusable component should define:

- Default state
- Hover state
- Active state
- Focus state
- Disabled state
- Loading state where needed
- Error state where needed
- Mobile behavior
- Accessibility behavior

---

# 11. Buttons

## Button Types

### Primary Button

For the main action.

```css
.btn-primary {
  background: var(--primary);
  color: var(--foreground);
  border: 2px solid var(--border);
  box-shadow: 4px 4px 0 var(--shadow);
  border-radius: 10px;
  font-weight: 800;
  padding: 0.8rem 1.15rem;
}
```

### Secondary Button

For alternate actions.

```css
.btn-secondary {
  background: var(--surface);
  color: var(--foreground);
  border: 2px solid var(--border);
  box-shadow: 4px 4px 0 var(--shadow);
  border-radius: 10px;
  font-weight: 800;
  padding: 0.8rem 1.15rem;
}
```

### Ghost Button

For navigation, tables, compact actions.

```css
.btn-ghost {
  background: transparent;
  border: 2px solid transparent;
  color: var(--foreground);
  font-weight: 700;
  padding: 0.65rem 0.9rem;
}
```

### Icon Button

For toolbars, mobile apps, and compact menus.

```css
.btn-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  background: var(--surface);
  border: 2px solid var(--border);
  box-shadow: 3px 3px 0 var(--shadow);
  border-radius: 10px;
}
```

### Destructive Button

```css
.btn-danger {
  background: var(--danger);
  color: white;
  border: 2px solid var(--border);
  box-shadow: 4px 4px 0 var(--shadow);
  border-radius: 10px;
  font-weight: 800;
}
```

## Button Sizes

| Size | Padding | Use |
|---|---|---|
| Small | `8px 12px` | Tables, compact cards |
| Medium | `12px 18px` | Default UI |
| Large | `16px 24px` | Hero, landing pages |
| Full width | `12px 18px` | Mobile forms |

## Button States

```css
.button:hover {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 var(--shadow);
}

.button:active {
  transform: translate(4px, 4px);
  box-shadow: 0 0 0 var(--shadow);
}

.button:focus-visible {
  outline: 3px solid var(--secondary);
  outline-offset: 3px;
}

.button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}
```

---

# 12. Cards

## Standard Card

For content blocks, services, products, articles, app modules, and summaries.

```css
.card {
  background: var(--surface);
  border: 2px solid var(--border);
  box-shadow: 6px 6px 0 var(--shadow);
  border-radius: 14px;
  padding: 24px;
}
```

### Card Anatomy

```md
Optional icon / image / label
Title
Description
Metadata
Action
```

## Compact Card

For mobile apps and office apps.

```css
.compact-card {
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 10px;
  padding: 16px;
}
```

## Feature Card

For landing pages.

```css
.feature-card {
  background: var(--surface);
  border: 3px solid var(--border);
  box-shadow: 8px 8px 0 var(--shadow);
  border-radius: 16px;
  padding: 28px;
}
```

## Product Card

For e-commerce, catalog, food, FMCG, and service listings.

```md
Product image
Product name
Short description
Price / label
Rating / availability
CTA
```

```css
.product-card {
  background: var(--surface);
  border: 2px solid var(--border);
  box-shadow: 5px 5px 0 var(--shadow);
  border-radius: 14px;
  overflow: hidden;
}
```

## Profile Card

For users, team members, contacts, staff, or authors.

```md
Avatar
Name
Role
Contact / metadata
Action
```

## Stat Card

For dashboards, office apps, and reports.

```md
Label
Big number
Change indicator
Short context
```

## Card Rules

- One card should communicate one main idea.
- Use accent colors for labels, not full backgrounds everywhere.
- Keep interactive cards visibly clickable.
- Do not make dense office cards too tall.
- On mobile, reduce shadow size and increase touch spacing.

---

# 13. Navigation

## Website Navbar

### Desktop Structure

```md
Logo | Main links | Secondary links | CTA
```

Example:

```md
Logo | Home | Services | Products | About | Blog | Contact | Get Started
```

```css
.navbar {
  position: sticky;
  top: 16px;
  z-index: 50;
  background: var(--surface);
  border: 2px solid var(--border);
  box-shadow: 5px 5px 0 var(--shadow);
  border-radius: 16px;
  padding: 12px 16px;
}
```

### Rules

- Keep navigation simple.
- Use an accent block for active nav.
- Keep primary CTA visible.
- Mobile nav should open as a bold drawer or full-screen panel.

## App Topbar

For office apps, dashboards, and mobile web apps.

```md
Page title / Breadcrumb | Search | Quick action | Notifications | User menu
```

```css
.app-topbar {
  height: 64px;
  border-bottom: 2px solid var(--border);
  background: var(--surface);
  display: flex;
  align-items: center;
  padding-inline: 20px;
}
```

## Sidebar

For office apps, admin panels, portals, and dashboards.

```css
.sidebar {
  width: 280px;
  background: var(--surface);
  border-right: 2px solid var(--border);
  padding: 16px;
}
```

### Sidebar Item

```css
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 2px solid transparent;
  border-radius: 10px;
  font-weight: 700;
}

.sidebar-item.active {
  background: var(--accent);
  border-color: var(--border);
  box-shadow: 3px 3px 0 var(--shadow);
}
```

## Mobile Bottom Navigation

Use for mobile apps with 3–5 major sections.

```css
.bottom-nav {
  position: fixed;
  bottom: 12px;
  left: 12px;
  right: 12px;
  background: var(--surface);
  border: 2px solid var(--border);
  box-shadow: 5px 5px 0 var(--shadow);
  border-radius: 18px;
  padding: 8px;
}
```

### Rules

- Use 3–5 items only.
- Label icons clearly.
- Keep active state bold.
- Respect safe-area insets.

---

# 14. Hero Sections

## General Website Hero

```md
Eyebrow
Big headline
Short supporting text
CTA group
Image / product preview / illustration
```

```css
.hero {
  padding: 96px 0;
}
```

## Split Hero

Best for business websites, apps, and services.

```md
Left: message and CTA
Right: visual panel
```

## Editorial Hero

Best for portfolios, agencies, blogs, and campaigns.

```md
Huge headline
Short paragraph
Featured image / card stack
```

## Mobile Hero

```md
Eyebrow
Headline
Description
Primary CTA
Secondary link
Image/card
```

### Hero Rules

- Hero must explain the page quickly.
- Use one clear CTA.
- Keep headline short.
- Use a strong visual block, not decorative clutter.
- On mobile, stack content and reduce shadow size.

---

# 15. Input Fields

## Text Input

```css
.input {
  width: 100%;
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 1rem;
  box-shadow: 3px 3px 0 var(--shadow);
}
```

### Anatomy

```md
Label
Input field
Helper text / Error text
```

### States

```css
.input:focus {
  outline: 3px solid var(--secondary);
  outline-offset: 2px;
}

.input.error {
  border-color: var(--danger);
  background: var(--danger-soft);
}

.input:disabled {
  background: var(--surface-muted);
  color: var(--foreground-muted);
}
```

## Textarea

```css
.textarea {
  min-height: 120px;
  resize: vertical;
  background: var(--surface);
  border: 2px solid var(--border);
  box-shadow: 3px 3px 0 var(--shadow);
  border-radius: 10px;
  padding: 14px;
}
```

## Search Input

```css
.search-input {
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 999px;
  padding: 10px 16px;
  min-width: 280px;
}
```

## Mobile Input Rules

- Minimum height: `44px`.
- Use visible labels.
- Avoid tiny helper text.
- Use full-width fields.
- Keep error messages directly below the field.

---

# 16. Forms

## Standard Form Layout

```md
Form title
Short explanation
Field group
Field group
Action row
```

```css
.form-card {
  background: var(--surface);
  border: 3px solid var(--border);
  box-shadow: 8px 8px 0 var(--shadow);
  border-radius: 16px;
  padding: 32px;
}
```

## Office App Form

For HR, finance, CRM, inventory, and admin pages.

```md
Section title
Two-column fields
Supporting notes
Save / Cancel actions
```

## Mobile Form

```md
Step title
Single-column fields
Sticky bottom action
```

## Form Rules

- Use one-column forms on mobile.
- Group related fields.
- Always show labels.
- Use helper text for unclear fields.
- Use clear success/error feedback.
- Do not place too many fields in one card.
- Use stepper forms for long processes.

---

# 17. Select, Dropdown, Combobox

## Select

```css
.select {
  appearance: none;
  background: var(--surface);
  border: 2px solid var(--border);
  box-shadow: 3px 3px 0 var(--shadow);
  border-radius: 10px;
  padding: 12px 40px 12px 14px;
}
```

## Dropdown Menu

```css
.dropdown {
  background: var(--surface);
  border: 2px solid var(--border);
  box-shadow: 6px 6px 0 var(--shadow);
  border-radius: 12px;
  padding: 8px;
}
```

## Combobox

Use for searchable lists, customers, employees, products, categories, and locations.

```md
Label
Searchable input
Result list
Selected item
```

## Rules

- Use keyboard navigation.
- Show selected state clearly.
- Use loading and empty states.
- Dangerous menu actions should be separated.

---

# 18. Checkbox, Radio, Switch

## Checkbox

```css
.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  background: var(--surface);
  box-shadow: 2px 2px 0 var(--shadow);
}
```

## Radio

```css
.radio {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
}
```

## Switch

```css
.switch {
  width: 48px;
  height: 28px;
  border: 2px solid var(--border);
  border-radius: 999px;
  background: var(--surface-muted);
  box-shadow: 3px 3px 0 var(--shadow);
}
```

### Rules

- Use checkboxes for multiple choices.
- Use radios for one choice from a small set.
- Use switches for immediate on/off settings.
- Use labels beside all controls.

---

# 19. Badges, Tags, and Pills

## Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 2px solid var(--border);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 800;
  background: var(--accent);
}
```

## Use Cases

- Status
- Categories
- Roles
- Availability
- Priority
- Labels
- Product tags
- Content tags

## Badge Variants

| Variant | Use |
|---|---|
| Default | General label |
| Active | Selected state |
| Success | Completed, available |
| Warning | Pending, low stock |
| Danger | Failed, urgent |
| Info | Neutral information |

---

# 20. Tables

## Table

```css
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 2px solid var(--border);
  background: var(--surface);
}
```

## Header

```css
.table th {
  background: var(--foreground);
  color: var(--surface);
  padding: 12px 14px;
  text-align: left;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
```

## Cell

```css
.table td {
  padding: 14px;
  border-top: 2px solid var(--border);
}
```

### Table Rules

- Use tables for dense office data.
- Use cards instead of tables on small mobile screens when possible.
- Keep row actions aligned to the right.
- Use badges for status.
- Use pagination for long lists.
- Provide empty, loading, and error states.

---

# 21. Lists

## Simple List

For menus, settings, notifications, search results, and mobile screens.

```css
.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-bottom: 2px solid var(--border);
}
```

## Rich List Item

```md
Icon / avatar
Title
Subtitle
Metadata
Action
```

## Rules

- Use lists for scan-heavy content.
- Keep spacing comfortable on mobile.
- Make clickable rows clearly interactive.
- Avoid too many actions per row.

---

# 22. Tabs

## Tab List

```css
.tabs {
  display: inline-flex;
  gap: 6px;
  border: 2px solid var(--border);
  background: var(--surface-muted);
  padding: 6px;
  border-radius: 12px;
}
```

## Active Tab

```css
.tab.active {
  background: var(--surface);
  border-color: var(--border);
  box-shadow: 3px 3px 0 var(--shadow);
}
```

### Rules

- Use tabs for related views.
- Keep labels short.
- On mobile, allow horizontal scroll.
- Do not use tabs for primary navigation if there are many items.

---

# 23. Accordions

## Accordion Item

```css
.accordion-item {
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 12px;
  overflow: hidden;
}
```

### Use Cases

- FAQs
- Settings groups
- Help sections
- Product details
- Mobile filters

### Rules

- Do not hide critical actions.
- Keep animation fast.
- Use clear expand icons.
- Support keyboard interaction.

---

# 24. Modals, Drawers, and Bottom Sheets

## Modal

```css
.modal {
  background: var(--surface);
  border: 3px solid var(--border);
  box-shadow: 12px 12px 0 var(--shadow);
  border-radius: 18px;
  padding: 28px;
  max-width: 560px;
}
```

## Drawer

For side navigation, filters, details, and settings.

```css
.drawer {
  background: var(--surface);
  border-left: 3px solid var(--border);
  box-shadow: -8px 0 0 var(--shadow);
}
```

## Bottom Sheet

For mobile actions and filters.

```css
.bottom-sheet {
  background: var(--surface);
  border: 3px solid var(--border);
  border-bottom: 0;
  border-radius: 20px 20px 0 0;
  padding: 20px;
}
```

### Rules

- Use modals for focused decisions.
- Use drawers for secondary panels.
- Use bottom sheets on mobile.
- Trap focus for modals.
- Provide clear close actions.

---

# 25. Toasts, Alerts, and Notifications

## Toast

```css
.toast {
  background: var(--surface);
  border: 2px solid var(--border);
  box-shadow: 6px 6px 0 var(--shadow);
  border-radius: 12px;
  padding: 14px 16px;
}
```

## Alert

```css
.alert {
  border: 3px solid var(--border);
  border-radius: 14px;
  padding: 16px;
  background: var(--warning-soft);
  box-shadow: 5px 5px 0 var(--shadow);
}
```

## Notification Item

```md
Icon
Message
Time
Action / dismiss
```

### Rules

- Toasts should be short.
- Alerts should explain what happened and what to do.
- Notifications should be grouped when many exist.
- Errors should be specific and human-readable.

---

# 26. Progress, Loading, and Skeletons

## Progress Bar

```css
.progress {
  height: 14px;
  border: 2px solid var(--border);
  background: var(--surface-muted);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
}
```

## Stepper

For onboarding, checkout, booking, applications, and forms.

```md
Step 1 → Step 2 → Step 3 → Complete
```

## Skeleton

```css
.skeleton {
  background: repeating-linear-gradient(
    -45deg,
    var(--surface-muted),
    var(--surface-muted) 8px,
    var(--surface) 8px,
    var(--surface) 16px
  );
  border: 2px solid var(--border);
}
```

### Rules

- Use skeletons for content loading.
- Use progress bars for file uploads, tasks, forms, and completion.
- Use steppers for multi-step flows.
- Avoid fake progress that misleads users.

---

# 27. Empty States

## Anatomy

```md
Icon / illustration
Title
Short explanation
Primary action
Secondary action
```

```css
.empty-state {
  border: 3px dashed var(--border);
  background: var(--surface);
  border-radius: 18px;
  padding: 48px 24px;
  text-align: center;
}
```

### Empty State Examples

| Context | Message |
|---|---|
| No products | “No products added yet.” |
| No tasks | “Your task list is clear.” |
| No search results | “No results found for this search.” |
| No notifications | “You’re all caught up.” |
| No files | “Upload your first file to begin.” |

### Rules

- Explain what is missing.
- Provide one clear next action.
- Avoid blame or dead ends.

---

# 28. Pricing, Product, and Service Blocks

## Pricing Card

```md
Plan name
Price
Short description
Feature list
CTA
```

## Product Grid

```md
Image
Name
Category
Price / detail
Availability
CTA
```

## Service Card

```md
Service title
Short description
Key benefit
CTA
```

### Rules

- Use featured cards sparingly.
- Keep product images consistent.
- Use badges for stock, sale, or category.
- Make prices and CTAs easy to find.
- Keep service cards benefit-focused.

---

# 29. Content Components

## Article Card

```md
Category badge
Title
Excerpt
Author / date
Read more
```

## Blog Page

```md
Navbar
Article hero
Content body
Inline callouts
Related posts
Footer
```

## Content Body Rules

- Use a max width of `680px–780px`.
- Use large readable line height.
- Use visible headings.
- Use callout boxes for important notes.
- Avoid long unbroken text.

## Quote Block

```css
.quote-block {
  background: var(--accent-soft);
  border: 3px solid var(--border);
  box-shadow: 6px 6px 0 var(--shadow);
  border-radius: 14px;
  padding: 24px;
}
```

---

# 30. Media, Gallery, and Images

## Image Frame

```css
.image-frame {
  border: 3px solid var(--border);
  box-shadow: 7px 7px 0 var(--shadow);
  border-radius: 16px;
  overflow: hidden;
}
```

## Gallery Grid

Use for portfolios, products, food menus, event pages, and case studies.

```md
Large featured image
Supporting image cards
Caption / metadata
```

### Rules

- Use consistent aspect ratios.
- Do not over-style every image.
- Keep captions readable.
- Use image cards for product-heavy websites.

---

# 31. Calendar, Booking, and Schedule Components

## Calendar Day Cell

```css
.calendar-cell {
  border: 2px solid var(--border);
  background: var(--surface);
  min-height: 96px;
  padding: 8px;
}
```

## Booking Card

```md
Service / event
Date and time
Location
Availability
CTA
```

## Schedule Row

```md
Time
Title
Location / person
Status
Action
```

### Rules

- Make selected dates highly visible.
- Use badges for available, booked, pending, cancelled.
- Keep booking CTAs clear.
- Use confirmation modals for important bookings.

---

# 32. Office App Components

## Dashboard Summary

```md
Stat cards
Recent activity
Pending approvals
Quick actions
Main table/list
```

## Approval Card

```md
Request title
Requester
Date
Details
Approve / Reject
```

## Activity Feed

```md
Avatar / icon
Action
Object
Timestamp
Optional comment
```

## File Card

```md
File icon
File name
Owner
Updated date
Actions
```

## Office App Rules

- Prioritize density and clarity.
- Use compact components.
- Keep actions consistent.
- Use tables for large datasets.
- Use cards for small summaries.
- Keep audit/history visible where needed.

---

# 33. Mobile App Components

## Mobile Screen Structure

```md
Status-safe area
Top app bar
Main content
Floating action / sticky CTA
Bottom navigation
```

## Mobile Card

```css
.mobile-card {
  background: var(--surface);
  border: 2px solid var(--border);
  box-shadow: 3px 3px 0 var(--shadow);
  border-radius: 14px;
  padding: 16px;
}
```

## Floating Action Button

```css
.fab {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  background: var(--primary);
  border: 2px solid var(--border);
  box-shadow: 5px 5px 0 var(--shadow);
}
```

## Mobile Rules

- Minimum tap target: `44px`.
- Use bottom sheets for actions.
- Avoid dense tables.
- Use sticky CTAs for important flows.
- Keep navigation simple.
- Reduce shadow intensity compared to desktop.

---

# 34. E-commerce and Catalog Components

## Product Listing Page

```md
Header
Category filters
Sort control
Product grid
Pagination / load more
```

## Product Detail Page

```md
Image gallery
Product title
Price
Description
Options
Quantity
CTA
Related products
```

## Cart Item

```md
Image
Name
Variant
Quantity
Price
Remove action
```

## Rules

- Product images should be clean and consistent.
- Price and CTA must be highly visible.
- Filters should be easy to reset.
- Use badges for sale, new, low stock, popular.
- Checkout forms must be clear and trustworthy.

---

# 35. Footer

## Website Footer

```md
Brand block
Navigation links
Contact information
Social links
Newsletter / CTA
Legal links
```

```css
.footer {
  background: var(--foreground);
  color: var(--surface);
  border-top: 4px solid var(--border);
  padding: 64px 0 32px;
}
```

## App Footer

Usually minimal:

```md
Version
Support
Legal
Status
```

### Rules

- Use inverted colors for strong ending.
- Keep footer links organized.
- Add contact information for business websites.
- Avoid clutter.

---

# 36. Icons and Illustration

## Icon Style

- Thick strokes
- Simple geometry
- Slightly playful but professional
- Consistent stroke width
- Prefer outlined icons

```css
.icon-box {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  background: var(--accent);
  border: 2px solid var(--border);
  box-shadow: 3px 3px 0 var(--shadow);
  border-radius: 10px;
}
```

## Illustration Direction

Use:

- Bold outlined illustrations
- Product blocks
- Office objects
- Cards and panels
- Simple characters if needed
- Product shelves
- Documents and folders
- Maps, schedules, charts
- Abstract modular shapes

Avoid:

- Generic 3D robots
- Overused stock illustrations
- Ultra-soft pastel cartoons
- Complex illustrations that hurt readability

---

# 37. Motion and Interaction

## Motion Principles

- Fast
- Tactile
- Purposeful
- Mechanical
- Clear

```css
--motion-fast: 120ms;
--motion-base: 180ms;
--motion-slow: 260ms;
```

## Motion Rules

- Hover should feel like pressing a physical block.
- Page transitions should be subtle.
- Mobile transitions should be quick and natural.
- Avoid slow floating animations.
- Respect reduced motion.

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

---

# 38. Accessibility

## Required Accessibility Rules

- Text must meet WCAG AA contrast.
- Every input must have a label.
- Every button must have a visible focus state.
- Icon-only buttons must have accessible labels.
- Forms must show clear error messages.
- Modals must trap focus.
- Dropdowns must support keyboard navigation.
- Touch targets must be at least `44px`.
- Do not communicate state with color alone.
- Respect reduced motion.

## Focus State

```css
:focus-visible {
  outline: 3px solid var(--secondary);
  outline-offset: 3px;
}
```

---

# 39. Responsive Behavior

## Mobile

- Stack layouts.
- Use full-width buttons in forms.
- Reduce shadow sizes.
- Use bottom sheets and bottom nav.
- Replace tables with cards when possible.
- Keep page padding between `16px–20px`.

## Tablet

- Use two-column layouts.
- Keep cards readable.
- Avoid overly dense controls.
- Use collapsible sidebars.

## Desktop

- Use 12-column grids.
- Use sidebars for complex apps.
- Use larger hero typography.
- Use richer cards and panels.

---

# 40. Page Templates

## General Website

```md
Navbar
Hero
Trust / highlights
Services / features
About section
Content / gallery
Testimonials
CTA section
Footer
```

## Business / Office Website

```md
Navbar
Hero
Services
Process
Team
Case studies
Contact form
Footer
```

## Mobile App

```md
Top app bar
Primary content cards
List / feed
Sticky CTA or FAB
Bottom navigation
```

## Office App

```md
Sidebar
Topbar
Summary cards
Main table/list
Activity feed
Detail drawer
```

## E-commerce Website

```md
Navbar
Hero / promo
Category grid
Product grid
Featured products
Reviews
Footer
```

## Education Platform

```md
Navbar
Course hero
Progress cards
Lesson list
Resources
Discussion / support
Footer
```

## Blog / Content Site

```md
Navbar
Featured article
Article grid
Category filters
Newsletter block
Footer
```

## Booking App

```md
Service selection
Date/time picker
Customer details
Review
Confirmation
```

---

# 41. Tailwind Token Suggestion

```js
theme: {
  extend: {
    colors: {
      background: "#F4F0E8",
      surface: "#FFFDF7",
      muted: "#E8E1D4",
      foreground: "#151515",
      primary: "#FF5A1F",
      secondary: "#1F7AFF",
      accent: "#D7FF3F",
      success: "#19A35B",
      warning: "#FFB800",
      danger: "#E63946",
      info: "#5B5FEF"
    },
    boxShadow: {
      neoSm: "3px 3px 0 #151515",
      neoMd: "5px 5px 0 #151515",
      neoLg: "8px 8px 0 #151515",
      neoXl: "12px 12px 0 #151515"
    },
    borderRadius: {
      neoSm: "6px",
      neoMd: "10px",
      neoLg: "14px",
      neoXl: "20px"
    },
    fontFamily: {
      heading: ["Space Grotesk", "Inter", "sans-serif"],
      body: ["Inter", "system-ui", "sans-serif"],
      mono: ["JetBrains Mono", "monospace"]
    }
  }
}
```

---

# 42. CSS Utility Examples

## Neo Box

```css
.neo-box {
  background: var(--surface);
  border: 2px solid var(--border);
  box-shadow: 5px 5px 0 var(--shadow);
  border-radius: 14px;
}
```

## Neo Button

```css
.neo-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--primary);
  border: 2px solid var(--border);
  box-shadow: 4px 4px 0 var(--shadow);
  border-radius: 10px;
  padding: 12px 18px;
  font-weight: 800;
  cursor: pointer;
}
```

## Neo Input

```css
.neo-input {
  background: var(--surface);
  border: 2px solid var(--border);
  box-shadow: 3px 3px 0 var(--shadow);
  border-radius: 10px;
  padding: 12px 14px;
}
```

## Neo Section

```css
.neo-section {
  border-block: 3px solid var(--border);
  background: var(--surface);
  padding: 80px 0;
}
```

---

# 43. Do and Do Not

## Do

- Use bold black borders.
- Use hard shadows intentionally.
- Keep layout alignment clean.
- Use readable typography.
- Make buttons tactile.
- Keep mobile interactions easy.
- Use labels and helper text.
- Provide loading, empty, and error states.
- Design for both websites and apps.
- Keep the system ownable and unique.

## Do Not

- Do not copy another website’s exact design.
- Do not overuse loud colors.
- Do not put hard shadows on every tiny element.
- Do not sacrifice readability for style.
- Do not hide form labels.
- Do not make mobile screens too dense.
- Do not rely only on color for status.
- Do not use tiny low-contrast text.
- Do not over-animate.
- Do not make the UI feel like only a SaaS dashboard.

---

# 44. Implementation Checklist

Before shipping any page or screen:

- [ ] The page uses the color tokens.
- [ ] The layout works on mobile, tablet, and desktop.
- [ ] Buttons have hover, active, disabled, loading, and focus states.
- [ ] Inputs have labels, helper text, error states, and focus states.
- [ ] Cards follow consistent border and shadow rules.
- [ ] Navigation is clear and responsive.
- [ ] Tables have mobile alternatives.
- [ ] Modals and drawers are keyboard-accessible.
- [ ] Empty states provide next actions.
- [ ] Alerts explain the issue clearly.
- [ ] Touch targets are at least `44px`.
- [ ] Motion respects reduced-motion settings.
- [ ] The UI feels bold, professional, and usable.
- [ ] The visual style is unique and not copied.

---

# 45. Final Design Rule

The interface should feel like a **well-built physical system**: clear blocks, strong edges, visible structure, and confident actions.

It should work for a landing page, a mobile app, a shop, a school platform, an office dashboard, or a business website.

The style should be memorable, but the user experience should always stay simple, useful, and trustworthy.

# Forum Website — UI/UX Guide

## Design Goal

The forum should feel modern, clean, fast, and readable.

Prioritize:

- readability
- mobile usability
- clear navigation
- accessible interactions
- fast scanning of threads
- low visual clutter

## Core Layout

```txt
Header
  ├─ Logo
  ├─ Search
  ├─ Forums link
  ├─ Login/Register or User menu

Main content
  ├─ Page heading
  ├─ Primary action
  ├─ Content list/detail

Right rail on desktop only
  ├─ Popular tags
  ├─ Recent activity
  ├─ Community stats

Footer
```

## Pages

### Home

- Hero section with product/community intro
- Latest threads
- Popular categories
- Search bar

### Forums Page

- Category cards
- Category name
- Description
- Thread count
- Last activity

### Category Page

- Category title and description
- New thread button for members
- Sort tabs: latest, newest, unanswered
- Thread rows

### Thread Page

- Thread title
- Original post
- Reply list
- Reply composer
- Locked/deleted state handling

### Search Page

- Search input
- Result count
- Result cards
- Empty result suggestions

### Profile Page

- Avatar
- Username
- Bio
- Public activity tabs

### Moderation Queue

- Report list
- Content preview
- User context
- Action buttons
- Audit history

## Components

### Button

Variants:

- primary
- secondary
- ghost
- destructive
- link

States:

- default
- hover
- focus
- disabled
- loading

### Card

Use for:

- categories
- thread preview
- user profile summary
- moderation report item

### Form Fields

Every form field must have:

- label
- helper text if needed
- validation message
- disabled/loading state

### Thread Row

Display:

- title
- author
- category/tag
- reply count
- last activity
- status badges

### Editor

MVP editor:

- textarea or simple Markdown editor
- preview tab
- code block support
- character count for long content

Add TipTap after MVP if needed.

## Mobile Rules

At 375px width:

- no horizontal scroll
- buttons must be easy to tap
- thread rows should stack
- right rail should hide
- search should be full width
- reply composer should remain usable

## Accessibility Rules

- Visible focus state on all interactive elements
- Semantic headings
- Buttons for actions, links for navigation
- Form labels required
- Error messages connected to fields
- Keyboard navigation works
- Color contrast must be readable

## Empty States

Examples:

- No categories: “No public categories yet.”
- No threads: “No threads yet. Start the first discussion.”
- No search results: “No results found. Try a shorter search.”
- No reports: “Moderation queue is clear.”

## Loading States

Use skeletons for:

- thread list
- category list
- profile activity
- moderation queue

Use button loading states for mutations.

## Error States

Show clear messages:

- “You need to log in to reply.”
- “This thread is locked.”
- “You do not have permission to do this.”
- “Something went wrong. Try again.”

## Design Tokens

Define tokens in Tailwind:

- background
- foreground
- muted
- border
- primary
- secondary
- destructive
- success
- warning

Keep colors consistent across light and dark modes.

# HireVex — Design System & UI Specification

> **Purpose:** Complete design reference for building the HireVex frontend. Feed this file + the mockup images to any AI tool or developer to build pixel-perfect pages.
>
> **Mockup Files:** All `.png` files in this folder are the source-of-truth mockups.
> **Last Updated:** 2026-04-19

---

## 📐 Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Surfaces & Elevation](#5-surfaces--elevation)
6. [Components](#6-components)
7. [Icons & Badges](#7-icons--badges)
8. [Landing Page — Scroll Animations](#8-landing-page--scroll-animations)
9. [Page-by-Page Specs](#9-page-by-page-specs)
10. [Motion & Micro-Interactions](#10-motion--micro-interactions)
11. [Responsive Breakpoints](#11-responsive-breakpoints)
12. [Do's & Don'ts](#12-dos--donts)
13. [CSS Variables Reference](#13-css-variables-reference)

---

## 1. Design Philosophy

### Creative North Star: "The Cognitive Luminary"

The UI feels less like a database and more like an **elite recruitment partner**. We reject the "boxed-in" layout. Instead of rigid grids and harsh dividers, we use **intentional asymmetry** and **tonal depth**.

#### Core Principles
| Principle | Description |
|-----------|------------|
| **Dark Command Center** | Deep navy foundation — expansive, breathable, premium |
| **No-Line Rule** | No 1px borders for sectioning. Space is defined by background shifts |
| **Glassmorphism** | AI insights "float" with blur + transparency over the base |
| **Intentional Asymmetry** | Floating insight cards overlap standard grids to break template feel |
| **Tonal Depth** | Depth through color layering, not drop shadows |
| **AI is the Hero** | AI-generated insights are visually elevated above raw data |

---

## 2. Color System

### Base Palette
```css
/* ── SURFACE HIERARCHY ── */
--surface:                    #0b1326;   /* The infinite canvas (base) */
--surface-container-lowest:   #0f1729;   /* Deepest insets */
--surface-container-low:      #131b2e;   /* Main content areas */
--surface-container:          #1a2236;   /* Cards, sidebars */
--surface-container-high:     #222a3f;   /* Elevated elements */
--surface-container-highest:  #2d3449;   /* Active/selected items */

/* ── ACCENT COLORS ── */
--primary:                    #bdc2ff;   /* Primary text accent, buttons */
--primary-container:          #7c87f3;   /* Gradient endpoint, deeper accent */
--secondary:                  #c5c0d0;   /* Secondary text */
--secondary-container:        #3e3850;   /* AI pulse chips */
--tertiary:                   #ffb783;   /* Urgent/high-match callouts (use sparingly) */
--tertiary-container:         #6b4020;   /* Tertiary bg */

/* ── TEXT COLORS ── */
--on-surface:                 #e4e1e9;   /* Primary text */
--on-surface-variant:         #c8c5d0;   /* Secondary/muted text */
--on-primary:                 #1a1b2e;   /* Text on primary buttons */

/* ── STATUS COLORS ── */
--success:                    #4ade80;   /* Green — hired, high match */
--warning:                    #fbbf24;   /* Amber — needs attention */
--error:                      #f87171;   /* Red — rejected, failed */
--info:                       #60a5fa;   /* Blue — informational */

/* ── SPECIAL ── */
--surface-tint:               #bdc2ff;   /* For glassmorphism (10% opacity) */
--outline-variant:            #49454f;   /* Ghost borders (15% opacity only) */
--gradient-primary:           linear-gradient(135deg, #bdc2ff, #7c87f3);
--gradient-cta:               linear-gradient(135deg, #7c87f3, #6366f1);
```

### The "No-Line" Rule
```
❌ NEVER: border: 1px solid #333;
✅ ALWAYS: Background shifts between surface levels

Container separation:  surface-container-low  on  surface
Micro-hierarchy:       surface-container-highest  on  surface-container (sidebar active item)
```

### Glassmorphism Recipe
```css
/* For AI insight cards and floating panels */
.glass-card {
    background: rgba(189, 194, 255, 0.06);   /* surface_tint at 6% */
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(189, 194, 255, 0.08);  /* ghost border */
    border-radius: 1.5rem;
}

/* Higher emphasis glass (hero AI cards) */
.glass-card-elevated {
    background: rgba(189, 194, 255, 0.10);
    backdrop-filter: blur(30px);
    border: 1px solid rgba(189, 194, 255, 0.12);
    box-shadow: 0 8px 40px rgba(11, 19, 38, 0.4);
}
```

---

## 3. Typography

### Font: Inter (Google Fonts)
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
```

### Type Scale
| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `display-lg` | 56px | 800 | 1.1 | Landing page hero headline |
| `display-md` | 44px | 700 | 1.15 | Page titles ("Command Center") |
| `display-sm` | 36px | 700 | 1.2 | Section headlines |
| `headline-lg` | 32px | 700 | 1.25 | Feature section titles |
| `headline-md` | 28px | 600 | 1.3 | Card titles, welcome text |
| `title-lg` | 22px | 600 | 1.35 | Candidate names, job titles |
| `title-md` | 18px | 600 | 1.4 | Sub-section headers |
| `title-sm` | 16px | 600 | 1.4 | Card titles |
| `body-lg` | 16px | 400 | 1.6 | Main body text |
| `body-md` | 14px | 400 | 1.5 | Secondary body text |
| `body-sm` | 12px | 400 | 1.5 | Captions, timestamps |
| `label-lg` | 14px | 600 | 1.2 | Button text |
| `label-md` | 12px | 600 | 1.2 | Metadata labels (UPPERCASE, 0.05em spacing) |
| `label-sm` | 10px | 500 | 1.2 | Micro labels |

### Typography Rules
- **Labels** (metadata like "AI MATCH SCORE", "LIVE INTELLIGENCE"): Always `uppercase` + `letter-spacing: 0.05em`
- **Numbers** (scores, stats): Use `font-variant-numeric: tabular-nums` for alignment
- **No pure black or white text.** All text uses the tinted on-surface scale

---

## 4. Spacing & Layout

### Spacing Scale
```css
--space-xs:   4px;
--space-sm:   8px;
--space-md:   12px;
--space-lg:   16px;
--space-xl:   24px;
--space-2xl:  32px;
--space-3xl:  48px;
--space-4xl:  64px;
--space-5xl:  96px;
```

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ Top Navbar (56px height)                                │
├──────────┬──────────────────────────────────────────────┤
│ Sidebar  │  Main Content                                │
│ 220px    │  padding: 32px                               │
│ fixed    │                                              │
│          │  Max content width: 1200px                   │
│          │  Gap between cards: 24px                     │
└──────────┴──────────────────────────────────────────────┘
```

### Sidebar Spec
- Width: `220px` fixed
- Background: `surface-container` (#1a2236)
- Active item: `surface-container-highest` with `rounded-xl` + left accent bar (3px, `primary`)
- Logo area: Top, with "INTELLIGENT CO-PILOT" subtext in `label-md`
- Bottom: "Upgrade to Pro" CTA button + Settings/Support links

### Border Radius Scale
```css
--radius-sm:   8px;     /* Small chips, badges */
--radius-md:   12px;    /* Input fields, small cards */
--radius-lg:   16px;    /* Standard cards */
--radius-xl:   24px;    /* Main containers, buttons, glass cards */
--radius-full: 9999px;  /* Avatars, round badges */
```

---

## 5. Surfaces & Elevation

### Layering Principle (No Traditional Shadows)
Depth = color stacking. Think of the UI as nested physical layers:

```
Layer 0:  surface (#0b1326)           → The infinite canvas
Layer 1:  surface-container-low       → Main content sections
Layer 2:  surface-container           → Cards sitting on content
Layer 3:  surface-container-high      → Elevated interactive elements
Layer 4:  Glass card                  → AI insight floaters
```

### Ambient Shadow (Use Sparingly)
```css
/* Only for floating cards and modals */
.ambient-shadow {
    box-shadow: 0 8px 40px rgba(11, 19, 38, 0.6);
}

/* Soft lift for cards on hover */
.card-hover-shadow {
    box-shadow: 0 12px 48px rgba(11, 19, 38, 0.5);
}
```

### Ghost Border (Fallback for Low-Contrast Containers)
```css
.ghost-border {
    border: 1px solid rgba(73, 69, 79, 0.15); /* outline-variant at 15% */
}
```

---

## 6. Components

### Buttons

#### Primary Button
```css
.btn-primary {
    background: linear-gradient(135deg, #bdc2ff, #7c87f3);
    color: #1a1b2e;
    font-weight: 600;
    font-size: 14px;
    padding: 12px 28px;
    border-radius: 24px;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(124, 135, 243, 0.3);
}
.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 28px rgba(124, 135, 243, 0.45);
}
```

#### Secondary Button
```css
.btn-secondary {
    background: var(--surface-container-high);
    color: var(--primary);
    padding: 12px 28px;
    border-radius: 24px;
    border: none;
    font-weight: 600;
    transition: all 0.3s ease;
}
.btn-secondary:hover {
    background: var(--surface-container-highest);
}
```

#### Tertiary / Ghost Button
```css
.btn-ghost {
    background: transparent;
    color: var(--primary);
    padding: 12px 28px;
    border-radius: 24px;
    border: none;
    transition: all 0.3s ease;
}
.btn-ghost:hover {
    background: rgba(189, 194, 255, 0.06);
    box-shadow: 0 0 20px rgba(189, 194, 255, 0.08);
}
```

### Cards

#### Standard Card
```css
.card {
    background: var(--surface-container-low);
    border-radius: 24px;
    padding: 24px;
    transition: all 0.3s ease;
}
.card:hover {
    background: var(--surface-container);
    transform: translateY(-2px);
}
```

#### AI Insight Card (Floating Glass)
```css
.insight-card {
    background: rgba(189, 194, 255, 0.06);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(189, 194, 255, 0.08);
    border-radius: 24px;
    padding: 28px;
    box-shadow: 0 8px 40px rgba(11, 19, 38, 0.4);
}
```

#### Candidate Card (from Decision Board mockup)
```css
.candidate-card {
    background: var(--surface-container);
    border-radius: 24px;
    padding: 24px;
    display: flex;
    gap: 20px;
    transition: all 0.3s ease;
}
.candidate-card:hover {
    background: var(--surface-container-high);
    box-shadow: 0 8px 32px rgba(11, 19, 38, 0.4);
}
```

### Input Fields
```css
.input-field {
    background: var(--surface-container-lowest);
    color: var(--on-surface);
    border: none;
    border-left: 2px solid transparent;
    border-radius: 12px;
    padding: 14px 16px;
    font-size: 14px;
    transition: all 0.3s ease;
}
.input-field:focus {
    background: var(--surface-container-high);
    border-left-color: var(--primary);
    outline: none;
}
/* Search bar variant */
.search-bar {
    background: var(--surface-container);
    border-radius: 24px;
    padding: 12px 20px 12px 44px; /* room for search icon */
    width: 320px;
}
```

### Chips & Badges

#### Skill Chip
```css
.chip {
    background: var(--surface-container-high);
    color: var(--on-surface-variant);
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
}
```

#### AI Pulse Chip (Live Intelligence indicator)
```css
.ai-pulse-chip {
    background: var(--secondary-container);
    color: var(--primary);
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 6px;
}
.ai-pulse-chip::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #4ade80;
    animation: pulse 2s infinite;
}
@keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.3); }
}
```

#### Status Badge
```css
.badge-urgent  { background: rgba(255, 183, 131, 0.15); color: #ffb783; }
.badge-success { background: rgba(74, 222, 128, 0.15); color: #4ade80; }
.badge-warning { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
.badge-error   { background: rgba(248, 113, 113, 0.15); color: #f87171; }
.badge-info    { background: rgba(96, 165, 250, 0.15); color: #60a5fa; }
```

### Score Ring (Circular Progress)
```css
/* Used in candidate insight panel — SVG-based circle */
.score-ring {
    width: 120px;
    height: 120px;
}
.score-ring circle {
    fill: none;
    stroke-width: 8;
    stroke-linecap: round;
}
.score-ring .bg { stroke: var(--surface-container-high); }
.score-ring .progress {
    stroke: url(#gradient-primary);
    transition: stroke-dashoffset 1s ease;
}
.score-value {
    font-size: 36px;
    font-weight: 800;
    fill: var(--on-surface);
}
```

### No-Divider List Rule
```
❌ NEVER: <hr> or border-bottom between list items
✅ ALWAYS: 24px vertical gap OR alternating background shifts
           (surface-container-low ↔ surface-container-lowest)
```

---

## 7. Icons & Badges

### Icon System
- Use **Lucide React** icons (consistent, clean, MIT licensed)
- Icon size: `20px` default, `16px` for inline/compact, `24px` for nav
- Icon color: `var(--on-surface-variant)` default, `var(--primary)` for active

### Avatar System
```css
.avatar {
    width: 48px;
    height: 48px;
    border-radius: 9999px;
    object-fit: cover;
    border: 2px solid var(--surface-container-high);
}
.avatar-sm { width: 32px; height: 32px; }
.avatar-lg { width: 64px; height: 64px; }
.avatar-xl { width: 96px; height: 96px; }

/* Initials fallback */
.avatar-initials {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-container-highest);
    color: var(--primary);
    font-weight: 600;
    font-size: 14px;
}
```

---

## 8. Landing Page — Scroll Animations 🔥

### Animation Library
Use **Intersection Observer API** (native JS, no dependencies) for scroll-triggered animations.
Optionally add `GSAP` or `Framer Motion` (React) for more complex sequences.

### Scroll Animation Spec

#### Section 1: Hero
```
On Load (no scroll needed):
├── Logo + Nav          → fade in from top (0.3s delay)
├── "Hire Smarter,"     → slide up + fade in (0.5s delay, staggered per word)
├── "Not Harder."       → slide up + fade in (0.7s delay)
├── Subtitle text       → fade in (0.9s delay)
├── CTA buttons         → scale up from 0.9 + fade in (1.1s delay)
└── Floating AI card    → slide in from right + slight rotation (1.3s delay)
    (Alex Chen card)      with glassmorphism shimmer effect

Background: Subtle animated gradient mesh (slow color shift #0b1326 ↔ #131b2e ↔ #1a0b30)
Floating particles: Tiny glowing dots drifting slowly (opacity 0.1–0.3)
```

#### Section 2: "Stop Sifting. Start Selecting."
```
On Scroll Into View:
├── Section title       → slide up + fade in
├── "The Old Way" card  → slide in from LEFT (0.2s delay)
│   ├── ❌ items        → stagger fade in (0.1s between each)
│   └── Slight red tint glow on card
├── "The Hirevex Way"   → slide in from RIGHT (0.4s delay)
│   ├── ✓ items         → stagger fade in (0.1s between each)
│   └── Subtle purple glow on card border

Parallax: Cards very slightly shift on scroll (3-5px range, subtle)
```

#### Section 3: "Everything You Need to Hire Elite Talent"
```
On Scroll Into View:
├── Section title       → slide up + fade in
├── Feature cards (6)   → stagger from bottom (0.15s between each)
│   Row 1 (3 cards)     → stagger left-to-right
│   Row 2 (3 cards)     → stagger left-to-right (0.4s after row 1)
│
│   Each card on hover:
│   ├── Scale up 1.03
│   ├── Purple gradient glow appears on top border
│   └── Icon gets primary color + subtle bounce
```

#### Section 4: "How It Works" (Steps 1-2-3-4)
```
On Scroll Into View:
├── Section title       → fade in
├── Step circles        → sequential reveal (each appears 0.3s after previous)
│   ├── Circle scales from 0 → 1 with bounce ease
│   ├── Number fades in
│   └── Connecting line draws itself between circles (CSS animation)
├── Step labels         → slide up under each circle
├── Step descriptions   → fade in below labels
│
│   Each step card:
│   ├── Icon animates (e.g., upload arrow bounces, graph bars grow)
│   └── Mini progress indicator inside card fills up
```

#### Section 5: "Your Pipeline, Reimagined."
```
On Scroll Into View:
├── Title + description → slide in from LEFT
├── Pipeline screenshot → slide in from RIGHT with perspective tilt
│   ├── Starts at rotateY(-5deg) → settles to 0
│   └── Subtle shadow grows during animation
├── Bullet points       → stagger fade in (checkmarks animate ✓)

Parallax: Screenshot moves at 0.8x scroll speed (creates depth)
```

#### Section 6: "Explainable AI Matters."
```
On Scroll Into View:
├── Bar chart graphic   → slides in from LEFT
│   └── Bars animate height from 0 → full (staggered, 0.1s each)
├── Title + text        → slide in from RIGHT
├── Quote card          → fade in + slide up (0.5s delay)
│   └── Glass card with shimmer animation on border

Counter animation: "Skills Score" number counts up from 0 → displayed value
```

#### Section 7: CTA ("Start Hiring Smarter Today.")
```
On Scroll Into View:
├── Title               → Scale from 0.95 → 1 + fade in
├── Subtitle            → Fade in (0.3s delay)
├── Buttons             → Slide up + fade in (0.5s delay)
│   └── Primary button has persistent subtle glow pulse
│
Background: Radial gradient pulse (very slow, 8s cycle)
             Centered glow that breathes #7c87f3 at 5% opacity
```

#### Section 8: Footer
```
On Scroll Into View:
├── All columns         → Fade in (0.3s stagger per column)
├── Divider line        → Draws from left to right
└── Copyright           → Fade in last
```

### CSS Animation Utilities
```css
/* ── BASE ANIMATION CLASSES ── */

/* Initially hidden — add to all scroll-animated elements */
.scroll-animate {
    opacity: 0;
    transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Triggered when in viewport */
.scroll-animate.visible {
    opacity: 1;
    transform: none !important;
}

/* ── DIRECTION VARIANTS ── */
.from-bottom  { transform: translateY(60px); }
.from-top     { transform: translateY(-60px); }
.from-left    { transform: translateX(-80px); }
.from-right   { transform: translateX(80px); }
.from-scale   { transform: scale(0.9); }

/* ── STAGGER DELAYS ── */
.delay-1 { transition-delay: 0.1s; }
.delay-2 { transition-delay: 0.2s; }
.delay-3 { transition-delay: 0.3s; }
.delay-4 { transition-delay: 0.4s; }
.delay-5 { transition-delay: 0.5s; }
.delay-6 { transition-delay: 0.6s; }
.delay-7 { transition-delay: 0.7s; }
.delay-8 { transition-delay: 0.8s; }

/* ── SPECIAL ANIMATIONS ── */

/* Gradient shimmer on glass cards */
@keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
}
.shimmer-border {
    background: linear-gradient(90deg,
        transparent 0%,
        rgba(189, 194, 255, 0.15) 50%,
        transparent 100%
    );
    background-size: 200% 100%;
    animation: shimmer 3s ease infinite;
}

/* Floating particles */
@keyframes float {
    0%, 100% { transform: translateY(0) translateX(0); }
    25%      { transform: translateY(-15px) translateX(5px); }
    50%      { transform: translateY(-5px) translateX(-8px); }
    75%      { transform: translateY(-20px) translateX(3px); }
}

/* Counter number animation */
@keyframes countUp {
    from { --num: 0; }
    to   { --num: var(--target); }
}

/* Line drawing (for "How It Works" connectors) */
@keyframes drawLine {
    from { stroke-dashoffset: 100%; }
    to   { stroke-dashoffset: 0; }
}

/* Gradient background mesh (hero section) */
@keyframes meshShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}
.hero-bg-mesh {
    background: linear-gradient(135deg, #0b1326, #1a0b30, #0b1326, #131b2e);
    background-size: 400% 400%;
    animation: meshShift 15s ease infinite;
}
```

### Intersection Observer Setup (Vanilla JS)
```javascript
// Initialize scroll animation observer
const observerOptions = {
    root: null,          // viewport
    rootMargin: '0px',
    threshold: 0.15      // trigger when 15% visible
};

const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            scrollObserver.unobserve(entry.target); // animate once only
        }
    });
}, observerOptions);

// Observe all scroll-animated elements
document.querySelectorAll('.scroll-animate').forEach(el => {
    scrollObserver.observe(el);
});
```

### React Implementation (with Framer Motion)
```jsx
// useScrollReveal hook
import { useInView } from 'framer-motion';
import { useRef } from 'react';

function ScrollReveal({ children, direction = 'bottom', delay = 0 }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });

    const directions = {
        bottom: { y: 60, x: 0 },
        top:    { y: -60, x: 0 },
        left:   { y: 0, x: -80 },
        right:  { y: 0, x: 80 },
        scale:  { y: 0, x: 0, scale: 0.9 },
    };

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, ...directions[direction] }}
            animate={isInView ? { opacity: 1, y: 0, x: 0, scale: 1 } : {}}
            transition={{
                duration: 0.8,
                delay,
                ease: [0.16, 1, 0.3, 1]
            }}
        >
            {children}
        </motion.div>
    );
}

// Usage
<ScrollReveal direction="bottom" delay={0.2}>
    <FeatureCard />
</ScrollReveal>
```

---

## 9. Page-by-Page Specs

### 📄 Landing Page (`/`)
**Mockup:** `hirevex_landing_page.png`

| Section | Content |
|---------|---------|
| **Navbar** | Logo, Platform/Solutions/Resources/Pricing, Sign In, "Get Started" CTA |
| **Hero** | "Hire Smarter, Not Harder." + floating Alex Chen AI card |
| **Old vs New** | "Stop Sifting. Start Selecting." — two comparison cards |
| **Features Grid** | 6 feature cards (2 rows × 3) |
| **How It Works** | 4 numbered steps with connecting line |
| **Pipeline Showcase** | Split — text left, pipeline screenshot right |
| **Explainable AI** | Split — chart left, text + quote right |
| **CTA** | "Start Hiring Smarter Today." with two buttons |
| **Footer** | 4-column: About, Product, Company, Contact |

**Special Effects:** Animated gradient mesh hero bg, floating particles, scroll-triggered section reveals

---

### 🏠 Home / Dashboard (`/dashboard`)
**Mockup:** `home_page.png`

| Element | Details |
|---------|---------|
| **Welcome** | "Welcome back, {name}" + subtitle |
| **Quick Pulse** | 3 stat cards (New Matches, Interviews, Offer Pending) |
| **AI Recommendation** | Large floating card — "Recommend Action: Invite Sarah Chen" with avatar, match %, action buttons |
| **Company Updates** | Right sidebar — Feature updates, hiring trends |
| **Quick Stats** | Right sidebar — Avg Time to Hire, Diversity Index |
| **Recently Viewed** | Job cards and candidate previews |

---

### 📊 Command Center (`/command-center`)
**Mockup:** `command_center.png`

| Element | Details |
|---------|---------|
| **Pipeline Health** | Bar chart + key metrics (Active Candidates, Interview Rate, Time to Hire, Offer Accept) |
| **Attention Needed** | Urgent job cards (stalled pipelines) |
| **Top Candidates** | 3 AI-ranked candidate cards with "Why?" explanations, skill tags, "Review Profile" CTA |
| **New Requisition** | FAB button bottom-right |
| **Low Confidence** | Table of candidates needing human review (ambiguity reason, approve/reject) |

---

### 💼 Jobs / Active Pipelines (`/jobs`)
**Mockup:** `job_management.png`

| Element | Details |
|---------|---------|
| **Header** | "Active Pipelines" + Upload Resumes / Create New Job buttons |
| **Featured Job** | Large card with AI match analysis (Gold Tier / Strong Match / Review Needed counts) |
| **Job Grid** | Cards with department tag, title, location, salary, progress bar, candidate count |
| **Talent Velocity** | Stats card — Avg Time to Hire, Acceptance Rate |
| **AI Insight** | Quote card with AI observation |

---

### 🎯 Decision Board (`/decision-board`)
**Mockup:** `candidate_decision_board.png`

| Element | Details |
|---------|---------|
| **Header** | "Decision Board" + view toggle (Grid/Hybrid List) + Smart Filters |
| **Selection Bar** | "3 Candidates Selected" + "Run Comparison Matrix" button |
| **Candidate Rows** | Full-width cards: avatar, name, title, expertise chips, match score bar (%), parsing confidence, strengths/weaknesses, salary range, stage badge, "View Profile" CTA |
| **Pagination** | "Page 1 of 4" with number buttons |
| **Footer** | Process Health indicator + "Export Report" |

---

### 🔍 Candidate Insight Panel (`/candidates/:id`)
**Mockup:** `candidate_insight_panel.png`

| Element | Details |
|---------|---------|
| **Left Panel** | Avatar, name, title, experience, executive summary, technical skills (chips), experience timeline |
| **Intelligence Canvas** | "WHY THIS CANDIDATE?" — large editorial-style AI explanation with highlighted keywords |
| **HireVex Score** | Circular ring (0-100) + "Top X% of global pool" |
| **Strength Matrix** | Per-skill progress bars with percentage |
| **Cognitive Blindspots** | Warning card — areas of concern |
| **Resume Optimization** | Suggestion card |
| **Tailored Interview Script** | Category-based questions (Architecture Depth, etc.) |

---

### 📋 Interactive Pipeline (`/pipeline`)
**Mockup:** `interactive_pipeline.png`

| Element | Details |
|---------|---------|
| **Header** | Breadcrumb (Department / Job Title), "Interactive Pipeline", Filter by Fit + Add Candidate |
| **Kanban Columns** | SCREENING → TECHNICAL → INTERVIEW → DECISION → OFFER (with counts) |
| **Candidate Cards** | Avatar, name, company, experience, skill chips, fit %, drag handle |
| **Hover Detail** | Expanded card with Co-pilot Verdict quote + action buttons |
| **Drag & Drop** | Full drag-and-drop between columns |

---

### ⚖️ Decision Matrix / Comparison (`/compare`)
**Mockup:** `decision_matrix.png`

| Element | Details |
|---------|---------|
| **Header** | Job title + requisition number |
| **Co-pilot Summary** | Glass card — AI comparison summary |
| **Candidate Columns** | 3 candidates side-by-side: avatar, name, title |
| **AI Recommended** | Badge on top candidate |
| **Comparison Rows** | Overall Match Score (ring), skill evaluation (EXCEPTIONAL/STRONG/PROFICIENT cards), star ratings, budget alignment (salary chips) |
| **Strategic AI** | Growth Potential card, Retention Risk card |
| **Actions** | Share Report, Export PDF, Request Feedback, "EXTEND OFFER" CTA |

---

### 📩 Outreach Panel (`/outreach`)
**Mockup:** `outreach_panel.png`

| Element | Details |
|---------|---------|
| **Left Panel** | Active Pipeline count, search, candidate list with match % + status |
| **Center Panel** | Email composer — subject, body, "Send Email" + "Open WhatsApp" buttons |
| **Right Panel** | AI Co-pilot suggestions, recommended additions (insertable), Tone Profile (bar charts), candidate context (education, work history) |

---

### 🎓 Candidate Portal (`/portal`)
**Mockup:** `candidate_portal.png`

| Element | Details |
|---------|---------|
| **Header** | "Optimize your next career move." with gradient text |
| **Left Side** | Resume Upload (drag & drop) + Target Role (paste JD textarea) + "Analyze Alignment" CTA |
| **Right Side** | AI Match Score (large number), Strategic Gaps, Interview Simulator (Behavioral + Technical questions) |
| **Bottom** | Social proof banner — "Empowering 10k+ Career Moves" |

---

## 10. Motion & Micro-Interactions

### Global Transitions
```css
/* Default transition for all interactive elements */
* { transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.3s ease; }
```

### Hover Effects
| Element | Effect |
|---------|--------|
| Cards | `translateY(-2px)` + shadow increase |
| Buttons (primary) | `translateY(-2px)` + glow increase |
| Buttons (ghost) | Subtle bg tint appear |
| Nav items | Background shift to `surface-container-highest` |
| Candidate cards | Slight scale (1.01) + bg shift |
| Chips | Brightness increase (filter: brightness(1.15)) |

### Loading States
```css
/* Skeleton loading */
.skeleton {
    background: linear-gradient(90deg,
        var(--surface-container-low) 25%,
        var(--surface-container) 50%,
        var(--surface-container-low) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s infinite;
    border-radius: 12px;
}
@keyframes skeleton-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
```

### Kanban Drag Feedback
```css
/* Card being dragged */
.dragging {
    opacity: 0.7;
    transform: rotate(2deg) scale(1.02);
    box-shadow: 0 16px 48px rgba(11, 19, 38, 0.6);
    z-index: 1000;
}
/* Drop zone highlight */
.drop-zone-active {
    background: rgba(189, 194, 255, 0.04);
    border: 2px dashed rgba(189, 194, 255, 0.15);
    border-radius: 24px;
}
```

---

## 11. Responsive Breakpoints

```css
/* Desktop-first approach */
--bp-xl:  1440px;   /* Large desktop */
--bp-lg:  1200px;   /* Standard desktop */
--bp-md:  900px;    /* Tablet landscape */
--bp-sm:  640px;    /* Tablet portrait */
--bp-xs:  480px;    /* Mobile */
```

| Breakpoint | Layout Changes |
|-----------|----------------|
| `> 1200px` | Full layout — sidebar + main + optional right panel |
| `900–1200px` | Sidebar collapses to icons only (60px), right panel stacks below |
| `640–900px` | Sidebar becomes top/bottom nav, single column |
| `< 640px` | Full mobile — hamburger menu, stacked cards, full-width buttons |

---

## 12. Do's & Don'ts

### ✅ Do
- Use `rounded-xl` (24px) for all primary containers
- Use generous whitespace (32px+ between sections)
- Use `tertiary` (#ffb783) **sparingly** for "Urgent" or "High Match"
- Use tonal depth (background shifts) to create hierarchy
- Use glassmorphism for AI-generated content
- Make AI insights the visual hero of every page
- Animate on scroll — the page should feel alive
- Use stagger delays for groups of elements

### ❌ Don't
- Use pure black (`#000`) or pure white (`#fff`) — all neutrals are tinted
- Use 1px borders to separate content — let color shifts do the work
- Use sharp corners — everything is rounded and approachable
- Clutter the screen — if it's not "intelligent," it's not a floating card
- Use flat CTA buttons — always gradient or glow
- Over-animate — animations should be smooth, not bouncy/flashy
- Use shadows without tinting — shadows are deep indigo tinted

---

## 13. CSS Variables Reference (Copy-Paste Ready)

```css
:root {
    /* ── SURFACES ── */
    --surface:                    #0b1326;
    --surface-container-lowest:   #0f1729;
    --surface-container-low:      #131b2e;
    --surface-container:          #1a2236;
    --surface-container-high:     #222a3f;
    --surface-container-highest:  #2d3449;

    /* ── PRIMARY ── */
    --primary:                    #bdc2ff;
    --primary-container:          #7c87f3;
    --on-primary:                 #1a1b2e;

    /* ── SECONDARY ── */
    --secondary:                  #c5c0d0;
    --secondary-container:        #3e3850;

    /* ── TERTIARY ── */
    --tertiary:                   #ffb783;
    --tertiary-container:         #6b4020;

    /* ── TEXT ── */
    --on-surface:                 #e4e1e9;
    --on-surface-variant:         #c8c5d0;

    /* ── STATUS ── */
    --success:                    #4ade80;
    --warning:                    #fbbf24;
    --error:                      #f87171;
    --info:                       #60a5fa;

    /* ── SPECIAL ── */
    --outline-variant:            #49454f;

    /* ── TYPOGRAPHY ── */
    --font-family:                'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

    /* ── SPACING ── */
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 12px;
    --space-lg: 16px;
    --space-xl: 24px;
    --space-2xl: 32px;
    --space-3xl: 48px;
    --space-4xl: 64px;
    --space-5xl: 96px;

    /* ── RADIUS ── */
    --radius-sm:   8px;
    --radius-md:   12px;
    --radius-lg:   16px;
    --radius-xl:   24px;
    --radius-full: 9999px;

    /* ── TRANSITIONS ── */
    --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
    --transition-fast: 0.2s var(--ease-out-expo);
    --transition-base: 0.3s var(--ease-out-expo);
    --transition-slow: 0.8s var(--ease-out-expo);
}
```

---

## 📎 Mockup File Reference

| File | Page | Key Features |
|------|------|-------------|
| `hirevex_landing_page.png` | Landing / Marketing | Hero, features, pipeline showcase, CTA |
| `home_page.png` | Dashboard Home | Welcome, quick pulse, AI recommendation |
| `command_center.png` | Command Center | Pipeline health, top candidates, attention needed |
| `job_management.png` | Jobs | Active pipelines, job cards, talent velocity |
| `candidate_decision_board.png` | Decision Board | Ranked candidates, filtering, comparison trigger |
| `candidate_insight_panel.png` | Candidate Detail | Full AI analysis, scores, interview script |
| `interactive_pipeline.png` | Pipeline Kanban | Drag-drop columns, candidate cards |
| `decision_matrix.png` | Comparison Matrix | Side-by-side, AI strategic analysis |
| `outreach_panel.png` | Outreach | Email composer, AI suggestions, WhatsApp |
| `candidate_portal.png` | Candidate Portal | Resume upload, match score, interview prep |

---

> **HOW TO USE THIS FILE:** Feed this document + the mockup PNGs to any AI tool or developer. It contains every design decision, animation spec, color value, and component pattern needed to build HireVex pixel-perfect.
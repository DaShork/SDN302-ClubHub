# UI GUIDELINES

## Design Philosophy

ClubHub FPTU follows a modern, technology-oriented, community-focused design language.

The interface should feel:

* Modern
* Professional
* Student-Friendly
* Technology-Oriented
* Clean and Organized
* Easy to Navigate

The design is inspired by modern gaming dashboards, SaaS platforms, and community management systems while maintaining an academic and professional appearance suitable for FPT University.

---

# Color System

## Primary Colors

Used for:

* Navbar
* Sidebar
* Hero Sections
* Footer
* Major Backgrounds

```css
#06231D
#0E4B43
#16685D
#223148
```

---

## Secondary Colors

Used for:

* Text
* Neutral Backgrounds
* Card Content

```css
#F4F1EA
#E8E2D8
#D2C7B8
#FFFFFF
```

---

## Accent Colors

### Green Accent

Used for:

* Primary Buttons
* Success States
* Call-to-Action Elements
* Active Status

```css
#22C55E
#4ADE80
#86EFAC
```

### Blue Accent

Used for:

* AI Features
* Knowledge Base
* Information Elements

```css
#3B82F6
#60A5FA
```

---

## Semantic Colors

### Success

```css
#22C55E
```

### Warning

```css
#F59E0B
```

### Danger

```css
#EF4444
```

### Info

```css
#3B82F6
```

---

# Gradient System

## Primary Gradient

Used for:

* Hero Sections
* Large Background Areas

```css
linear-gradient(
135deg,
#06231D 0%,
#223148 100%
)
```

---

## Button Gradient

Used for:

* Primary Buttons
* CTA Components

```css
linear-gradient(
90deg,
#0E4B43 0%,
#22C55E 100%
)
```

---

## AI Gradient

Used for:

* AI Assistant
* Chat Interface
* AI Feature Highlights

```css
linear-gradient(
90deg,
#0E4B43 0%,
#3B82F6 100%
)
```

---

# Typography

## Font Family

Primary Font:

```text
Helvetica
```

Fallback:

```css
font-family:
Helvetice,
system-ui,
sans-serif;
```

---

## Heading Scale

### H1

```css
48px
font-weight: 700
```

### H2

```css
36px
font-weight: 700
```

### H3

```css
28px
font-weight: 600
```

### H4

```css
24px
font-weight: 600
```

---

## Body Text

```css
16px
font-weight: 400
line-height: 1.6
```

---

## Small Text

```css
14px
font-weight: 400
```

---

# Spacing System

Use only these spacing values:

```text
4
8
12
16
24
32
48
64
96
```

Equivalent Tailwind classes:

```text
1
2
3
4
6
8
12
16
24
```

---

# Border Radius

## Cards

```css
16px
```

## Buttons

```css
12px
```

## Inputs

```css
12px
```

## Avatars

```css
999px
```

---

# Shadow System

## Card Shadow

```css
0 8px 32px rgba(0,0,0,0.15)
```

## Hover Shadow

```css
0 12px 40px rgba(34,197,94,0.20)
```

---

# Layout System

## Container Width

```css
max-width: 1280px;
margin: auto;
padding: 0 24px;
```

---

## Page Structure

Every page should follow:

```text
Navbar

Hero Section (optional)

Page Content

Footer
```

---

# Navigation

## Navbar

Height:

```css
80px
```

Background:

```css
rgba(6,35,29,0.95)
```

Menu:

```text
Home
Clubs
Events
Knowledge Base
AI Assistant
Announcements
Profile
```

---

# Hero Sections

Hero sections should contain:

### Left Side

```text
Title
Subtitle
Description
Primary CTA
Secondary CTA
```

### Right Side

```text
Illustration
Club Images
Student Activities
Event Banners
```

---

# Cards

Cards are the primary UI pattern throughout the system.

## Card Style

```css
background: #0D1824;
border-radius: 16px;
border: 1px solid rgba(255,255,255,0.05);
```

---

## Hover Effect

```css
transform: translateY(-4px);
transition: all 0.3s ease;
```

---

# Buttons

## Primary Button

Style:

```text
Green Gradient
White Text
Rounded
```

Examples:

```text
Join Club
View Details
Create Event
Ask AI
```

---

## Secondary Button

Style:

```text
Transparent Background
Green Border
Green Text
```

---

## Danger Button

Style:

```text
Red Background
White Text
```

Examples:

```text
Delete
Remove Member
```

---

# Forms

All forms should use:

```text
Rounded Inputs
Consistent Spacing
Clear Labels
Validation Messages
```

Input Height:

```css
48px
```

---

# Status Badges

## Club Status

```text
Active
Recruiting
Inactive
```

---

## Event Status

```text
Upcoming
Ongoing
Finished
Cancelled
```

---

## User Role Badges

```text
Student
Club Member
Club Leader
IC-PDP
Admin
```

---

# Dashboard Components

Used for:

* Admin Dashboard
* IC-PDP Dashboard

Metrics Cards:

```text
Total Clubs
Total Members
Active Events
Knowledge Articles
Alumni Members
```

---

# AI Assistant Design

The AI Assistant should have a unique visual identity.

## User Message

Background:

```css
#22C55E
```

Text:

```css
#FFFFFF
```

---

## AI Message

Background:

```css
#223148
```

Text:

```css
#FFFFFF
```

---

## Chat Container

Background:

```css
#0B1220
```

---

# Shared Components

The following components must be reusable:

```text
Button
Input
Textarea
Select
Modal
Drawer
Badge
Avatar
Toast
Loader
Pagination
```

---

# Business Components

```text
ClubCard
ClubGrid

EventCard
EventTimeline

AnnouncementCard

KnowledgeCard

MemberCard

AlumniCard

ChatBubble
```

---

# Responsive Design

The application must support:

```text
Mobile
Tablet
Desktop
```

Breakpoints:

```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

---

# Design Tokens

## Colors

### Primary

| Name | Value |
|--------|--------|
| primary-900 | #06231D |
| primary-800 | #0E4B43 |
| primary-700 | #16685D |
| primary-600 | #223148 |

### Secondary

| Name | Value |
|--------|--------|
| secondary-100 | #F4F1EA |
| secondary-200 | #E8E2D8 |
| secondary-300 | #D2C7B8 |

### Accent

| Name | Value |
|--------|--------|
| accent-green | #22C55E |
| accent-green-light | #4ADE80 |
| accent-blue | #3B82F6 |

### Semantic

| Name | Value |
|--------|--------|
| success | #22C55E |
| warning | #F59E0B |
| danger | #EF4444 |
| info | #3B82F6 |

---

# Tailwind Mapping

## Background

bg-primary-900
bg-primary-800
bg-primary-700

## Text

text-secondary-100
text-secondary-200

## Accent

text-accent-green
text-accent-blue

## Border

border-primary-800
border-accent-green

## Buttons

Primary Button

bg-gradient-to-r
from-primary-800
to-accent-green

Secondary Button

border
border-accent-green
text-accent-green

---

# Shadcn Theme

Background:
#06231D

Foreground:
#F4F1EA

Primary:
#22C55E

Secondary:
#223148

Destructive:
#EF4444

Border:
rgba(255,255,255,0.08)

Radius:
16px

---

# Component Rules

## Buttons

Primary:
Green Gradient

Secondary:
Transparent + Green Border

Danger:
Red Background

## Cards

Background:
#0D1824

Radius:
16px

Border:
1px solid rgba(255,255,255,0.05)

Hover:
translateY(-4px)

## Inputs

Height:
48px

Radius:
12px

Background:
#223148

# Accessibility

Requirements:

* Keyboard Navigation
* Visible Focus States
* Proper Contrast Ratios
* Semantic HTML
* Accessible Forms

---

# Design Principles

Always prioritize:

1. Clarity over complexity.
2. Consistency across all pages.
3. Reusable components.
4. Responsive layouts.
5. Fast user interaction.
6. Readability of information.
7. Professional appearance suitable for FPT University.

Avoid:

* Excessive animations.
* Multiple accent colors in one component.
* Overly complex layouts.
* Inconsistent spacing.
* Unnecessary visual effects.

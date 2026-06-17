# AGENTS.md

# ClubHub FPTU

## 1. Project Overview

ClubHub is a centralized club management platform for FPT University.

Main objectives:

* Centralize club information.
* Preserve knowledge between club generations.
* Improve communication between IC-PDP and club members.
* Support alumni networking.
* Provide AI-powered knowledge search.

The project is developed as an MVP for SDN302.

Timeline:

2 weeks.

Team size:

4 frontend developers.

Priority:

Working MVP over perfect architecture.

---

## 2. Technology Stack

Frontend:

* React
* Vite
* JavaScript (JSX)
* TailwindCSS
* Shadcn UI

Backend:

* Supabase

Database:

* PostgreSQL

Authentication:

* Supabase Auth

Storage:

* Supabase Storage

Deployment:

* Vercel

AI:

* OpenAI API

---

## 3. Core Modules

Authentication

Club Directory

Event Management

Knowledge Base

AI Assistant

Alumni Directory

Announcement Center

---

## 4. User Roles

Student

Club Member

Club Leader

IC-PDP

---

## 5. Architecture Rules

Always follow:

Page
→ Service
→ Supabase

Never:

Page
→ Supabase directly

All database access must be inside services.

Example:

services/

clubService.js

eventService.js

authService.js

---

## 6. Folder Structure

src/

components/

pages/

services/

hooks/

contexts/

layouts/

routes/

utils/

---

## Project Structure

This project follows Page-Based Architecture.

Each page owns:

- Page component
- Page styles
- Page-specific components

Shared reusable components are stored in:

shared/components

All Supabase calls must go through:

shared/services

Do not create global components unless they are reused by at least 2 pages.

---

## 7. React Standards

Use:

* Functional Components
* React Hooks
* Custom Hooks

Avoid:

* Class Components
* Large Components (>300 lines)

One component should have one responsibility.

---

## 8. UI Guidelines

Style:

Modern

Minimal

Student Friendly

Mobile Responsive

Primary Color:

#06231D

Secondary Color:

#F4F1EA

Accent:

#22C55E

---

## 9. Development Workflow

Create feature branch:

feature/auth

feature/club

feature/event

feature/knowledge

Use Pull Request before merge.

Never commit directly to main.

---

## 10. AI Instructions

Before making changes:

1. Read AGENTS.md.
2. Follow existing architecture.
3. Follow existing folder structure.
4. Reuse existing components whenever possible.
5. Avoid introducing new dependencies.
6. Keep solutions simple.
7. Generate production-ready code.
8. Explain important decisions.

If requirements are unclear:

Ask questions before implementing.

Do not redesign the architecture without approval.

Do not generate files that are not necessary.

MVP completion is more important than engineering perfection.

## Cursor Instructions

Always read this file before generating code.
This file is the single source of truth for the project.
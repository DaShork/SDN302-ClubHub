# AGENTS.md

# ClubHub FPTU

## 1. Project Overview

ClubHub is a centralized club management platform for FPT University.

Main objectives:

- Centralize club information.
- Preserve knowledge between club generations.
- Support IC-PDP in managing clubs.
- Improve student access to club information.
- Provide an AI Assistant powered by OpenAI using the Club Knowledge Base.

The project is developed as an MVP for SDN302.

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

## 3. Architecture Pattern

- Modular Monolith
- Domain-based modules
- RESTful API
- React Frontend
- Supabase Backend Services
- PostgreSQL Database
- OpenAI API Integration

No Microservices.
No Event Bus.
No Message Queue.
No Redis.
No Docker is required for development.

## 4. Core Modules

Business Modules

- Auth
- Club
- Member
- Event
- Announcement
- Knowledge
- Workshop
- Finance
- Alumni
- Profile
- AI Assistant

---

## 5. User Roles

Student

Club Member

Club Leader

IC-PDP

---

## 6. Architecture Rules

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

When generating code:

Always follow the Modular Monolith architecture.

Never generate microservices.

Never generate multiple independent backend applications.

Each business domain must be implemented as a module inside the same backend application.

Modules communicate internally through services instead of HTTP.

## Cursor Instructions

Always read this file before generating code.
This file is the single source of truth for the project.
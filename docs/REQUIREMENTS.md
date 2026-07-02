# ClubHub Requirements

> Version: 1.0 (MVP)
> Last Updated: June 2026

---

# Project Information

## Project Name

**ClubHub – FPT University Club Management Platform**

---

## Project Description

ClubHub is a centralized web platform developed for FPT University to support club management, knowledge preservation, member engagement, and communication between clubs and IC-PDP.

The platform provides a unified system where students can explore clubs, members can access internal resources, club leaders can manage club operations, and university staff can monitor club activities.

ClubHub also integrates an AI Assistant to help users quickly retrieve information from the club knowledge base.

---

# Problem Statement

Currently, information related to student clubs is scattered across multiple platforms such as:

- Facebook
- Discord
- Google Drive
- Google Forms
- Internal communication channels

This causes several issues.

### For Students

- Difficult to discover clubs
- Difficult to find recruitment information
- Difficult to access learning materials
- Difficult to follow upcoming events
- Difficult to communicate with clubs

### For Club Members

- Internal resources are not centralized
- Workshop materials are difficult to access
- Meeting minutes are easily lost

### For Club Leaders

- Club knowledge is not preserved
- Experiences from previous generations are lost
- Event reports are scattered
- Member information is difficult to manage
- Club fund tracking is inconsistent

### For IC-PDP

- Difficult to monitor all clubs
- Communication is fragmented
- Club reports are inconsistent
- Alumni information is difficult to maintain

---

# Business Objectives

ClubHub aims to:

1. Centralize club information.
2. Centralize club events.
3. Preserve knowledge across club generations.
4. Improve communication between IC-PDP and clubs.
5. Provide AI-powered knowledge search.
6. Build a searchable alumni directory.
7. Support digital transformation for student clubs.
8. Improve information accessibility for all members.

---

# Project Scope

## In Scope (MVP)

### Authentication

- Email & Password Login
- Google OAuth (via Supabase)
- Profile Management

### Club Directory

- Browse Clubs
- Search Clubs
- Filter Clubs
- Club Details
- Recruitment Information

### Club Membership

- Internal Announcements
- Member-only Resources
- Workshop Materials
- Meeting Minutes

### Event Management

- Event List
- Event Registration
- QR Check-in
- Event Management

### Knowledge Base

- Knowledge Articles
- Meeting Minutes
- Event Reflection
- Club Documents

### AI Assistant

- Knowledge Search
- Question Answering
- Club Information Assistant

### Announcement Center

- Public Announcements
- Internal Announcements

### Financial Management

- Club Fee Management
- Sandbox Payment
- Payment History

### Alumni Directory

- Alumni Search
- Alumni Profile

### Gallery

- Club Images
- Event Gallery

### Reports

- Attendance Report
- Member Statistics
- Event Statistics

---

## Out of Scope (Future Versions)

The following features are intentionally excluded from the MVP.

- Online Recruitment Portal
- Interview Workflow
- CV Submission
- Mobile Application
- Real-time Chat
- Email Automation
- Push Notifications
- Real Payment Gateway
- Club Marketplace

---

# User Roles

The system supports six official roles.

## Student

Can browse public information and use AI Assistant.

---

## Club Member

Can access internal club resources after joining a club.

---

## Club Leader

Can manage club operations, members, events, workshops, announcements, and knowledge.

---

## Mentor

Can supervise assigned clubs and provide recommendations.

---

## Manager

Represents IC-PDP staff responsible for managing all clubs.

---

## Administrator

Has full system administration privileges.

---

# Functional Requirements

## FR-01 Authentication

The system shall authenticate users using Supabase Authentication.

Supported methods:

- Email & Password
- Google OAuth

---

## FR-02 Club Management

The system shall allow users to:

- Browse clubs
- Search clubs
- Filter clubs
- View club details

Club Leaders shall manage club information.

---

## FR-03 Membership Management

Club Leaders shall:

- Add members
- Remove members
- Update member roles

Members shall access internal resources.

---

## FR-04 Event Management

The system shall:

- Display events
- Allow event registration
- Support QR Check-in

Club Leaders shall manage events.

---

## FR-05 Workshop Management

Club Leaders shall:

- Create workshops
- Upload workshop materials

Members shall:

- View workshop resources

---

## FR-06 Knowledge Management

Club Leaders shall:

- Create knowledge articles
- Upload documents
- Upload meeting minutes
- Create event reflections

Members shall browse knowledge resources.

---

## FR-07 Announcement Management

Managers and Club Leaders shall publish announcements.

Users shall receive announcements based on permissions.

---

## FR-08 Financial Management

The system shall support:

- Club Fee Management
- Sandbox Payment
- Payment History

No real payment gateway shall be used.

---

## FR-09 AI Assistant

The AI Assistant shall:

- Search club knowledge
- Answer questions
- Retrieve relevant documents

The AI shall answer only from available knowledge resources.

---

## FR-10 Alumni Directory

Users shall:

- Search alumni
- View alumni profiles

---

# Non-functional Requirements

## Performance

- Average response time < 2 seconds
- Support at least 500 concurrent users

---

## Security

- Authentication via Supabase Auth
- Role-Based Access Control (RBAC)
- Row Level Security (RLS)
- HTTPS only

---

## Availability

The system should be available 24/7 except scheduled maintenance.

---

## Maintainability

- Modular architecture
- Reusable components
- Clear folder structure
- Consistent coding standards

---

## Scalability

The architecture shall support future expansion without major redesign.

---

# Success Criteria

The project is considered successful when:

- Students can discover clubs easily.
- Club leaders can manage club information efficiently.
- Knowledge is preserved between club generations.
- IC-PDP can monitor club activities.
- AI Assistant provides relevant answers.
- Sandbox payment is operational.
- The system is deployed successfully.
- Users can use the platform without critical issues.

---

# Technical Constraints

Frontend

- React
- Vite
- JSX

Backend Platform

- Supabase

Database

- PostgreSQL

Authentication

- Supabase Auth

Storage

- Supabase Storage

Payment

- Sandbox Only

AI

- OpenAI API

Deployment

- Vercel

---

# Assumptions

- Every user has an FPT University email.
- A student may belong to multiple clubs.
- Recruitment applications are handled outside the system.
- Club membership is managed manually by Club Leaders.
- AI responses depend on uploaded knowledge resources.
- Sandbox payment is sufficient for academic purposes.

---

# Future Enhancements

Potential future improvements include:

- Online recruitment workflow
- Mobile application
- Email notifications
- Real payment gateway
- Chat system
- Calendar synchronization
- Recommendation system for clubs
- Advanced analytics dashboard

---

# Version

Current Version: **1.0 (MVP)**
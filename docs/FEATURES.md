# ClubHub Features

> Version: 1.0 (MVP)
> Last Updated: June 2026

---

# Overview

ClubHub is a centralized club management platform developed for FPT University.

The platform focuses on:

- Centralizing club information
- Preserving club knowledge across generations
- Supporting IC-PDP in club governance
- Providing AI-powered knowledge search
- Managing club members and activities

---

# Authentication

ClubHub uses **Supabase Authentication**.

Supported authentication methods:

- Email & Password
- Google OAuth (handled by Supabase Auth)

Authentication is performed exclusively through Supabase.

After successful authentication, user information and permissions are loaded from the `profiles` table.

Features:

- Login
- Logout
- Forgot Password
- Update Profile
- Update Avatar

---

# General Features

## Club Directory

Students can:

- Browse Clubs
- Search Clubs
- Filter Clubs
- View Club Details
- View Executive Board
- View Club Gallery
- View Recruitment Information

---

## Event Center

Users can:

- View Event List
- View Event Details
- Register for Events
- QR Check-in (Members)

---

## Announcement Center

Users can:

- View Announcements

Authorized users can:

- Create Announcement
- Edit Announcement
- Delete Announcement

---

## Workshop Center

Members can:

- View Workshop List
- View Workshop Materials
- Download Resources

Club Leaders can:

- Create Workshops
- Upload Materials
- Update Workshop Information

---

## Knowledge Base

Members can:

- Browse Knowledge Articles
- View Knowledge Details
- Search Knowledge

Club Leaders can:

- Create Articles
- Update Articles
- Delete Articles
- Upload Attachments
- Create Event Reflection
- Upload Meeting Minutes

---

## Gallery

Users can:

- View Club Gallery

Club Leaders can:

- Upload Images
- Delete Images

---

## Document Center

Members can:

- Download Documents

Club Leaders can:

- Upload Documents
- Manage Documents

---

## Club Fund

Members can:

- View Club Fee
- View Payment History
- Pay Club Fee (Sandbox)

Club Leaders can:

- Record Payments
- Update Payment Status

---

## Alumni Directory

Users can:

- Search Alumni
- View Alumni Profiles

---

## AI Assistant

Users can:

- Ask Questions
- Search Knowledge
- Receive AI-generated Answers

Knowledge Sources:

- Club Information
- Knowledge Articles
- Meeting Minutes
- Workshop Materials
- Announcements
- Event Reflection

---

# Role-based Features

---

# Student

Students can:

### Authentication

- Login
- Logout
- Update Profile

### Club Discovery

- Browse Clubs
- Search Clubs
- Filter Clubs
- View Club Details
- View Recruitment Information
- View Executive Board
- View Gallery

### Events

- View Events
- Register for Events

### Announcements

- View Announcements

### AI Assistant

- Ask Questions
- Search Knowledge

---

# Club Member

Club Members inherit all Student permissions.

Additional permissions:

### Internal Content

- View Internal Announcements
- View Workshop Materials
- Download Club Resources
- View Meeting Minutes
- Access Knowledge Base

### Finance

- View Club Fee
- Pay Club Fee (Sandbox)
- View Payment History

### Events

- QR Check-in
- Register for Internal Events

---

# Club Leader

Club Leaders inherit all Club Member permissions.

### Dashboard

- View Statistics
- Member Count
- Event Statistics
- Payment Summary

### Club Management

- Update Club Information
- Update Recruitment Information
- Manage Gallery

### Member Management

- Add Member
- Remove Member
- Update Member Role

### Event Management

- Create Event
- Update Event
- Delete Event

### Workshop Management

- Create Workshop
- Update Workshop
- Delete Workshop

### Knowledge Management

- Create Knowledge Article
- Update Knowledge Article
- Delete Knowledge Article
- Upload Documents
- Upload Meeting Minutes
- Create Event Reflection

### Announcement Management

- Create Announcement
- Update Announcement
- Delete Announcement

### Finance

- Record Club Fee
- Update Payment Status

### Reports

- Attendance Report
- Event Statistics
- Member Statistics

---

# Mentor

Mentors supervise assigned clubs.

Permissions:

- View Club Dashboard
- View Knowledge Base
- View Workshop Materials
- View Event Reflection
- View Reports
- Comment on Knowledge
- Provide Recommendations

Mentors cannot:

- Manage Members
- Manage Payments
- Delete Club Resources

---

# Manager

Managers represent IC-PDP staff.

Permissions:

- Manage Clubs
- Manage Club Categories
- Monitor Club Activities
- View Reports
- Publish Announcements
- Assign Mentors
- Manage Club Leaders
- Archive Clubs

---

# Administrator

Administrators have full system access.

Permissions:

- Manage Users
- Manage Roles
- Manage Permissions
- Manage Categories
- Manage AI Configuration
- Manage System Configuration
- View Audit Logs
- Manage Platform Settings

---

# Future Features (Not Included in MVP)

The following features are intentionally excluded from the MVP.

- Online Recruitment Portal
- Interview Workflow
- CV Upload
- Email Automation
- Mobile Application
- Real Payment Gateway
- Club Chat System
- Push Notifications

---

# Technical Notes

Authentication

- Supabase Authentication

Database

- Supabase PostgreSQL

Storage

- Supabase Storage

Payment

- Sandbox Only

AI

- OpenAI API

Authorization

- Role-Based Access Control (RBAC)

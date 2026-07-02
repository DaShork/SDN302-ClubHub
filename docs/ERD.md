# ClubHub Entity Relationship Design (ERD)

> Version: 1.0 (MVP)
> Last Updated: June 2026

---

# Overview

ClubHub uses **Supabase Authentication** for user authentication.

The system stores authentication information inside `auth.users`.

Additional user information is stored in the `profiles` table.

The database follows a relational model based on PostgreSQL.

---

# Database Overview

```
auth.users
      │
      ▼
profiles
      │
      ├──────────────┐
      │              │
memberships     notifications
      │
      ├──────────────┐
      ▼              ▼
clubs         attendance
      │
      ├──────────────┐
      │              │
events      knowledge_articles
      │              │
      │              ├──── documents
      │              └──── meeting_minutes
      │
      ├──── workshops
      │
      ├──── announcements
      │
      ├──── galleries
      │
      └──── club_terms

memberships
      │
      ├──── payments
      │
      └──── alumni

chat_history

roles

categories
```

---

# Entities

## auth.users

Managed by Supabase Authentication.

No modification by application.

---

## profiles

Stores additional user information.

| Field | Type |
|------|------|
| id | UUID (PK, FK auth.users.id) |
| full_name | VARCHAR |
| student_code | VARCHAR |
| email | VARCHAR |
| avatar_url | TEXT |
| role_id | UUID |
| faculty | VARCHAR |
| major | VARCHAR |
| phone | VARCHAR |
| status | VARCHAR |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

Relationships

- belongs to Role
- has many Memberships
- has many Notifications
- has many Chat History

---

## roles

Stores system roles.

| Field | Type |
|------|------|
| id | UUID |
| name | VARCHAR |

Default Roles

- Student
- Club Member
- Club Leader
- Mentor
- Manager
- Administrator

---

## categories

Club categories.

| Field | Type |
|------|------|
| id | UUID |
| name | VARCHAR |
| description | TEXT |

Examples

- Academic
- Technology
- Sports
- Arts
- Volunteer
- Culture

---

## clubs

Stores club information.

| Field | Type |
|------|------|
| id | UUID |
| category_id | UUID |
| name | VARCHAR |
| description | TEXT |
| logo_url | TEXT |
| banner_url | TEXT |
| contact_email | VARCHAR |
| facebook_url | TEXT |
| recruitment_status | BOOLEAN |
| founded_year | INTEGER |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

Relationships

- belongs to Category
- has many Members
- has many Events
- has many Workshops
- has many Knowledge Articles
- has many Documents
- has many Galleries
- has many Announcements

---

## club_terms

Represents each executive board period.

| Field | Type |
|------|------|
| id | UUID |
| club_id | UUID |
| name | VARCHAR |
| start_date | DATE |
| end_date | DATE |

---

## memberships

Stores membership history.

| Field | Type |
|------|------|
| id | UUID |
| profile_id | UUID |
| club_id | UUID |
| term_id | UUID |
| position | VARCHAR |
| joined_at | DATE |
| left_at | DATE |
| status | VARCHAR |

Examples

President

Vice President

Head of Media

Member

Mentor

---

## events

Club events.

| Field | Type |
|------|------|
| id | UUID |
| club_id | UUID |
| title | VARCHAR |
| description | TEXT |
| location | VARCHAR |
| banner_url | TEXT |
| start_time | TIMESTAMP |
| end_time | TIMESTAMP |
| max_participants | INTEGER |
| qr_code | TEXT |
| status | VARCHAR |

---

## attendance

Stores attendance records.

| Field | Type |
|------|------|
| id | UUID |
| event_id | UUID |
| membership_id | UUID |
| check_in_time | TIMESTAMP |
| status | VARCHAR |

---

## workshops

Workshop information.

| Field | Type |
|------|------|
| id | UUID |
| club_id | UUID |
| title | VARCHAR |
| description | TEXT |
| material_url | TEXT |
| created_by | UUID |
| created_at | TIMESTAMP |

---

## knowledge_articles

Knowledge repository.

| Field | Type |
|------|------|
| id | UUID |
| club_id | UUID |
| title | VARCHAR |
| content | TEXT |
| category | VARCHAR |
| attachment_url | TEXT |
| created_by | UUID |
| created_at | TIMESTAMP |

---

## meeting_minutes

Meeting notes.

| Field | Type |
|------|------|
| id | UUID |
| club_id | UUID |
| title | VARCHAR |
| content | TEXT |
| meeting_date | DATE |
| created_by | UUID |

---

## documents

Documents uploaded by clubs.

| Field | Type |
|------|------|
| id | UUID |
| club_id | UUID |
| title | VARCHAR |
| file_url | TEXT |
| type | VARCHAR |
| uploaded_by | UUID |
| uploaded_at | TIMESTAMP |

---

## announcements

Announcements.

| Field | Type |
|------|------|
| id | UUID |
| club_id | UUID (nullable) |
| title | VARCHAR |
| content | TEXT |
| created_by | UUID |
| created_at | TIMESTAMP |

Null club_id means announcement from Manager.

---

## galleries

Stores images.

| Field | Type |
|------|------|
| id | UUID |
| club_id | UUID |
| image_url | TEXT |
| caption | TEXT |
| uploaded_by | UUID |

---

## payments

Sandbox payment only.

| Field | Type |
|------|------|
| id | UUID |
| membership_id | UUID |
| amount | DECIMAL |
| payment_date | TIMESTAMP |
| payment_method | VARCHAR |
| transaction_code | VARCHAR |
| status | VARCHAR |

---

## alumni

Former members.

| Field | Type |
|------|------|
| id | UUID |
| membership_id | UUID |
| graduation_year | INTEGER |
| company | VARCHAR |
| linkedin_url | TEXT |

---

## notifications

System notifications.

| Field | Type |
|------|------|
| id | UUID |
| profile_id | UUID |
| title | VARCHAR |
| content | TEXT |
| is_read | BOOLEAN |
| created_at | TIMESTAMP |

---

## chat_history

AI conversation history.

| Field | Type |
|------|------|
| id | UUID |
| profile_id | UUID |
| question | TEXT |
| answer | TEXT |
| created_at | TIMESTAMP |

---

# Relationship Summary

## One-to-One

auth.users

↓

profiles

---

## One-to-Many

roles

↓

profiles

---

categories

↓

clubs

---

clubs

↓

club_terms

events

workshops

knowledge_articles

meeting_minutes

documents

galleries

announcements

memberships

---

profiles

↓

memberships

notifications

chat_history

---

memberships

↓

payments

attendance

alumni

---

events

↓

attendance

---

# Storage Mapping

Supabase Storage Buckets

avatars

club-images

gallery

documents

knowledge

workshop-materials

---

# Authentication Flow

Supabase Auth

↓

auth.users

↓

Trigger

↓

profiles

---

# Authorization

RBAC

Student

↓

Club Member

↓

Club Leader

↓

Mentor

↓

Manager

↓

Administrator

Implemented using

- roles
- memberships
- Supabase Row Level Security (RLS)

---

# Design Principles

- UUID Primary Keys
- Soft-delete ready
- Timestamp for auditing
- Normalized relationships
- No duplicated user data
- Authentication handled by Supabase
- Sandbox payment only
- AI reads only knowledge resources
- Future-ready for recruitment workflow
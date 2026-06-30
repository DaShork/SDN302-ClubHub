# Database Design

## User

| Field       | Type   |
| ----------- | ------ |
| id          | UUID   |
| fullName    | String |
| email       | String |
| studentCode | String |
| avatarUrl   | String |
| role        | Enum   |

---

## Club

| Field       | Type   |
| ----------- | ------ |
| id          | UUID   |
| name        | String |
| description | Text   |
| logoUrl     | String |
| category    | String |

---

## ClubTerm

| Field     | Type   |
| --------- | ------ |
| id        | UUID   |
| clubId    | UUID   |
| name      | String |
| startDate | Date   |
| endDate   | Date   |

---

## ClubMember

| Field    | Type   |
| -------- | ------ |
| id       | UUID   |
| userId   | UUID   |
| clubId   | UUID   |
| termId   | UUID   |
| position | String |

---

## Event

| Field       | Type      |
| ----------- | --------- |
| id          | UUID      |
| clubId      | UUID      |
| title       | String    |
| description | Text      |
| startTime   | Timestamp |
| endTime     | Timestamp |

---

## KnowledgeArticle

| Field   | Type   |
| ------- | ------ |
| id      | UUID   |
| clubId  | UUID   |
| title   | String |
| content | Text   |

---

## Announcement

| Field     | Type   |
| --------- | ------ |
| id        | UUID   |
| title     | String |
| content   | Text   |
| createdBy | UUID   |

---

## ChatHistory

| Field    | Type |
| -------- | ---- |
| id       | UUID |
| userId   | UUID |
| question | Text |
| answer   | Text |

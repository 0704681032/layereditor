---
name: Project Architecture
description: Layer Editor backend: Spring Boot 3.3 + Java 21 + MyBatis XML mappers + PostgreSQL + Flyway + Lombok. Modules: document, revision, asset, ai, common.
type: project
---

Layer Editor is a Spring Boot 3.3 / Java 21 application for managing layered graphic documents with revision history.

**Stack:** MyBatis (XML mappers, not annotations), PostgreSQL (jsonb for content/snapshots), Flyway migrations, Lombok, OpenFeign, Spring Security.

**Key modules:**
- `document` - CRUD for editor documents with optimistic locking via `current_version`
- `revision` - Document revision history with snapshot/restore
- `asset` - File upload/storage with dedup, thumbnails, SVG sanitization
- `common` - Shared exceptions, response wrapper, utilities (ContentValidator, SvgSanitizer)

**Why:** Useful context for reviewing changes to these modules.

**How to apply:** When reviewing document/revision code, consider the optimistic locking pattern (`current_version`), the `DEFAULT_USER_ID = 1L` hardcoded auth placeholder, and the jsonb content validation flow.

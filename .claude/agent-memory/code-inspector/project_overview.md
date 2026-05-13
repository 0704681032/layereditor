---
name: LayerEditor Backend Architecture
description: Overview of the LayerEditor backend codebase structure, tech stack, and key patterns
type: project
---

## Tech Stack
- Spring Boot with Spring Security, Spring Cloud OpenFeign
- MyBatis (XML mappers) with PostgreSQL
- Flyway for database migrations
- Volcengine (ByteDance) Visual Intelligence API for AI image processing
- Java records for DTOs, Lombok for entities

## Key Packages
- `asset` - File upload/storage/management (upload, thumbnail, watermark, crop, dedup by SHA-256)
- `document` - Layer-based document CRUD with optimistic locking (current_version)
- `ai` - AI image processing (matting, outpainting, inpainting, super-resolution) via Feign client
- `common.security` - HTTP Basic auth with InMemoryUserDetailsManager
- `common.util` - ContentValidator (JSON), SvgSanitizer (XML/XSS)
- `common.exception` - BusinessException hierarchy with GlobalExceptionHandler

## Key Patterns
- Soft delete pattern (deleted_at column) for both assets and documents
- File storage: local filesystem organized by year/month, UUID-based filenames
- SVG sanitization: XML parsing with XXE protection, dangerous element/attribute removal
- File upload validation: extension allowlist + blocklist, Content-Type check, magic number verification
- Optimistic concurrency on document updates via version guard

## Known Issues (as of 2026-04-30 review)
- CORS configured in both SecurityConfig and WebConfig (duplication)
- VolcengineFeignConfig uses @Configuration (should not for Feign client config)
- AiProcessingException not handled by GlobalExceptionHandler
- Default credentials (editor/editor) in SecurityConfig
- Content-Disposition header injection in preview/thumbnail endpoints

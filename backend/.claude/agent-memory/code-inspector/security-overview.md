---
name: Security Architecture Overview
description: Key security patterns and known issues in the common/ package for the layer editor backend
type: project
---

The application uses Spring Security with HTTP Basic auth, in-memory user store, CORS with configurable origins, and stateless sessions. SVG content is sanitized via SvgSanitizer with XXE protections. ContentValidator validates JSON document structure and delegates SVG sanitization.

**Known issues flagged (as of 2026-05-10):**
- SecurityConfig uses `anyRequest().permitAll()` catch-all, exposing non-/api endpoints
- Default credentials are `editor`/`editor` -- no fail-fast if env vars missing
- SvgSanitizer missing `setExpandEntityReferences(false)` for full XXE defense
- GlobalExceptionHandler in common/ imports domain-specific AiImageService, breaking layering

**How to apply:** When reviewing new security-related code or changes to these files, check whether the known issues have been addressed. New endpoints outside /api/ will be unauthenticated by default due to permitAll().

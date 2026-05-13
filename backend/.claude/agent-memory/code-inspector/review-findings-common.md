---
name: Code Review Findings Tracker
description: Tracks unresolved review findings in the common/ package so future reviews can verify fixes
type: project
---

## Unresolved Findings (flagged 2026-05-10)

### Critical
1. **SecurityConfig.java:57** -- `anyRequest().permitAll()` should be `denyAll()`
2. **SecurityConfig.java:24-28** -- Default credentials `editor`/`editor` should fail-fast if not configured
3. **SvgSanitizer.java:68-75** -- Missing `setExpandEntityReferences(false)` for XXE defense-in-depth
4. **SecurityConfig.java:62-70** -- InMemoryUserDetailsManager prevents password rotation

### Important
5. **WebConfig.java:15-18** -- No validation on storagePath; could serve arbitrary directories
6. **GlobalExceptionHandler.java:48** -- common package imports ai module service (layering violation)
7. **SvgSanitizer.java:93-98** -- Redundant tagName check with namespace-aware parser
8. **ContentValidator.java:77** -- `String.length()` vs byte size for MAX_CONTENT_SIZE=10MB
9. **HttpClientConfig.java:31-43** -- Missing `destroyMethod="close"` on CloseableHttpClient bean
10. **SecurityConfig.java:40-42** -- `addAllowedMethod("*")` and `addAllowedHeader("*")` are overly permissive

### Suggestions
11. **SvgSanitizer.java** -- `<use>` element not in DANGEROUS_ELEMENTS (SSRF risk via external href)
12. **SvgSanitizer.java:174** -- TransformerFactory missing secure-processing features
13. **LegacyImageUtils.java:257** -- XBM parser only reads 1024 bytes
14. **BusinessException hierarchy** -- Error codes are magic numbers with no central registry
15. **ContentValidator.java:92** -- No validation of layer type values against a whitelist
16. **SvgSanitizer.java:150-153** -- `data:image/svg+xml` URLs not blocked in href attributes

**How to apply:** When re-reviewing these files, check which findings have been resolved and update this tracker.

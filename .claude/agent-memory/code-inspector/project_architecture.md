---
name: Project Architecture
description: Architecture overview of the LayerEditor frontend for future code reviews
type: project
---

LayerEditor is a React + Konva canvas-based layer editor with a Java Spring Boot backend.

**Frontend stack:** React 18, TypeScript, Zustand (slice pattern), Konva (canvas rendering), Ant Design (UI), Axios (HTTP).

**Key architectural patterns:**
- Zustand store composed of 7 slices: document, layer, selection, clipboard, viewport, uiPreferences, drawing
- History/undo system uses Immer patches (module-level state in history.ts)
- Layer tree operations are pure functions in layerTreeOperations.ts
- Layer types use discriminated unions on a `type` field
- Smart guides system with edge/center/spacing/equal-distribution detection
- Asset loading with module-level cache

**Review findings (2026-04-30):**
- Store slices use `any` typed set/get -- loses type safety
- Module-level mutable state (debounce timer in layerSlice, history arrays) can cause cross-document contamination
- SVG parser has attribute injection risk when constructing SVG strings from user-supplied data
- Image loading in Konva components lacks proper cleanup (onerror, src reset)
- Snap algorithm uses "last match wins" instead of "closest match"
- drawingSlice has broken syncHistoryState (tests function reference instead of calling canUndo())

**How to apply:** When reviewing new code in this project, watch for: module-level mutable state, `any` type usage in store operations, missing cleanup in useEffect hooks, and string interpolation of user-supplied SVG data.

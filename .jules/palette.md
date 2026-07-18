# Palette's UX & Accessibility Journal

This journal contains CRITICAL UX and accessibility learnings specific to this application's user interface design patterns.

## 2025-07-20 - Keyboard-Accessible Hover Disclosures
**Learning:** The application frequently implements "hover disclosure" buttons (such as delete note buttons or quick actions) styled with `opacity-0 hover:opacity-100`. While visually clean, this pattern completely breaks keyboard accessibility: screen readers and keyboard-only users navigating via standard tab index cannot see or easily discover these buttons when they receive focus. By adding group focus and focus-visible triggers (e.g., `group-focus-within:opacity-100` and `focus-visible:opacity-100`), the buttons gracefully disclose themselves to keyboard users exactly when needed.
**Action:** For all hover-disclosed controls or actions across the application, always pair hover transitions with corresponding focus/focus-within utility triggers to maintain full screen reader and keyboard-only accessibility.

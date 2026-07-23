# Palette's UX & Accessibility Journal

This journal contains CRITICAL UX and accessibility learnings specific to this application's user interface design patterns.

## 2025-07-20 - Keyboard-Accessible Hover Disclosures
**Learning:** The application frequently implements "hover disclosure" buttons (such as delete note buttons or quick actions) styled with `opacity-0 hover:opacity-100`. While visually clean, this pattern completely breaks keyboard accessibility: screen readers and keyboard-only users navigating via standard tab index cannot see or easily discover these buttons when they receive focus. By adding group focus and focus-visible triggers (e.g., `group-focus-within:opacity-100` and `focus-visible:opacity-100`), the buttons gracefully disclose themselves to keyboard users exactly when needed.
**Action:** For all hover-disclosed controls or actions across the application, always pair hover transitions with corresponding focus/focus-within utility triggers to maintain full screen reader and keyboard-only accessibility.

## 2025-07-21 - Restrictive Form Validation & Cognitive Feedback
**Learning:** Date-range pickers inside overlay modal views (like leave application forms) often lack client-side range boundaries and feedback indicators, permitting invalid submissions (e.g. end-date before start-date). Disabling invalid dates directly on the Calendar calendar picker prevents layout and database state errors. Additionally, calculating and rendering the requested duration in real-time provides immediate validation and cognitive confirmation of the user's intent.
**Action:** When implementing any dual date-picker forms, always disable invalid date selections reactively and display a computed duration indicator to prevent submitting invalid date ranges and reduce cognitive load.

## 2025-07-22 - Graceful Constraints & Real-time Length Feedback in Quick Note Fields
**Learning:** Text input areas like "Sticky Reminders" often let users enter unlimited text, causing sudden visual overflow, broken cards, or layout shifts on small dashboards. Implementing a solid HTML `maxLength` constraint alongside an automated character counter that alerts the user visually (e.g., transitions to bold amber when reaching an 80% threshold) keeps the user informed and prevents broken interfaces without intrusive alert screens.
**Action:** Provide explicit visual indicators and disabled validation buttons alongside max length properties in text field widgets to ensure elegant layout safety.

## 2025-07-23 - Interactive Controls without Text Representation
**Learning:** Icon-only interactive control elements (e.g. view switchers, stage transition buttons, detail actions) lack clear textual representations for screen readers. Using Lucide SVG components instead of raw text characters (like plain arrows `←`/`→`) provides consistent and polished visuals, but leaves screen readers completely in the dark without explicit `aria-label` or `title` properties.
**Action:** Always wrap raw-text arrows in modern SVG icon components, and systematically declare `aria-label` and `title` attributes on all icon-only control buttons to satisfy screen reader navigation and accessibility guidelines.

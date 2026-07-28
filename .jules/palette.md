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

## 2025-07-24 - Interactive Form Feedback & Maximum Length Boundaries
**Learning:** Textareas on public-facing contact or service forms frequently lack visual indicators for maximum lengths. Users typing lengthy paragraphs can face sudden submission failures from database string/character truncations or size limits. Adding an explicit character counter (e.g. `maxLength={1000}`) with high-contrast threshold state changes (such as turning amber/bold at 80% capacity) sets polite boundaries. Additionally, appending an animated loader spinner during active async submission reduces double-submit frustration and assures users that their message is processing.
**Action:** Always accompany public contact or message form text fields with explicit character counters and active visual loading indicators inside submission buttons.

## 2025-07-25 - Guarding Input Limits and Cognitive Support on Quick/Floating Scratchpads
**Learning:** Persistent or floating micro-inputs (such as floating scratchpads or global jotters) are highly susceptible to silent overflow. Users frequently dump large amounts of clipboard content or write excessive text inside them. Without constraints and visible limits, this triggers visual layout breakage on floating UI cards and can lead to silent database constraint failures or truncation errors. Applying a clear `maxLength={500}` boundary with a real-time character counter and high-contrast alert states (e.g., transitions to bold red at 80% capacity) prevents these bugs, provides immediate confirmation of length status, and ensures screen readers are aware of constraints through ARIA helper relationships.
**Action:** Implement reactive length validation, ARIA relationship tags, and persistent high-contrast threshold counters on all persistent or floating memo-writing widgets.

## 2025-07-26 - Form Accessibility via Colored Required Indicators & Loading Spinners
**Learning:** Interactive public-facing and internal forms often overlook visible asterisk `*` indicators on required input labels, leading to trial-and-error validation frustration. Wrapping required indicators in a high-contrast style (`<span className="text-red-500">*</span>`) satisfies standard UX expectations. Furthermore, adding rotating spinners (`Loader2` with `animate-spin`) to submission and high-action triggers (e.g. "Submit Inquiry", "Mark Attendance") offers polished real-time cognitive feedback during async operations.
**Action:** Systematically declare high-contrast styled required elements on all mandatory inputs, and always attach loading states with spinners to async submit or check-in buttons.

## 2025-07-27 - Context-Aware, Accessible Navigation Helpers
**Learning:** Global UI helpers like "Back to Top" smooth scroll buttons significantly improve user experience on long, information-dense marketing landing pages. However, displaying them unconditionally can result in severe UX degradation (layout overlaps, click-jack, visual clutter) inside complex multi-panel dashboard interfaces. Wrapping scroll triggers with route-matching filters prevents dashboard leaks, and using native focus rings (`focus-visible:ring-2`), clear `aria-label`, and `title` attributes ensures keyboard and screen reader accessibility.
**Action:** When adding global UI helpers or floating utilities, always apply strict path exclusions for dashboard workspaces and satisfy comprehensive ARIA and focus-ring standards.

## 2026-07-27 - Polishing Team Application Forms with Interactive UX & Visual Safeguards
**Learning:** Required form input field labels should have clearly styled asterisks (`<span className="text-red-500">*</span>`) rather than plain text asterisks, ensuring standard accessibility and visual contrast. Furthermore, public job/team application forms require visual submittal indicators (e.g. `Loader2` rotating spinners) and disabled triggers during async submission to block cyclic submission bugs and lower cognitive strain. Finally, textareas like "About Me" on application sheets are vulnerable to silent database truncations if they lack explicit `maxLength` constraints and real-time character counters.
**Action:** Consistently employ structured required markers, loader spinners, maximum lengths, and reactive character counters on all candidate intake and public-facing forms.

# Bolt's Performance Journal

This journal contains CRITICAL learnings about performance optimization specific to this codebase's architecture.

## 2025-07-17 - Memoizing Chess Rendering Components
**Learning:** Pure rendering subcomponents such as `ChessPiece` and `PieceIcon` are re-rendered for all 64 squares on every chessboard update (including timer ticks and move highlight hover events). By memoizing these leaf components (and using custom comparison for dynamic objects in `RealChessEngine`), we avoid 64 expensive DOM/symbol icon updates per tick or click.
**Action:** Always inspect chessboard grids and list elements for pure display components that can be optimized with `React.memo` to preserve CPU/GPU cycles.

## 2025-07-18 - Eliminating Redundant High-Frequency Event Listening Work
**Learning:** High-frequency events (like `mousemove` and `scroll`) can easily degrade browser render/scroll performance and cause layout thrashing if handlers invoke expensive calls like `querySelectorAll()` or `getBoundingClientRect()`. By querying target DOM elements exactly once on component mount, we can skip registering the listener entirely if no elements are found, or reuse the list to avoid repetitive DOM tree walks.
**Action:** Always query and cache static DOM target lists in high-frequency event handlers, and use the `{ passive: true }` modifier on scroll/mousemove listeners to prevent scroll thread blocking.

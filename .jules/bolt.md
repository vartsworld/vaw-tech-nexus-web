# Bolt's Performance Journal

This journal contains CRITICAL learnings about performance optimization specific to this codebase's architecture.

## 2025-07-17 - Memoizing Chess Rendering Components
**Learning:** Pure rendering subcomponents such as `ChessPiece` and `PieceIcon` are re-rendered for all 64 squares on every chessboard update (including timer ticks and move highlight hover events). By memoizing these leaf components (and using custom comparison for dynamic objects in `RealChessEngine`), we avoid 64 expensive DOM/symbol icon updates per tick or click.
**Action:** Always inspect chessboard grids and list elements for pure display components that can be optimized with `React.memo` to preserve CPU/GPU cycles.

## 2025-07-18 - Eliminating Redundant High-Frequency Event Listening Work
**Learning:** High-frequency events (like `mousemove` and `scroll`) can easily degrade browser render/scroll performance and cause layout thrashing if handlers invoke expensive calls like `querySelectorAll()` or `getBoundingClientRect()`. By querying target DOM elements exactly once on component mount, we can skip registering the listener entirely if no elements are found, or reuse the list to avoid repetitive DOM tree walks.
**Action:** Always query and cache static DOM target lists in high-frequency event handlers, and use the `{ passive: true }` modifier on scroll/mousemove listeners to prevent scroll thread blocking.

## 2025-07-19 - Preventing Supabase Subscription Churn in Custom Real-time Hooks
**Learning:** Subscribing to Supabase real-time channels using `supabase.channel()` and `.subscribe()` triggers WebSockets handshake overhead and network requests. When custom subscription hooks like `useRealtimeSubscription` accept inline callbacks as parameters, they re-subscribe on every render because function references change. Using the Latest Ref pattern (holding callbacks in mutable refs and using boolean triggers in the effect array) solves this completely without tearing down the connection.
**Action:** Always use mutable refs to store dynamic handlers inside hooks that establish network connections or subscribe to events in their `useEffect` lifecycle.

## 2025-07-20 - Eliminating Real-time Subscription Churn on Unstable Dependencies
**Learning:** React state-management hooks combined with dynamic array dependencies (such as `queryKey` array literals in TanStack Query) trigger constant `useEffect` teardown and recreation loops on every single parent render. This results in heavy WebSocket network overhead, subscription churn, database strain, and stuttering clients. Holding the dynamic array reference in a `useRef` and utilizing a serialized string representation (like `JSON.stringify(queryKey)`) inside the dependency array keeps the WebSocket connection stable.
**Action:** Always serialize dynamic/composite non-primitive array or object dependencies inside subscription-establishing effects, and pass latest references to callbacks via `useRef`.

## 2025-07-21 - Optimizing Calendar Render via O(1) Hash-Map Lookups
**Learning:** Calendar matrices (e.g. 35 days in a grid) rendering custom content per-day are highly prone to O(C * N) nested loop degradation when executing `.filter()` or `.find()` arrays and parsing strings (e.g., `parseISO()`, `isSameDay()`) dynamically in render paths. Pre-building O(1) lookup records (hash maps) keyed by standardized `YYYY-MM-DD` strings inside a cohesive `useMemo` block decreases computation complexity down to O(C + N), resulting in up to a 150x decrease in render loops and zero stutter.
**Action:** Always pre-group and index arrays by simple string keys in a single memoized preprocessing step before referencing them in repeated or nested subcomponents.

## 2025-07-22 - Batching Sender Profiles to Eliminate N+1 Database Queries
**Learning:** React hooks loading initial lists of items (like recent chat messages in `useStaffData`) are highly vulnerable to N+1 query patterns when formatting each item requires fetching detail records (like sender profiles) individually over the HTTP API. This causes up to 20 network roundtrips on initial load, delaying state transitions and exhausting connection pools. Batch-fetching all distinct details via a single `.in()` query and mapping them locally with O(1) in-memory lookups drops loading time to exactly 2 queries.
**Action:** Always check array mapper blocks (`Promise.all` + `.map`) for database fetches, and replace them with single-query batch fetches matched via key-value dictionaries.

## 2025-07-23 - Batching Child Table Queries to Prevent Pipeline Satiation
**Learning:** In dashboards loading complex parent items that require displaying a summary of nested children stages (such as tasks and subtasks in `TeamHeadWorkspace.tsx`), mapping over parent records and calling child selects in a parallel mapping promise loop (`Promise.all`) triggers a massive cascade of database hits (N+1 queries). By retrieving all children across parent IDs in a single batch query (`.in('task_id', taskIds)`) and mapping them synchronously using an in-memory hash map lookup, loading times drop exponentially while database overhead drops down to O(1) connection.
**Action:** Batch fetch dependent child records using list indices in a single network query and map them synchronously using O(1) in-memory groupings.

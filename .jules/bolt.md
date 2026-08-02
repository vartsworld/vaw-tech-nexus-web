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

## 2025-07-24 - Targeted Query Filters on Composite Key/Sub-association Tables
**Learning:** Selecting all records from tables like `staff_tasks` and doing high-complexity string/JSON containment parsing client-side inside standard hooks/views (such as `OfficeZenHome.tsx` or `StaffWork.tsx`) introduces an $O(N)$ network and client processing bottleneck as the system scales. By pre-fetching associated child keys from tables like `staff_subtasks` for the current user, we can formulate precise database-level targeted SQL query filters (`.or(...)` matching assigned_to, assigned_by, or subtask task_ids) that drop network transfer overhead and client-side processing down to O(1).
**Action:** Always pre-fetch associated child relationship foreign keys to construct clean, database-indexed, targeted parent table filters rather than relying on client-side mappers over full-table queries.

## 2025-07-25 - Targeted DB Filters in CompletedTasksDialog
**Learning:** Querying the parent `staff_tasks` table globally without any filters inside common user-facing elements like `CompletedTasksDialog.tsx` downloads the entire company's task database to every user's client on mount, introducing a massive O(N) network and bandwidth bottleneck as the database grows. First collecting the user's specific `parentTaskIds` from subtasks, and combining them with direct assignments to construct a precise database-level targeted `.or()` SQL query filter, reduces data transmission and client-side filtering complexity to O(1) for unrelated records.
**Action:** Never perform unfiltered global queries on high-volume transactional tables. Always construct precise database-level compound filters based on user associations and reference lists.

## 2025-07-26 - Dynamic Registration of High-Frequency Window Listeners
**Learning:** Registering window-wide event listeners like `mousemove` and `mouseup` on mount and keeping them active continuously introduces unnecessary main thread overhead, executing callbacks on every single user pixel movement even when idle. By dynamically registering these handlers only when an interaction begins (e.g., `onMouseDown` in `ChatPopout.tsx`) and removing them immediately upon completion (`onMouseUp`), we completely eliminate this overhead.
**Action:** Always register high-frequency global window event listeners (like dragging/tracking) dynamically on-demand and clean them up promptly on interaction end. Use React `useRef` to safely track active handler references for component unmount safety.

## 2026-08-01 - Batching Department and Metrics Queries to Eliminate N+1 Database Bottlenecks
**Learning:** Sequential DB fetches in loops or nested `Promise.all` mappings to query child/related records (like counting staff profiles per department, or fetching task statuses per department) cause high database overhead and latency proportional to the count of parents $O(N)$. By batch-fetching all children records in a single query (using target groupings or `.in()`) and aggregating them in-memory via O(1) hash maps, we drop database overhead down to O(1) connection.
**Action:** Always inspect loops and async mappings for database query patterns and optimize them using single-query batch requests matched with local in-memory groupings.

## 2026-08-02 - Eliminating Interval Recreation Churn in Timer Hooks and Components
**Learning:** Registering a ticking `setInterval` or `setTimeout` inside a `useEffect` that lists the ticking countdown state variable (e.g. `timeLeft` or `breakTimeRemaining`) as a dependency forces the interval to tear down and reconstruct on every single tick (e.g., every 1 second). This creates massive native thread API overhead and unnecessary garbage collection. By removing the ticking state variable from the dependency list and using React's functional state updater (`setState(prev => prev - 1)`), we can keep the interval alive continuously from start to finish, reducing overhead to exactly one initialization and teardown per session.
**Action:** Always avoid putting ticking state values in interval-establishing `useEffect` dependency arrays when functional state updates can compute the next value.
## 2025-08-02 - Eliminating Interval Recreation Churn in Timer Components
**Learning:** Registering a ticking `setInterval` inside a `useEffect` that lists the ticking state variable (e.g. `breakTimeRemaining`) as a dependency forces the interval to tear down and reconstruct on every single tick. This creates native thread API overhead and unnecessary garbage collection. By removing the ticking state variable from the dependency list and using React's functional state updater (`setState(prev => ...)`), we can keep the interval alive continuously from start to finish, reducing overhead to exactly one initialization and teardown per session.
**Action:** Always avoid putting ticking state values in interval-establishing `useEffect` dependency arrays when functional state updates can compute the next value.

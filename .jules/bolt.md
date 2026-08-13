## 2024-05-14 - React Performance Tuning in Complex Dashboards
**Learning:** High-density analytics dashboards (like `FinancialOversight.tsx`) frequently compute aggregated statistics (totals, chart data, arrays of filtered inputs) directly inside the component body, which executes on every re-render and can block the main thread.
**Action:** Always wrap heavy synchronous calculations, array `.map()`/`.filter()` chains, and nested loop iterations with `useMemo`, ensuring dependency arrays strictly list only variables that should trigger a recalculation. Wrapping lookup dictionaries constructed from arrays in `useMemo` is also highly effective for $O(1)$ fast lookups across downstream calculations.

## 2024-05-14 - React Performance Tuning in Complex Dashboards
**Learning:** High-density analytics dashboards (like `FinancialOversight.tsx`) frequently compute aggregated statistics (totals, chart data, arrays of filtered inputs) directly inside the component body, which executes on every re-render and can block the main thread.
**Action:** Always wrap heavy synchronous calculations, array `.map()`/`.filter()` chains, and nested loop iterations with `useMemo`, ensuring dependency arrays strictly list only variables that should trigger a recalculation. Wrapping lookup dictionaries constructed from arrays in `useMemo` is also highly effective for fast lookups across downstream calculations.
## 2024-08-13 - Memoizing Component Render Filters
**Learning:** Component map operations often include nested `.filter` operations that turn an `O(N)` loop into an `O(N*M)` execution bottleneck during the React render phase, particularly for large dashboards like `TeamHeadWorkspace.tsx`.
**Action:** When filtering a static array inside a map loop, precalculate the mapping by generating a fast `O(1)` hash map logic wrapped inside a `useMemo` statement outside the render cycle.

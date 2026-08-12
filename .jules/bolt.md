## 2024-05-14 - React Performance Tuning in Complex Dashboards
**Learning:** High-density analytics dashboards (like `FinancialOversight.tsx`) frequently compute aggregated statistics (totals, chart data, arrays of filtered inputs) directly inside the component body, which executes on every re-render and can block the main thread.
**Action:** Always wrap heavy synchronous calculations, array `.map()`/`.filter()` chains, and nested loop iterations with `useMemo`, ensuring dependency arrays strictly list only variables that should trigger a recalculation. Wrapping lookup dictionaries constructed from arrays in `useMemo` is also highly effective for $O(1)$ fast lookups across downstream calculations.

## 2026-08-12 - Derived State Anti-Pattern Optimization
**Learning:** Storing derived data in state (e.g., `filteredTasks`) and updating it via `useEffect` is a common React anti-pattern that causes unnecessary double re-renders (once for the dependency change, and again when the state is set).
**Action:** Replace `useState` and `useEffect` with `useMemo` to compute the derived state synchronously during the render cycle, eliminating the redundant re-render overhead.

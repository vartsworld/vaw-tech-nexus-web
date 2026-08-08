## 2024-05-14 - React Performance Tuning in Complex Dashboards
**Learning:** High-density analytics dashboards (like `FinancialOversight.tsx`) frequently compute aggregated statistics (totals, chart data, arrays of filtered inputs) directly inside the component body, which executes on every re-render and can block the main thread.
**Action:** Always wrap heavy synchronous calculations, array `.map()`/`.filter()` chains, and nested loop iterations with `useMemo`, ensuring dependency arrays strictly list only variables that should trigger a recalculation. Wrapping lookup dictionaries constructed from arrays in `useMemo` is also highly effective for $O(1)$ fast lookups across downstream calculations.
## 2024-08-08 - UseMemo for derived component states
**Learning:** React components containing derived state synchronized via `useEffect` into a local `useState` (e.g. `filteredTasks`) will execute redundant re-render cycles, especially in frequently updated components.
**Action:** Replace the `useState` + `useEffect` pattern with synchronous execution within a `useMemo` block to avoid extra renders and ensure consistency.

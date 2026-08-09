## 2024-05-14 - React Performance Tuning in Complex Dashboards
**Learning:** High-density analytics dashboards (like `FinancialOversight.tsx`) frequently compute aggregated statistics (totals, chart data, arrays of filtered inputs) directly inside the component body, which executes on every re-render and can block the main thread.
**Action:** Always wrap heavy synchronous calculations, array `.map()`/`.filter()` chains, and nested loop iterations with `useMemo`, ensuring dependency arrays strictly list only variables that should trigger a recalculation. Wrapping lookup dictionaries constructed from arrays in `useMemo` is also highly effective for $O(1)$ fast lookups across downstream calculations.

## 2024-08-09 - Avoid synchronizing derived state with useEffect in React
**Learning:** Found a common anti-pattern where a local state variable (like `filteredTasks`) is manually updated inside a `useEffect` whenever its dependencies (`tasks`, `searchTerm`, `filterStatus`, `filterPriority`) change. This causes double rendering since React updates state, re-renders, fires useEffect, updates another state, and re-renders again.
**Action:** Replace `useState` and `useEffect` with `useMemo` for derived states to calculate them synchronously during rendering, avoiding the extra render cycle.

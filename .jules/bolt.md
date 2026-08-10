## 2024-05-14 - React Performance Tuning in Complex Dashboards
**Learning:** High-density analytics dashboards (like `FinancialOversight.tsx`) frequently compute aggregated statistics (totals, chart data, arrays of filtered inputs) directly inside the component body, which executes on every re-render and can block the main thread.
**Action:** Always wrap heavy synchronous calculations, array `.map()`/`.filter()` chains, and nested loop iterations with `useMemo`, ensuring dependency arrays strictly list only variables that should trigger a recalculation. Wrapping lookup dictionaries constructed from arrays in `useMemo` is also highly effective for $O(1)$ fast lookups across downstream calculations.
## 2024-05-14 - React Performance Tuning in Complex Dashboards
**Learning:** Object maps instantiated within `Array.map` inside render components cause high memory overhead due to repeated reallocation and GC blocking.
**Action:** Always move static lookup maps outside of iteration loops, typically outside the component body altogether, or wrap them in `useMemo()` if they depend on static values.

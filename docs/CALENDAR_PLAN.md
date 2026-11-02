# Dashboard calendar: audit and fix plan

Scope: `src/components/staff/MonthlyPlanner.tsx` (the staff, team-head and HR calendar, built on `calendarkit-pro`), plus the sidebar and notes changes made with it.

## Done in this pass

| Area | Change |
| --- | --- |
| Header | Month/Week/Day/Agenda switcher removed (`hideViewSwitcher`). The day dialog covers day detail. Added a **Hide Completed** switch. It is stored per staff member in `localStorage` (`vaw_calendar_hide_completed_<userId>`), hides finished tasks, subtasks and plans on the grid and in the day dialog, and does not change the sidebar totals. |
| Sidebar | The inert "Calendars" accordion and timezone picker are replaced by a summary: next task, due today, tasks in the shown month, completed, pending, overdue, plans in the month. On screens below `lg` (where the library hides its sidebar) the same numbers show as a strip above the grid. |
| Data loading | Reference data and the realtime channel load once, not on every month or day click. Plans load for the whole visible grid, including the greyed days of the neighbouring months, which were missing before. Out-of-order responses are ignored. Realtime bursts are coalesced into one reload. |
| Drag and drop | Dragging a task or subtask used to do nothing. It now changes the due date, allowed for the person who assigned it or a team head. Others get a clear message. |
| Chips | `[Department]` no longer eats the visible part of the title; it moved to the description. |
| Dead code | Removed the per-date "all done" green CSS (the library has no such attributes) and a 1-second polling loop that searched the DOM for buttons. |
| Stale state | Plan add/update/delete use functional state updates. |
| Scrollbars | 2px wide app-wide (Chromium/Safari). Firefox cannot go below its `thin` width. |

## Known limits, not changed

- **Who sees what** is decided by RLS (`20261018210000_allow_staff_view_team_head_calendar_tasks.sql`): own and assigned tasks, department tasks, and anything a team head created. Staff therefore see colleagues' tasks in their department. Change the policy, not the UI, if that should narrow.
- Tasks with no due date appear on their creation date.
- Subtasks without their own due date appear on the parent's date.
- The month grid is the library's. Cells with many items scroll inside the cell, and long titles are truncated. A custom grid would be the next step if this still feels cramped.
- Opening the dashboard on a room always expands the sidebar (existing behaviour in `VirtualOfficeLayout`), so a collapsed sidebar is not remembered across rooms.

## Suggested next steps

1. A "Mine only" filter next to Hide Completed.
2. Show the client name on chips when a client filter is not active.
3. Replace `calendarkit-pro` internals we patch with CSS (sidebar panel, header slot) by a small in-house month grid.

# Team Head Dashboard Improvements

## Objectives
- [ ] **Fix Workspace Scrolling**: Ensure the entire workspace section is scrollable, even when the pointer is not directly over a component.
- [ ] **Layout Repositioning**:
    - [ ] Move "Mini Chess" widget to the right side of the screen on desktop layouts.
    - [ ] Ensure layout is responsive and arranges items by priority.
- [ ] **UI/UX Enhancements**:
    - [ ] **Message Sending**: Enable sending messages with the `Enter` key (prevent default for new lines unless Shift is held).
    - [ ] **Chessboard Responsiveness**: Ensure chessboard squares remain square (1:1 aspect ratio) on all screen sizes.
    - [ ] Review and enhance "Create Task" or "Task Sheet" UI if applicable.

## Implementation Plan

### 1. Layout & Scrolling
- **File**: `src/pages/TeamHeadDashboard.tsx` / `src/components/staff/VirtualOfficeLayout.tsx`
- **Action**:
    - Verify `overflow-y-auto` is on the correct parent container.
    - Ensure `TeamHeadWorkspace` container has ample height (`min-h-full`) to catch scroll events.
    - Reposition the "Widgets" section (containing Chess) to a sidebar/right column in the grid layout.

### 2. Chessboard
- **File**: `src/components/staff/MiniChess.tsx`
- **Action**:
    - Apply `aspect-square` tailwind class or CSS to the board container.
    - Ensure it scales correctly within its parent card.

### 3. Message Input
- **File**: `src/components/staff/TeamChat.tsx` / `src/components/staff/TeamHeadWorkspace.tsx`
- **Action**:
    - Add `onKeyDown` event handler to inputs/textareas.
    - Check for `e.key === 'Enter' && !e.shiftKey`.
    - Call the send function and prevent default behavior.

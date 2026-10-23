# VAW Coin Economy Implementation Guide

## System Overview

The VAW Coin system is a productivity-based token economy where:
- **1 VAW Coin = 1 INR** (tied to company value)
- Coins incentivize efficiency and faster project completion
- Company operates **24/7** (literal days, not business days)
- Managed by Team Heads, HR, and Finance

---

## Key Components

### 1. Company Coin Bank
- **Budget**: 10,000 coins per financial year
- **Reset**: Every financial year (April 1)
- **Managed by**: Finance Team
- **Allocations tracked**:
  - Coins allocated to Team Heads
  - Coins allocated to Quests
  - Coins granted by HR

### 2. Team Head Budgets
- **Monthly allocation**: 250 coins
- **Reset**: 1st of every month
- **Can request more**: Yes, requires HR approval
- **Tracking**:
  - Total allocation
  - Allocated (assigned to projects)
  - Spent (actually awarded on completion)
  - Available (remaining to allocate)

### 3. Project Coin Allocation

#### Timeline Logic (Literal Days)
```
Original Deadline: 7 days
├── Head sees: 6 days (7 - 1 day buffer)
├── Employee sees: 5 days (7 - 2 day buffer)
└── Half-time threshold: 2.5 days for bonus
```

#### Coin Distribution
- **On-time completion**: Full allocated coins
- **Half-time completion**: Full coins + 5 coin bonus (fixed)
- **Late submission**: Penalty of 1 coin per day late (max 50% of base amount)

#### Example
```
Project: Build dashboard
Allocated: 50 coins
Original deadline: January 15, 2026

Timeline breakdown:
- Head deadline: January 14 (shown to Head)
- Employee deadline: January 13 (shown to Employee)
- Half-time threshold: ~January 11 (2.5 days from assignment)

Scenarios:
1. Submit January 11 → Earn 55 coins (50 + 5 bonus)
2. Submit January 13 → Earn 50 coins (on time)
3. Submit January 16 → 3 days late → Penalty 3 coins → Needs HR approval
```

### 4. Late Submission Workflow

```
Employee submits late
    ↓
Status: "late_submitted"
    ↓
Penalty calculated (1 coin/day, max 50%)
    ↓
Head requests HR approval
    ↓
HR reviews with justification
    ↓
If approved:
    - Award (base coins - penalty)
    - Deduct penalty from user's total balance
If rejected:
    - No coins awarded
    - Project marked as failed
```

### 5. Quest System

####Structure
- **Duration**: Bi-monthly (2 months)
- **Quantity**: 6 quests per period
- **Types**: Universal (all employees) or Department-specific
- **Rewards**: From company coin bank
- **Management**: Created and monitored by HR

#### Quest Examples

```sql
-- Universal Quest: Speed Demon
{
  "name": "Speed Demon",
  "description": "Complete 5 projects in half the allocated time",
  "period": "Jan 1 - Feb 28, 2026",
  "scope": "universal",
  "reward": 10 coins,
  "criteria": {
    "type": "fast_completion",
    "count": 5
  }
}

-- Department Quest: Innovation Champion  
{
  "name": "Innovation Champion",
  "description": "Submit 2 approved new ideas",
  "period": "Jan 1 - Feb 28, 2026",
  "scope": "department",
  "department": "Engineering",
  "reward": 5 coins,
  "max_winners": 3,
  "criteria": {
    "type": "innovation",
    "count": 2,
    "status": "approved"
  }
}
```

### 6. Reward Catalog

HR creates rewards that employees can redeem:

| Reward | Coin Cost | Requires Approval |
|--------|-----------|-------------------|
| Salary Bonus (₹500) | 500 | HR + Finance |
| Fast Loan Approval | 100 | HR |
| Company Merch | 50 | HR |
| Extra Day Off | 200 | HR |
| Training Course | 150 | HR |
| Certificate of Excellence | 25 | Auto |

---

## Database Schema Summary

### Core Tables

1. **company_coin_bank** - Master budget tracking
2. **head_coin_budgets** - Monthly budgets for each Head
3. **project_coin_allocations** - Coin assignments to projects
4. **quests** - Achievement challenges
5. **user_quest_progress** - Individual progress tracking
6. **reward_catalog** - Available rewards
7. **reward_redemptions** - Redemption requests
8. **user_coin_transactions** - All coin movements
9. **finance_approvals** - Finance team approvals
10. **head_budget_requests** - Requests for additional budget

---

## Workflow Examples

###1. Head Assigns Project with Coins

```typescript
// Frontend code
const assignProjectWithCoins = async (
  taskId: string,
  employeeId: string,
  coinAmount: number,
  deadline: Date
) => {
  // Call SQL function
  const { data, error } = await supabase.rpc(
    'allocate_coins_to_project',
    {
      p_task_id: taskId,
      p_head_id: currentUserId,
      p_employee_id: employeeId,
      p_coin_amount: coinAmount,
      p_original_deadline: deadline.toISOString(),
      p_half_time_bonus: 5
    }
  );
  
  if (error) {
    if (error.message.includes('Insufficient')) {
      // Show option to request more budget
      showBudgetRequestDialog();
    }
  } else {
    toast.success(`${coinAmount} coins allocated to project`);
  }
};
```

### 2. Employee Submits Project

```typescript
const submitProject = async (allocationId: string) => {
  const { error } = await supabase.rpc(
    'process_project_submission',
    {
      p_allocation_id: allocationId,
      p_submission_date: new Date().toISOString()
    }
  );
  
  if (!error) {
    // Check if late
    const { data: allocation } = await supabase
      .from('project_coin_allocations')
      .select('status, final_coins_awarded, bonus_earned')
      .eq('id', allocationId)
      .single();
    
    if (allocation.status === 'approved') {
      toast.success(
        `Project approved! Earned ${allocation.final_coins_awarded} coins` +
        (allocation.bonus_earned > 0 ? ` (includes ${allocation.bonus_earned} bonus!)` : '')
      );
    } else if (allocation.status === 'late_submitted') {
      toast.warning('Project submitted late. Awaiting HR approval.');
    }
  }
};
```

### 3. HR Approves Late Submission

```typescript
const approveLateSubmission = async (
  allocationId: string,
  notes: string,
  waivePenalty: boolean
) => {
  const { error } = await supabase.rpc(
    'hr_approve_late_submission',
    {
      p_allocation_id: allocationId,
      p_hr_user_id: currentUserId,
      p_approval_notes: notes,
      p_waive_penalty: waivePenalty
    }
  );
  
  if (!error) {
    toast.success('Late submission approved');
  }
};
```

### 4. HR Awards Quest Completion

```typescript
const awardQuestCompletion = async (
  questId: string,
  userId: string
) => {
  const { error } = await supabase.rpc(
    'award_quest_completion',
    {
      p_quest_id: questId,
      p_user_id: userId,
      p_awarded_by: currentUserId
    }
  );
  
  if (!error) {
    toast.success('Quest reward awarded!');
  }
};
```

### 5. Employee Redeems Reward

```typescript
const redeemReward = async (rewardId: string, coinCost: number) => {
  // Check balance first
  const { data: balance } = await supabase.rpc(
    'get_user_coin_balance',
    { p_user_id: currentUserId }
  );
  
  if (balance < coinCost) {
    toast.error('Insufficient coins');
    return;
  }
  
  // Create redemption request
  const { error } = await supabase
    .from('reward_redemptions')
    .insert({
      user_id: currentUserId,
      reward_id: rewardId,
      coins_spent: coinCost,
      status: 'pending'
    });
  
  if (!error) {
    toast.success('Redemption request submitted. Awaiting HR approval.');
  }
};
```

---

## UI Components Needed

### For Team Heads

1. **Coin Budget Widget**
```
┌─────────────────────────────┐
│ Monthly Coin Budget         │
├─────────────────────────────┤
│ Available: 150 / 250 coins  │
│ Allocated: 75 coins         │
│ Spent: 25 coins             │
│                             │
│ [Request More Budget]       │
└─────────────────────────────┘
```

2. **Task Assignment Form** (updated)
```
Create Task
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: [________________]
Assign to: [Dropdown ▼]
Deadline: [Date Picker]
Coin Allocation: [___] coins
Half-time Bonus: [5] coins (HR adjustable)

Timeline Preview:
• You will see: 6 days
• Employee will see: 5 days
• Half-time threshold: 2.5 days

[Assign Task]
```

3. **Pending Approvals List**
```
┌──────────────────────────────────┐
│ Projects Awaiting Your Approval  │
├──────────────────────────────────┤
│ 📋 Dashboard Redesign            │
│    John Doe • Submitted 2h ago   │
│    50 coins • On time ✓          │
│    [Approve] [Reject]            │
├──────────────────────────────────┤
│ 📋 API Integration                │
│    Jane Smith • 1 day late ⚠️    │
│    40 coins (penalty: -1)        │
│    [Request HR Approval]         │
└──────────────────────────────────┘
```

### For Employees

1. **Coin Balance Display**
```
┌─────────────────────┐
│ 💰 VAW Coins        │
│                     │
│   247 coins         │
│   = ₹247 INR        │
│                     │
│ [View History]      │
│ [Browse Rewards]    │
└─────────────────────┘
```

2. **Active Projects Dashboard**
```
┌────────────────────────────────────────┐
│ 🎯 Your Active Projects                │
├────────────────────────────────────────┤
│ Dashboard Redesign               50 💰 │
│ ⏰ 3 days remaining                    │
│ ⚡ Submit in 1 day for +5 bonus!      │
│ [Submit Project]                       │
├────────────────────────────────────────┤
│ API Integration                  40 💰 │
│ ⏰ 5 days remaining                    │
│ [View Details]                         │
└────────────────────────────────────────┘
```

3. **Quest Progress Tracker**
```
┌─────────────────────────────────────────┐
│ 🏆 Active Quests (Jan - Feb 2026)      │
├─────────────────────────────────────────┤
│ Speed Demon                      10 💰  │
│ Complete 5 projects in half-time        │
│ Progress: ████░░░░░░ 3/5               │
├─────────────────────────────────────────┤
│ 7-Day Streaker                   20 💰  │
│ Work 7 days/week for a month            │
│ Progress: ██████████░ 21/28 days       │
└─────────────────────────────────────────┘
```

4. **Rewards Catalog**
```
┌──────────────────────────────────────────┐
│ 🎁 Rewards Marketplace                   │
├──────────────────────────────────────────┤
│ 💵 Salary Bonus (₹500)         500 💰    │
│    Requires: HR + Finance approval       │
│    [Redeem]                              │
├──────────────────────────────────────────┤
│ 👕 Company Merch                50 💰    │
│    In Stock: 15 items                    │
│    [Redeem]                              │
├──────────────────────────────────────────┤
│ 📚 Training Course             150 💰    │
│    Requires: HR approval                 │
│    [Redeem]                              │
└──────────────────────────────────────────┘
```

### For HR

1. **Quest Management Dashboard**
```
┌─────────────────────────────────────────────┐
│ Quest Management (Jan-Feb 2026)            │
├─────────────────────────────────────────────┤
│ Active Quests: 6                            │
│ Completed: 15 times                         │
│ Coins Distributed: 125                      │
│                                             │
│ [Create New Quest] [View Analytics]         │
├─────────────────────────────────────────────┤
│ Speed Demon (Universal)           10 💰     │
│ • Completions: 5                            │
│ • Pending Awards: 2                         │
│ [Award Coins] [Edit] [Deactivate]          │
└─────────────────────────────────────────────┘
```

2. **Late Approval Queue**
```
┌──────────────────────────────────────────┐
│ 📋 Pending Late Submissions (3)          │
├──────────────────────────────────────────┤
│ Dashboard Redesign                        │
│ John Doe • 2 days late                   │
│ Base: 50 coins | Penalty: -2 coins       │
│ Final: 48 coins                          │
│                                          │
│ Head Notes: "Client changed requirements"│
│ [Approve] [Approve w/ Waived Penalty]    │
│ [Reject]                                 │
└──────────────────────────────────────────┘
```

3. **Reward Redemption Approvals**
```
┌──────────────────────────────────────────┐
│ 🎁 Pending Redemptions (5)               │
├──────────────────────────────────────────┤
│ Jane Smith → Salary Bonus (₹500)         │
│ Cost: 500 coins | Balance: 547 coins     │
│ Requested: 2 hours ago                   │
│ ⚠️ Requires Finance approval             │
│ [Forward to Finance] [Reject]            │
├──────────────────────────────────────────┤
│ John Doe → Company Merch                 │
│ Cost: 50 coins | Balance: 123 coins      │
│ [Approve] [Reject]                       │
└──────────────────────────────────────────┘
```

### For Finance Team

1. **Company Coin Bank Overview**
```
┌─────────────────────────────────────────┐
│ 🏦 Company Coin Bank                    │
│ FY 2025-26                              │
├─────────────────────────────────────────┤
│ Total Budget:      10,000 coins         │
│ Allocated to Heads: 3,250 coins         │
│ Allocated to Quests:  425 coins         │
│ Granted by HR:        175 coins         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Available:          6,150 coins         │
│                                         │
│ [View Breakdown] [Download Report]      │
└─────────────────────────────────────────┘
```

2. **Approval Queue**
```
┌──────────────────────────────────────────┐
│ Pending Finance Approvals (2)            │
├──────────────────────────────────────────┤
│ HR Grant Request                          │
│ Amount: 100 coins                        │
│ Reason: Exceptional performance bonus    │
│ For: John Doe                            │
│ Requested by: HR Manager                 │
│ [Approve] [Reject] [Request Details]     │
├──────────────────────────────────────────┤
│ High-Value Redemption                    │
│ Salary Bonus (₹500) - 500 coins         │
│ Employee: Jane Smith (Balance: 547)      │
│ [Approve] [Reject]                       │
└──────────────────────────────────────────┘
```

---

## Migration from Current System

### Step 1: Data Backup
```sql
-- Backup existing points data
CREATE TABLE user_points_log_backup AS 
SELECT * FROM user_points_log;
```

### Step 2: Execute New Schema
```bash
# Run the VAW_COIN_ECONOMY_SCHEMA.sql file in Supabase
```

### Step 3: Migrate Existing Points
```sql
-- The schema auto-migrates data
-- Chat points are zeroed out
-- Other points are converted to coins
```

### Step 4: Remove Chat Points from Frontend
```typescript
// In TeamChat.tsx - Remove this code:
await supabase
  .from('user_points_log')
  .insert({
    user_id: userId,
    points: 2,  // REMOVE THIS
    reason: 'Chat Message Sent',
    category: 'chat_engagement'
  });
```

### Step 5: Update Task Creation UI
Add coin allocation field to task creation form.

### Step 6: Create HR & Finance Dashboards
Build new admin interfaces for quest management and approvals.

---

## Testing Checklist

- [ ] Head can allocate coins within budget
- [ ] Head sees correct deadline (original - 1 day)
- [ ] Employee sees correct deadline (original - 2 days)
- [ ] On-time submission awards full coins
- [ ] Half-time submission awards bonus +5 coins
- [ ] Late submission requires HR approval
- [ ] Penalty calculated correctly (1 coin/day)
- [ ] HR can approve/reject late submissions
- [ ] HR can waive penalties
- [ ] Quest completion tracked correctly
- [ ] HR can award quest coins
- [ ] Reward redemption flow works
- [ ] Finance can approve high-value items
- [ ] Company coin bank tracks correctly
- [ ] Monthly budget resets automatically
- [ ] Chat messages don't award points

---

## Support & Troubleshooting

### Common Issues

**Q: Head can't allocate coins**
A: Check if monthly budget exists and has available balance.

**Q: Late submission not showing for HR approval**
A: Verify status is 'late_submitted' and hr_approval_requested = true.

**Q: Quest rewards not awarded**
A: Ensure HR manually awards via `award_quest_completion` function.

**Q: Company coin bank running low**
A: Contact Finance to increase annual budget or wait for FY reset.

---

**Last Updated**: January 6, 2026  
**Version**: 1.0  
**Status**: Ready for Implementation

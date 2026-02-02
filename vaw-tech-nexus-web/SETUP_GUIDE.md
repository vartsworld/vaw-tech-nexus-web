# Quick Setup Guide for Team Head Dashboard

## Step 1: Execute SQL Schema

### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to `SQL Editor` in the left sidebar
3. Click `New Query`
4. Copy the entire contents of `TEAM_HEAD_COMPLETE_SCHEMA.sql`
5. Paste into the SQL editor
6. Click `Run` or press `Ctrl+Enter`
7. Wait for completion message: "Schema setup complete!"

### Option B: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push --db-url "your-database-url"

# Or run the migration file directly
psql "your-database-url" < TEAM_HEAD_COMPLETE_SCHEMA.sql
```

## Step 2: Verify Tables Created

Run this query in SQL Editor to verify:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'chat_channels',
    'chat_messages',
    'chess_games',
    'chess_stats',
    'chess_game_history',
    'staff_notes',
    'user_activity_log',
    'user_points_log'
)
ORDER BY table_name;
```

You should see all 8 tables listed.

## Step 3: Test Chess ELO Function

```sql
-- Create a test game between two users (replace UUIDs with real user IDs)
INSERT INTO chess_games (player1_id, player2_id, status, started_at)
VALUES (
    'user1-uuid-here',
    'user2-uuid-here',
    'active',
    now()
)
RETURNING id;

-- Complete the game (use the ID returned above)
UPDATE chess_games
SET 
    status = 'completed',
    winner_id = 'user1-uuid-here', -- Winner's UUID
    ended_at = now()
WHERE id = 'game-id-from-above';

-- Check if ELO was updated
SELECT 
    sp.full_name,
    cs.elo_rating,
    cs.games_won,
    cs.games_played
FROM chess_stats cs
JOIN staff_profiles sp ON cs.user_id = sp.user_id
WHERE cs.user_id IN ('user1-uuid-here', 'user2-uuid-here');
```

## Step 4: Create Default Chat Channels

The schema automatically creates a #general channel, but you can add more:

```sql
-- Add department-specific channels
INSERT INTO chat_channels (name, description, is_general)
SELECT 
    LOWER(REPLACE(name, ' ', '-')),
    'Discussion for ' || name || ' department',
    false
FROM departments
WHERE NOT EXISTS (
    SELECT 1 FROM chat_channels 
    WHERE chat_channels.name = LOWER(REPLACE(departments.name, ' ', '-'))
);
```

## Step 5: Test Chat Functionality

1. Open the Team Head Dashboard
2. Navigate to Workspace tab
3. Scroll to the Team Chat section
4. Send a test message
5. Check if you receive 2 points
6. Verify message appears in chat

## Step 6: Test Chess Integration

1. Click on "Chess Arena" widget
2. Start a game vs Bot (for testing UI)
3. For multiplayer:
   - Click "Random Match" or "Challenge" a teammate
   - Play some moves
   - Complete the game
   - Check if ELO rating updates in the Stats tab

## Step 7: Verify Points System

Check total points for a user:
```sql
SELECT get_user_total_points('user-uuid-here');
```

View points breakdown:
```sql
SELECT 
    reason,
    category,
    points,
    created_at
FROM user_points_log
WHERE user_id = 'user-uuid-here'
ORDER BY created_at DESC
LIMIT 20;
```

## Step 8: View Chess Leaderboard

```sql
SELECT 
    full_name,
    elo_rating,
    games_won,
    games_played,
    win_percentage || '%' as win_pct,
    current_win_streak,
    longest_win_streak
FROM chess_leaderboard
LIMIT 10;
```

## Step 9: Check Activity Log

```sql
SELECT 
    activity_type,
    description,
    points_earned,
    created_at
FROM user_activity_log
WHERE user_id = 'user-uuid-here'
    AND DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
```

## Common Issues & Solutions

### Issue: "relation does not exist" error
**Solution**: Make sure you're running the SQL in the correct database. Check schema name is `public`.

### Issue: RLS policies preventing access
**Solution**: Ensure you're logged in as an authenticated user. Check RLS policies with:
```sql
SELECT * FROM pg_policies WHERE tablename = 'chess_games';
```

### Issue: ELO not updating
**Solution**: 
1. Check if trigger is created: 
```sql
SELECT * FROM pg_trigger WHERE tgname = 'chess_game_completion_trigger';
```
2. Verify trigger function exists:
```sql
\df handle_chess_game_completion
```

### Issue: Points not awarded
**Solution**: Check if points log entry was created and trigger fired:
```sql
SELECT * FROM user_points_log 
WHERE created_at > now() - interval '1 hour'
ORDER BY created_at DESC;
```

## Testing Checklist

- [ ] All 8 tables created
- [ ] RLS policies enabled
- [ ] Triggers created and active
- [ ] Functions executable
- [ ] Chat messages save and display
- [ ] Chess games can be created
- [ ] ELO updates after game completion
- [ ] Points awarded for activities
- [ ] Activity log tracks actions
- [ ] Notes can be created/deleted
- [ ] Scrolling to top works on tab change

## Performance Optimization (Optional)

If you have many users, consider adding these indexes:

```sql
-- Additional performance indexes
CREATE INDEX CONCURRENTLY idx_chat_messages_created 
    ON chat_messages(created_at DESC);

CREATE INDEX CONCURRENTLY idx_chess_games_active 
    ON chess_games(status) 
    WHERE status IN ('active', 'waiting');

CREATE INDEX CONCURRENTLY idx_points_today 
    ON user_points_log(user_id, created_at) 
    WHERE created_at >= CURRENT_DATE;
```

## Next Steps

1. Monitor error logs in Supabase Dashboard
2. Test with real users
3. Collect feedback on ELO accuracy
4. Adjust K-factor if needed (default: 32)
5. Consider adding chess time controls
6. Implement chess tournaments

## Support

If you encounter issues:
1. Check Supabase logs in Dashboard > Database > Logs
2. Review `FEATURE_STATUS_REPORT.md` for known issues
3. Test individual functions using SQL queries above
4. Check browser console for frontend errors

---

**Setup Time**: ~10-15 minutes  
**Last Updated**: January 5, 2026  
**Version**: 1.0

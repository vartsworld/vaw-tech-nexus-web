-- Migration: Change assigned_to from uuid to text to support multi-assignee JSON arrays
-- Run this in your Supabase SQL Editor > SQL Editor

-- Step 1: Drop any foreign key constraints on assigned_to if they exist
-- (safe to ignore errors if none exist)
ALTER TABLE staff_tasks DROP CONSTRAINT IF EXISTS staff_tasks_assigned_to_fkey;
ALTER TABLE staff_tasks DROP CONSTRAINT IF EXISTS fk_staff_tasks_assigned_to;

-- Step 2: Change the column type from uuid to text
-- UUID values cast perfectly to text with no data loss
ALTER TABLE staff_tasks ALTER COLUMN assigned_to TYPE text USING assigned_to::text;

-- Done! The column now accepts:
-- Single UUID: "9f9b5a7d-938c-4059-a9f5-a6f1f4508601"
-- Multi UUID:  '["uuid1","uuid2","uuid3"]'

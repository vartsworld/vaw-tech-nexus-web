# Post Scheduler (`/postit`)

A page for staff (social media managers in particular) to plan, schedule and track social posts for **multiple clients**. Linked as **Post Scheduler** in the staff and team-head dashboard sidebars. HR has its own sidebar and no link, but HR and admins can open `/postit` directly.

Modelled on [SamurAIGPT/postiz-cheap](https://github.com/SamurAIGPT/postiz-cheap) (MIT, © Anil Chandra Naidu Matcha): shared calendar, one post record per platform, per-platform character limits and previews, and MuAPI-based publishing. Multi-client support is VAW's own addition.

## Setup

1. Apply `supabase/migrations/20261026000000_post_scheduler.sql`. It creates `postit_accounts`, `postit_posts`, RLS policies and the public `postit-media` storage bucket.
2. Regenerate the Supabase types. The hook casts to an untyped client until you do.
3. That is enough to use it as a **planner**: schedule posts, see what is due, copy the caption, post by hand, then click **Mark as posted**.

## Optional: auto-publish

Auto-publish goes through the `postit-publish` edge function and [MuAPI](https://muapi.ai).

```
supabase secrets set MUAPI_API_KEY=... POSTIT_CRON_SECRET=<long random string>
supabase functions deploy postit-publish --no-verify-jwt
```

Run it every 5 minutes with pg_cron and pg_net:

```sql
select cron.schedule('postit-publish', '*/5 * * * *', $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/postit-publish',
    headers := jsonb_build_object('x-cron-secret', '<POSTIT_CRON_SECRET>', 'Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
$$);
```

Each account needs its MuAPI external account id (Accounts tab). A post is sent automatically only if it is set to **Auto-publish**, has media, and its account has that id.

## Limits

- Request shapes follow postiz-cheap and have **not** been tested against live MuAPI. Instagram image placement is unverified.
- Auto-publish sends only the **first** media file. Text-only auto-posting is not supported, because MuAPI needs media.
- The function was syntax-checked and its pure logic tested (`node scripts/test-postit-publish.mjs`), but it has not been run in Deno or against a live project.
- Without the function and cron, nothing is published automatically.

## Permissions

All staff can view, create and edit posts and accounts. A post can be deleted by its creator or a manager. An account can be deleted by a manager only. Deleting a client removes its accounts and keeps its posts, unassigned.

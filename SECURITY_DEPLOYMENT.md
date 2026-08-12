# Security deployment checklist

The website code and forms are unchanged visually, but the security migration
must be deployed to Supabase before its protections are active.

## Required before publishing

1. Link the intended project and apply `supabase/migrations/20260812000000_security_hardening.sql` with `supabase db push`.
2. If `ADMIN_EMAIL` differs from `jeannettekhoury012@gmail.com`, change the email in the migration before applying it. Confirm that exactly one row exists in `public.app_admins` for the real admin account.
3. In Supabase Storage policies, remove any older policy that permits anonymous or non-admin writes to the `project-images` bucket. The migration adds restrictive application policies, but PostgreSQL policies are additive.
4. Deploy `supabase/functions/admin-login/index.ts` after the migration. The function now depends on `reserve_admin_login_attempt`.
5. In Supabase Auth, enable CAPTCHA/bot protection and MFA for the admin account. The public Supabase password endpoint remains a parallel authentication route, so the custom Edge Function lock cannot protect that endpoint by itself.
6. Review Supabase Auth rate limits for password sign-in and configure an upstream gateway/WAF if the five-attempt/two-hour rule must apply to every possible login route.
7. Confirm that the Edge runtime overwrites forwarded-IP headers. Test `CF-Connecting-IP`, `X-Real-IP`, and `X-Forwarded-For`; do not trust the per-IP limiter until this is verified.
8. Run these deployment checks with the anonymous key and a non-admin account:
   - project `SELECT` succeeds;
   - project `INSERT`, `UPDATE`, and `DELETE` fail;
   - `project-images` upload/update/delete fail;
   - `get_website_stats()` and visit Realtime reads fail;
   - a valid admin can perform all intended CMS actions.

## Ongoing controls

- Use a long, unique admin password and MFA.
- Keep the service-role key only in Supabase function secrets; never use a `VITE_` variable for it.
- Review Auth, Edge Function, and database logs for repeated failures.
- Repeat dependency and source audits after authentication, upload, or policy changes.

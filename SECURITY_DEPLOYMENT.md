# Security deployment checklist

The security migrations and Edge Functions must be deployed to Supabase before
their protections are active.

## Required before publishing

1. If `ADMIN_EMAIL` differs from `jeannettekhoury012@gmail.com`, update the address in both migrations before applying them.
2. Link the intended project and apply all files in `supabase/migrations` with `supabase db push`.
3. Deploy both functions: `supabase functions deploy admin-login` and `supabase functions deploy record-visit`. The checked-in `supabase/config.toml` marks these pre-authentication endpoints with `verify_jwt = false`; their handlers perform validation and database-backed limiting.
4. Confirm that exactly one row exists in `public.app_admins` for the real administrator.
5. On the first admin login, scan the displayed TOTP QR code with an authenticator app and enter its six-digit code. Store the displayed setup secret in a secure recovery location. Database/Storage authorization always rejects password-only sessions.
6. Do not switch on Supabase sign-in CAPTCHA until a CAPTCHA widget/token is integrated into the login request. Enabling it without sending a token will block legitimate login.
7. Review native Supabase Auth password rate limits. The public password endpoint remains a parallel route around the custom Edge Function counter, but enforced TOTP means the password alone cannot authorize CMS actions.
8. Confirm that the Edge runtime overwrites forwarded-IP headers. Test `CF-Connecting-IP`, `X-Real-IP`, and `X-Forwarded-For`; do not rely on either per-IP limiter until this is verified.
9. Run these deployment checks with the anonymous key and a non-admin account:
   - project `SELECT` succeeds;
   - project `INSERT`, `UPDATE`, and `DELETE` fail;
   - `project-images` upload/update/delete fail;
   - direct inserts into `website_visits` fail;
   - `record-visit` accepts normal public paths but rate-limits repeated calls;
   - `get_website_stats()` and visit Realtime reads fail;
   - an admin password-only (`aal1`) session fails after TOTP enrollment;
   - an admin TOTP (`aal2`) session can perform all intended CMS actions.
10. Put the custom domain behind a header-capable proxy/CDN and set `Content-Security-Policy: frame-ancestors 'none'` plus `X-Frame-Options: DENY`. GitHub Pages does not provide these headers directly.

## Ongoing controls

- Use a long, unique admin password and MFA.
- Keep the service-role key only in Supabase function secrets; never use a `VITE_` variable for it.
- Review Auth, Edge Function, and database logs for repeated failures.
- Repeat dependency and source audits after authentication, upload, or policy changes.

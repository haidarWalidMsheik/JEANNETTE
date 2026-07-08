# Jeannette Portfolio

This version uses Supabase only for CRUD data, project photos, admin email verification, and admin authentication.

## Run locally

```bash
npm install
npm run dev
```

## Connect Supabase

Create `.env` from `.env.example`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_WHATSAPP_NUMBER=96176818120
```

Run `SUPABASE_DATABASE_SETUP.sql` inside Supabase SQL Editor.

Before running SQL, replace:

```sql
PUT_YOUR_ADMIN_EMAIL_HERE
```

with the real admin email.

Then create the same admin user in Supabase:

Authentication → Users → Add user

The CRUD page is `/crud` and the login page is `/admin-login`.

Do not put a real password in React code. Supabase Auth checks the password securely.

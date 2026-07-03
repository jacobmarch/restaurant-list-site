# Our Restaurant Visits

A private, mobile-first web app for tracking every restaurant you've visited together — built with Next.js and Supabase.

## Features

- Email/password login (sign-up disabled; accounts created in Supabase dashboard)
- Smart restaurant name formatting and duplicate detection
- Autocomplete when adding visits to existing restaurants
- Timeline grouped by restaurant with visit notes

## Local development

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials from **Project Settings → API**:

   - `NEXT_PUBLIC_SUPABASE_URL` — the **Project URL** (e.g. `https://abcdefgh.supabase.co`). Do **not** append `/rest/v1/`.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the **anon public** key

3. **Set up Supabase**

   - Create a project at [supabase.com](https://supabase.com)
   - Run the SQL in [`supabase/migrations/20260703000000_initial_schema.sql`](supabase/migrations/20260703000000_initial_schema.sql) in the Supabase SQL Editor
   - Go to **Authentication → Providers → Email** and **disable sign-ups**
   - Create your two accounts under **Authentication → Users**
   - Under **Authentication → URL Configuration**, add `http://localhost:3000` to Site URL and Redirect URLs

4. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy
5. In Supabase **Authentication → URL Configuration**, add your Vercel production URL to Site URL and Redirect URLs

## Tech stack

- [Next.js](https://nextjs.org) (App Router)
- [Supabase](https://supabase.com) (Postgres + Auth)
- [Tailwind CSS](https://tailwindcss.com)

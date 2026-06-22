# **AcademiHub** — Academic Project Management Hub

A centralized project submission portal for academic courses. Streamlines department registration, group management, project submissions, and reporting.

## Features

- **Class Rep Dashboard** — Register departments, manage groups, track submissions
- **Student Lookup** — Search by matric number to verify submission status
- **Admin Panel** — Full CRUD for departments, groups, submissions, students, projects
- **PDF Report Export** — Generate comprehensive departmental reports with project filtering
- **Email Notifications** — Automated Brevo emails for registration confirmation, submission receipts, deadline reminders
- **Portal Timer** — Set automatic submission deadlines with email notifications
- **AI Chat Assistant** — Built-in AI helper for quick answers
- **Dark/Light Theme** — Full theme support
- **Project Scoping** — Organize everything by project/course

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Styling:** CSS with dark/light theme, glass morphism, animations
- **Email:** Brevo (Sendinblue) transactional API
- **Deployment:** Vercel

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/globalgraphics129-rgb/academihub.git
cd academihub
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
BREVO_API_KEY=your-brevo-api-key-here
NEXT_PUBLIC_ADMIN_PASSWORD=academihubadmin2025
```

### 4. Database setup

Run the SQL in `supabase-schema.sql` in your Supabase SQL editor to create all tables and policies.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── admin/              # Admin panel (password protected)
├── api/
│   ├── admin/          # Admin API (CRUD, projects, portal, email)
│   ├── auth/           # Authentication (register, login, logout, me)
│   ├── projects/       # Public projects API
│   ├── portal-settings/ # Public portal settings
│   ├── register-department/ # Department registration
│   ├── register-group/     # Group registration
│   ├── submit-project/     # Project submission
│   └── upload-members/     # CSV/PDF member list upload
├── components/         # Shared components (ThemeToggle, PortalTimer)
├── dashboard/          # Class rep dashboard
├── dashboard/student/  # Student submission lookup
├── login/              # Login page
├── register/           # Registration page
├── register-department/ # Department registration page
├── register-group/     # Group registration page
├── submit/             # Project submission page
└── page.tsx            # Landing page
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, project cards, countdown |
| `/login` | User login |
| `/register` | Class rep registration |
| `/register-student` | Student registration (email verification) |
| `/register-department` | Department registration (project-scoped) |
| `/register-group` | Group registration |
| `/submit` | Project submission with member management |
| `/dashboard` | Class rep dashboard |
| `/dashboard/student` | Student submission lookup |
| `/admin` | Full admin panel |

## Deployment

Deploy to Vercel:

```bash
npm run build
npx vercel --prod
```

Set the environment variables in the Vercel dashboard.

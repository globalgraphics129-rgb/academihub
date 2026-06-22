-- AcademiHub — Complete Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- PROJECTS (multi-course support)
-- ====================================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default project
INSERT INTO projects (name, description, active)
VALUES ('Default Project', 'Default project — all existing submissions', TRUE)
ON CONFLICT DO NOTHING;

-- ====================================================================
-- USERS & AUTH
-- ====================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'rep' CHECK (role IN ('admin', 'rep', 'student')),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_users_email ON users(email);

-- ====================================================================
-- DEPARTMENTS (now scoped to a project)
-- ====================================================================

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  rep_name TEXT NOT NULL,
  rep_email TEXT NOT NULL,
  rep_phone TEXT,
  number_of_groups INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, department)
);

-- ====================================================================
-- GROUPS
-- ====================================================================

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  group_number INTEGER NOT NULL,
  leader_name TEXT NOT NULL,
  leader_email TEXT NOT NULL,
  leader_phone TEXT,
  project_name TEXT NOT NULL,
  submitted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(department_id, group_number)
);

-- ====================================================================
-- SUBMISSIONS
-- ====================================================================

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  group_number INTEGER NOT NULL,
  project_name TEXT NOT NULL,
  leader_name TEXT NOT NULL,
  leader_email TEXT NOT NULL,
  leader_phone TEXT,
  members JSONB NOT NULL DEFAULT '[]'::jsonb,
  github_link TEXT NOT NULL,
  notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- PORTAL SETTINGS
-- ====================================================================

CREATE TABLE portal_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  closes_at TIMESTAMPTZ,
  closing_soon_notified BOOLEAN NOT NULL DEFAULT FALSE,
  closed_notified BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO portal_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- ROW LEVEL SECURITY
-- ====================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_settings ENABLE ROW LEVEL SECURITY;

-- Allow public reads for dropdowns
CREATE POLICY "Public read projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Public read departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Public read groups" ON groups FOR SELECT USING (true);
CREATE POLICY "Public read submissions" ON submissions FOR SELECT USING (true);

-- ====================================================================
-- INDEXES
-- ====================================================================

CREATE INDEX idx_groups_dept ON groups(department_id);
CREATE INDEX idx_submissions_dept ON submissions(department);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at DESC);
CREATE INDEX idx_departments_project ON departments(project_id);
CREATE INDEX idx_groups_project ON groups(project_id);
CREATE INDEX idx_submissions_project ON submissions(project_id);

-- ====================================================================
-- STUDENT VERIFICATION CODES
-- ====================================================================

CREATE TABLE student_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  matric TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_student_verifications_email ON student_verifications(email);
CREATE INDEX idx_student_verifications_code ON student_verifications(code);

-- ====================================================================
-- MIGRATE EXISTING DATA TO DEFAULT PROJECT
-- ====================================================================

DO $$
DECLARE
  default_project_id UUID;
BEGIN
  SELECT id INTO default_project_id FROM projects ORDER BY created_at ASC LIMIT 1;

  UPDATE departments SET project_id = default_project_id WHERE project_id IS NULL;
  UPDATE groups SET project_id = default_project_id WHERE project_id IS NULL;
  UPDATE submissions SET project_id = default_project_id WHERE project_id IS NULL;
END $$;

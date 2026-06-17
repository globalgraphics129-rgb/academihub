-- COS 102 Project Hub — Supabase Schema
-- Run this in your Supabase SQL Editor

-- ⚠️ If you already have the old schema, run this migration first:
-- ALTER TABLE submissions ALTER COLUMN members TYPE JSONB USING members::jsonb;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department TEXT NOT NULL UNIQUE,
  rep_name TEXT NOT NULL,
  rep_email TEXT NOT NULL,
  rep_phone TEXT,
  number_of_groups INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Submissions table
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Row Level Security (disable for service role usage from API)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Allow public reads (for dropdowns on frontend)
CREATE POLICY "Public read departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Public read groups" ON groups FOR SELECT USING (true);
CREATE POLICY "Public read submissions" ON submissions FOR SELECT USING (true);

-- Only service role can insert/update/delete (handled via API routes)
-- (Service role bypasses RLS by default)

-- Indexes for performance
CREATE INDEX idx_groups_dept ON groups(department_id);
CREATE INDEX idx_submissions_dept ON submissions(department);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at DESC);

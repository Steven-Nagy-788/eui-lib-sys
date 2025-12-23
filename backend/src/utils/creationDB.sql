/* 
====================================================================
   MASTER DATABASE SCHEMA - EUI LIBRARY SYSTEM
   Version: Final Production
   Features: Manual Auth, MARC Data, Course Logic, UI Alignment
====================================================================
*/

-- 1. NUCLEAR CLEANUP (Drops everything to start fresh)
--    WARNING: This deletes all data.
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS book_copies CASCADE;
DROP TABLE IF EXISTS course_books CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS loan_policies CASCADE;

-- Drop Enums
DROP TYPE IF EXISTS loan_status CASCADE;
DROP TYPE IF EXISTS book_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- 2. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. ENUMERATED TYPES
CREATE TYPE user_role AS ENUM ('admin', 'student', 'professor', 'ta');
CREATE TYPE book_status AS ENUM ('available', 'maintenance', 'lost');
CREATE TYPE loan_status AS ENUM ('pending', 'active', 'returned', 'overdue', 'rejected');

-- 4. TABLES

-- Table: LOAN POLICIES
-- Defines the rules (e.g., Students get 3 books for 7 days).
CREATE TABLE loan_policies (
  role user_role PRIMARY KEY,
  max_books INT NOT NULL DEFAULT 3,
  loan_days INT NOT NULL DEFAULT 7
);

-- Seed Default Policies
INSERT INTO loan_policies (role, max_books, loan_days) VALUES
  ('student', 3, 7),
  ('professor', 10, 30),
  ('ta', 5, 14),
  ('admin', 50, 365);

-- Table: USERS
-- Stores login credentials and profile data displayed in "Patrons" UI.
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  university_id TEXT UNIQUE NOT NULL, -- e.g., "21-101010"
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,      -- BCRYPT hash for Manual Auth
  
  role user_role DEFAULT 'student',
  
  -- UI Specific Fields
  faculty TEXT,                       -- e.g., "Computer Science"
  academic_year INT,                  -- e.g., 4
  infractions_count INT DEFAULT 0,    -- Tracks "Remove Infractions" feature
  
  is_blacklisted BOOLEAN DEFAULT FALSE,
  blacklist_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: COURSES
-- Linked to Faculty dropdown in UI. Overrides loan duration.
CREATE TABLE courses (
  code TEXT PRIMARY KEY,              -- e.g., "C-MA111"
  name TEXT NOT NULL,
  term TEXT,
  faculty TEXT,                       -- Which faculty offers this course?
  course_loan_days INT DEFAULT 90     -- Special duration (e.g., Semester Loan)
);

-- Table: ENROLLMENTS
-- Junction: Student <-> Course. Used to validate if a student can get the 90-day loan.
CREATE TABLE enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  course_code TEXT REFERENCES courses(code) ON DELETE CASCADE NOT NULL,
  semester TEXT NOT NULL,
  UNIQUE(student_id, course_code)
);

-- Table: BOOKS (The Catalog)
-- Stores the abstract book details. Matches "Add Book" UI inputs.
CREATE TABLE books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  isbn TEXT UNIQUE NOT NULL,
  
  -- UI Specific Inputs
  book_number TEXT,                   -- Internal Library ID
  call_number TEXT,                   -- Shelf Location (e.g., QA76...)
  
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  publisher TEXT,
  publication_year INT,
  marc_data JSONB,                    -- Stores complex MARC fields (008, 245, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: COURSE BOOKS
-- Junction: Course <-> Book. Defines which books are required for a course.
CREATE TABLE course_books (
  course_code TEXT REFERENCES courses(code) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  PRIMARY KEY (course_code, book_id)
);

-- Table: BOOK COPIES (The Inventory)
-- Represents physical items on the shelf.
CREATE TABLE book_copies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  
  -- THE BARCODE SOLUTION:
  -- Auto-increments starting at 10001. 
  -- Easy to print, easy to type if scanner fails.
  accession_number BIGINT GENERATED ALWAYS AS IDENTITY (START WITH 10001) UNIQUE,
  
  is_reference BOOLEAN DEFAULT FALSE, -- Handles the 20-30% Reserve Policy
  status book_status DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: LOANS (Circulation)
-- Tracks who borrowed what and when.
CREATE TABLE loans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  copy_id UUID REFERENCES book_copies(id) ON DELETE CASCADE NOT NULL,
  
  status loan_status DEFAULT 'pending',
  
  request_date TIMESTAMPTZ DEFAULT NOW(),
  approval_date TIMESTAMPTZ,          -- When Admin clicks "Accept"
  due_date TIMESTAMPTZ,               -- Calculated via Python Service
  return_date TIMESTAMPTZ             -- When Admin clicks "Returned"
);
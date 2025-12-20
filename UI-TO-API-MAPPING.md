# UI Pages to API Endpoints Mapping

Complete documentation of which API endpoints each UI page uses, including inputs and outputs.

---

## 🔐 Login Page

**File:** `Login Page.png`

### Endpoints Used:

#### 1. POST `/users/login`
**Purpose:** Authenticate user and get JWT token

**Input:**
```json
{
  "email": "string (email or university ID)",
  "password": "string"
}
```

**Output:**
```json
{
  "access_token": "string (JWT token)",
  "token_type": "bearer"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `400 Bad Request`: Missing fields

---

## 👨‍🎓 Student Pages

### 1. Student Profile Page

**File:** `Student Profile Page.png`

#### Endpoints Used:

##### GET `/users/{user_id}`
**Purpose:** Get current user profile information

**Input:** None (user_id from JWT token)

**Output:**
```json
{
  "id": "uuid",
  "university_id": "string",
  "full_name": "string",
  "email": "string",
  "role": "student",
  "faculty": "string",
  "academic_year": 3,
  "infractions_count": 0,
  "is_blacklisted": false,
  "blacklist_note": null,
  "created_at": "2025-01-01T00:00:00Z"
}
```

##### PUT `/users/{user_id}`
**Purpose:** Update profile information

**Input:**
```json
{
  "full_name": "string (optional)",
  "email": "string (optional)",
  "password": "string (optional)"
}
```

---

### 2. Student Course Books Page

**File:** `Student Course Books Page.png`

#### Endpoints Used:

##### GET `/courses/enrollments/student/{student_id}`
**Purpose:** Get all courses student is enrolled in

**Output:**
```json
[
  {
    "id": "uuid",
    "student_id": "uuid",
    "course_code": "C-MA111",
    "semester": "Fall 2025"
  }
]
```

##### GET `/courses/{course_code}/books`
**Purpose:** Get required books for each course

**Output:**
```json
[
  {
    "course_code": "C-MA111",
    "book_id": "uuid"
  }
]
```

##### GET `/books/{book_id}`
**Purpose:** Get book details for each required book

**Output:**
```json
{
  "id": "uuid",
  "isbn": "978-0134685991",
  "book_number": "BK001",
  "call_number": "QA76.73.P98",
  "title": "Introduction to Algorithms",
  "author": "Thomas H. Cormen",
  "publisher": "MIT Press",
  "publication_year": 2009,
  "marc_data": {},
  "created_at": "2025-01-01T00:00:00Z"
}
```

##### GET `/book-copies/book/{book_id}/stats`
**Purpose:** Check availability of each book

**Output:**
```json
{
  "total": 10,
  "available": 5,
  "reference": 3,
  "circulating": 7
}
```

---

### 3. Student Course Books Reserve Page

**File:** `Student Course Books Reserve Page.png`

#### Endpoints Used:

##### POST `/loans/request?copy_id={copy_id}`
**Purpose:** Create loan request for a book

**Input:** Query parameter `copy_id` (UUID)

**Output:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "copy_id": "uuid",
  "status": "pending",
  "request_date": "2025-01-01T10:00:00Z",
  "approval_date": null,
  "due_date": null,
  "return_date": null
}
```

**Error Responses:**
- `400`: User blacklisted
- `400`: Max books limit reached
- `400`: Book not available
- `400`: Already has this book on loan

---

### 4. Student Bookbag Page

**File:** `Student Bookbag Page.png`

#### Endpoints Used:

##### GET `/loans/user/{user_id}`
**Purpose:** Get all loans for current student

**Output:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "copy_id": "uuid",
    "status": "active",
    "request_date": "2025-01-01T10:00:00Z",
    "approval_date": "2025-01-01T11:00:00Z",
    "due_date": "2025-01-08T11:00:00Z",
    "return_date": null
  }
]
```

##### GET `/book-copies/{copy_id}`
**Purpose:** Get details of each borrowed book copy

**Output:**
```json
{
  "id": "uuid",
  "book_id": "uuid",
  "accession_number": 10001,
  "is_reference": false,
  "status": "available",
  "created_at": "2025-01-01T00:00:00Z"
}
```

##### GET `/books/{book_id}`
**Purpose:** Get book details for each copy

---

### 5. Student Notices Page

**File:** `Student Notices Page.png`

#### Endpoints Used:

##### GET `/loans/user/{user_id}?status=overdue`
**Purpose:** Get overdue loans

##### GET `/loans/user/{user_id}?status=active`
**Purpose:** Get active loans with due dates

**Output:** Same as bookbag page

---

## 👨‍💼 Admin Pages

### 1. Admin Profile Page

**File:** `Admin Profile Page.png`

#### Endpoints Used:

Same as Student Profile Page
- GET `/users/{user_id}`
- PUT `/users/{user_id}`

---

### 2. Admin Books Page

**File:** `Admin Books Page.png`

#### Endpoints Used:

##### GET `/books/?skip=0&limit=100`
**Purpose:** List all books

##### POST `/books/`
**Purpose:** Create new book

**Input:**
```json
{
  "isbn": "978-0134685991",
  "book_number": "BK001",
  "call_number": "QA76.73.P98",
  "title": "Introduction to Algorithms",
  "author": "Thomas H. Cormen",
  "publisher": "MIT Press",
  "publication_year": 2009,
  "marc_data": {}
}
```

##### PATCH `/books/{book_id}`
**Purpose:** Update book

##### DELETE `/books/{book_id}`
**Purpose:** Delete book

##### GET `/book-copies/book/{book_id}`
**Purpose:** View copies for each book

##### POST `/book-copies/bulk`
**Purpose:** Add multiple copies at once

**Input:**
```json
{
  "book_id": "uuid",
  "quantity": 10
}
```

**Query Parameter:** `reference_percentage=30`

---

### 3. Admin Students Page

**File:** `Admin Students Page.png`

#### Endpoints Used:

##### GET `/users/?skip=0&limit=100`
**Purpose:** List all users (filter by role=student on frontend)

##### GET `/users/{user_id}`
**Purpose:** View student details

##### POST `/users/`
**Purpose:** Create new student

**Input:**
```json
{
  "university_id": "21-101010",
  "full_name": "John Doe",
  "email": "john@eui.edu.eg",
  "password": "password123",
  "role": "student",
  "faculty": "Computer Science",
  "academic_year": 3
}
```

##### PUT `/users/{user_id}`
**Purpose:** Update student info

##### POST `/users/{user_id}/clear-infractions`
**Purpose:** Clear student infractions

##### POST `/users/{user_id}/blacklist?reason={reason}`
**Purpose:** Add student to blacklist

##### DELETE `/users/{user_id}/blacklist`
**Purpose:** Remove from blacklist

---

### 4. Admin Student Info Page

**File:** `Admin Student Info Page.png`

#### Endpoints Used:

##### GET `/users/{user_id}`
**Purpose:** Get detailed student information

##### GET `/courses/enrollments/student/{student_id}`
**Purpose:** View student's enrolled courses

##### GET `/loans/user/{user_id}`
**Purpose:** View student's loan history

---

### 5. Admin Circulation Page

**File:** `Admin Circulation Page.png`

#### Endpoints Used:

##### GET `/loans/status/active`
**Purpose:** Get all active loans

##### GET `/loans/overdue`
**Purpose:** Get all overdue loans

##### POST `/loans/{loan_id}/return?increment_infractions=true`
**Purpose:** Process book return

**Query Parameters:**
- `increment_infractions`: boolean (true if overdue)

##### GET `/book-copies/accession/{accession_number}`
**Purpose:** Scan barcode to find book copy

---

### 6. Admin Requests Page

**File:** `Admin Requests Page.png`

#### Endpoints Used:

##### GET `/loans/status/pending`
**Purpose:** Get all pending loan requests

##### POST `/loans/{loan_id}/approve`
**Purpose:** Approve loan request

**Output:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "copy_id": "uuid",
  "status": "active",
  "request_date": "2025-01-01T10:00:00Z",
  "approval_date": "2025-01-01T11:00:00Z",
  "due_date": "2025-01-08T11:00:00Z",
  "return_date": null
}
```

##### POST `/loans/{loan_id}/reject`
**Purpose:** Reject loan request

---

### 7. Admin Database Page

**File:** `Admin Database Page.png`

#### Endpoints Used:

##### GET `/courses/`
**Purpose:** List all courses

##### POST `/courses/`
**Purpose:** Create new course

**Input:**
```json
{
  "code": "C-MA111",
  "name": "Introduction to Algorithms",
  "term": "Fall 2025",
  "faculty": "Computer Science",
  "course_loan_days": 90
}
```

##### PATCH `/courses/{course_code}`
**Purpose:** Update course

##### DELETE `/courses/{course_code}`
**Purpose:** Delete course

##### POST `/courses/enrollments`
**Purpose:** Enroll student in course

**Input:**
```json
{
  "student_id": "uuid",
  "course_code": "C-MA111",
  "semester": "Fall 2025"
}
```

##### POST `/courses/course-books`
**Purpose:** Add book to course

**Input:**
```json
{
  "course_code": "C-MA111",
  "book_id": "uuid"
}
```

---

## 📊 Common Filters & Search (To Be Implemented)

### Book Search
- GET `/books/search?q={query}` - Search by title, author, ISBN
- GET `/books/filter?year={year}&publisher={publisher}`

### User Search
- GET `/users/search?q={query}` - Search by name, email, ID
- GET `/users/filter?role={role}&faculty={faculty}`

### Loan Filters
- GET `/loans/?from_date={date}&to_date={date}&status={status}`

---

## 🔒 Authentication Requirements

### Public Endpoints (No Auth):
- `POST /users/login` - Login endpoint only

### Authenticated Users (Any Role) - Requires Valid JWT Token:

All endpoints require authentication except login. The following endpoints are accessible to any authenticated user (student or admin):

#### Book Endpoints:
- `GET /books/` - List all books
- `GET /books/{book_id}` - Get book details
- `GET /books/search/` - Search books

#### Book Copy Endpoints:
- `GET /book-copies/` - List all book copies
- `GET /book-copies/book/{book_id}` - Get copies of specific book
- `GET /book-copies/book/{book_id}/stats` - Get copy statistics
- `GET /book-copies/accession/{accession_number}` - Get copy by accession number
- `GET /book-copies/{copy_id}` - Get specific copy details

#### Course Endpoints:
- `GET /courses/` - List all courses
- `GET /courses/faculty/{faculty}` - List courses by faculty
- `GET /courses/{course_code}` - Get course details

#### Enrollment Endpoints:
- `GET /courses/enrollments/all` - List all enrollments
- `GET /courses/{course_code}/enrollments` - Get course enrollments
- `GET /courses/enrollments/student/{student_id}` - Get student enrollments
- `GET /courses/enrollments/{enrollment_id}` - Get specific enrollment

#### Course Books Endpoints:
- `GET /courses/{course_code}/books` - Get books for course
- `GET /courses/books/{book_id}/courses` - Get courses requiring book

#### Loan Endpoints:
- `GET /loans/` - List all loans
- `GET /loans/status/{status}` - Get loans by status
- `GET /loans/user/{user_id}` - Get user loans
- `GET /loans/overdue` - Get overdue loans
- `GET /loans/{loan_id}` - Get specific loan
- `GET /loans/policies/all` - Get all loan policies
- `GET /loans/policies/{role}` - Get policies for role

#### User Endpoints:
- `GET /users/` - List all users
- `GET /users/{user_id}` - Get user details
- `GET /users/search/` - Search users
- `PUT /users/{user_id}` - Update own profile (users can only update their own)

### Admin Only Endpoints - Requires Admin Role:

#### Book Management:
- `POST /books/` - Create new book
- `PUT /books/{book_id}` - Update book
- `DELETE /books/{book_id}` - Delete book

#### Book Copy Management:
- `POST /book-copies/` - Create new copy
- `PUT /book-copies/{copy_id}` - Update copy
- `DELETE /book-copies/{copy_id}` - Delete copy

#### Course Management:
- `POST /courses/` - Create new course
- `PUT /courses/{course_code}` - Update course
- `DELETE /courses/{course_code}` - Delete course

#### Enrollment Management:
- `POST /courses/enrollments` - Enroll student
- `DELETE /courses/enrollments/{enrollment_id}` - Remove enrollment

#### Course Books Management:
- `POST /courses/course-books` - Add book to course
- `DELETE /courses/{course_code}/books/{book_id}` - Remove book from course

#### Loan Management:
- `POST /loans/` - Create loan (admin bypass)
- `POST /loans/{loan_id}/approve` - Approve loan
- `POST /loans/{loan_id}/reject` - Reject loan
- `POST /loans/{loan_id}/return` - Process return
- `POST /loans/{loan_id}/renew` - Renew loan
- `PUT /loans/{loan_id}` - Update loan
- `DELETE /loans/{loan_id}` - Delete loan
- `POST /loans/policies` - Create loan policy
- `PUT /loans/policies/{role}` - Update loan policy
- `DELETE /loans/policies/{role}` - Delete loan policy

#### User Management:
- `POST /users/` - Create new user
- `PUT /users/{user_id}/role` - Change user role
- `PUT /users/{user_id}/faculty` - Change user faculty
- `POST /users/{user_id}/infractions` - Add infraction
- `POST /users/{user_id}/clear-infractions` - Clear infractions
- `POST /users/{user_id}/blacklist` - Blacklist user
- `DELETE /users/{user_id}/blacklist` - Remove from blacklist
- `DELETE /users/{user_id}` - Delete user

#### Statistics (Admin Only):
- `GET /stats/dashboard` - Dashboard statistics
- `GET /stats/books` - Book statistics
- `GET /stats/users` - User statistics
- `GET /stats/loans` - Loan statistics
- `GET /stats/courses` - Course statistics
- `GET /stats/popular-books` - Popular books report
- `GET /stats/overdue-report` - Overdue report

---

## 📝 Notes

1. **JWT Token:** Must be included in `Authorization: Bearer {token}` header for all authenticated requests
2. **User ID:** For student endpoints, user_id is extracted from JWT token automatically
3. **Pagination:** Most list endpoints support `?skip=0&limit=100` query parameters
4. **Error Handling:** All endpoints return standard HTTP status codes (200, 201, 400, 401, 403, 404, 500)
5. **Date Format:** All dates in ISO 8601 format: `2025-01-01T10:00:00Z`
6. **UUIDs:** All IDs are UUID v4 format

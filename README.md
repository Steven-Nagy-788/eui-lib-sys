# EUI Library Management System

A comprehensive library management system for universities built with FastAPI, Supabase, and React.

## Tech Stack

- **Backend:** FastAPI (Python)
- **Database:** Supabase (PostgreSQL)
- **Frontend:** React (Coming Soon)

## Project Status

**Overall Progress:** 90% Complete  
**Backend API:** 100% ✅  
**Frontend UI:** 85% ✅  
**Testing:** 30% 🟡

> 📊 **Detailed Progress Report:** See [PROJECT-PROGRESS.md](PROJECT-PROGRESS.md) for comprehensive breakdown by grading rubric  
> 🗺️ **UI-API Integration Guide:** See [UI-TO-API-MAPPING.md](UI-TO-API-MAPPING.md) for complete endpoint mapping

### ✅ Completed Features

#### Backend API (100% Complete)

**Authentication & Authorization** ✅
- JWT token generation and verification
- Role-based access control (Admin, Professor, TA, Student)
- Protected endpoints with `get_current_user()` dependency
- Admin-only operations middleware
- Self-access permissions (users can edit own profile)

**User Management** ✅
- Full CRUD operations for users
- Login/authentication with hashed passwords
- Blacklist management (add/remove with notes)
- Infractions tracking and reset
- User deletion (admin only)
- User search by name, email, or university ID
- **Loan count tracking** (active/total loans per user)

**Book Catalog** ✅
- Full CRUD operations (Create, Read, Update, Delete)
- ISBN tracking and MARC data support
- Book number and call number management
- Partial updates (PATCH) support
- Book search by title, author, or ISBN
- **Books with stats and courses** (optimized single query)

**Book Copies (Physical Inventory)** ✅
- Individual and bulk copy creation
- Automatic 30/70 reference/circulating split
- Barcode system (accession numbers)
- Availability statistics per book
- **Smart status management** (available/maintenance/lost)
- **Real-time borrower tracking** (active loan detection)
- **Accurate availability counting** (excludes checked-out copies)

**Course Management** ✅
- Full CRUD for courses with faculty tracking
- Student enrollment system
- Course-specific loan duration (90 days override)
- Required books per course
- Semester/term tracking

**Loan/Circulation System** ✅
- **Complete 3-state workflow:**
  - `pending` - Request awaiting admin approval
  - `pending_pickup` - Approved, ready for patron pickup
  - `active` - Book checked out to patron
- Multi-step validation:
  - Blacklist checking
  - Max books limit enforcement (from loan_policies)
  - Copy availability verification
  - Duplicate loan detection
- Smart due date calculation:
  - Course override (90 days if enrolled in course)
  - Role-based defaults (professor, TA, student)
- **Approval/checkout workflow** (admin only)
- **Cancel/reject operations**
- Return processing with automatic infraction tracking
- **Automatic copy status updates** (available ↔ maintenance)
- Overdue detection and marking
- Loan search with multiple filters
- **Loans with book/user details** (optimized queries)

**Statistics & Analytics** ✅
- Dashboard overview (books, users, loans)
- Book statistics (total, available, most borrowed)
- Loan statistics (by status, by month, top borrowers)
- User statistics (by role, blacklisted, infractions)

**Code Quality & Architecture** ✅
- Clean 3-layer architecture (Router → Service → Broker)
- PascalCase naming convention (follows SimpleAPIArchitecture pattern)
- No excessive try-except blocks (performance optimized)
- Dependency injection for auth (no manual token checking)
- Comprehensive documentation and API guides

---

### 🟢 Frontend Status (85% Complete)

#### ✅ Completed Features

**Authentication & Layout** (100%)
- University-branded login page
- JWT token management with auto-refresh
- Protected route system
- Responsive layout with sidebar navigation
- User profile display

**Admin Pages** (90%)
- ✅ **Books Management** - Full CRUD with copy management
  - Search by title/author/ISBN
  - Add/edit/delete books
  - View copies with borrower info
  - **Visual status indicators** (available/checked out/reference)
  - Bulk copy creation
  - Faculty filtering
- ✅ **Patrons Management** - Complete user administration
  - User listing with search
  - **Real-time loan counts** (active/total)
  - Blacklist management with reasons
  - Infractions tracking
  - Role filtering (student/professor/TA)
  - Detailed patron view with enrollment info
- ✅ **Circulation** - Loan workflow management
  - **Approved loans only** (pending_pickup + active)
  - "Picked Up" button for checkout
  - "Returned" button for returns
  - Status filtering
  - Overdue detection
- ✅ **Requests** - Loan request approval
  - View pending requests
  - **Accept** button (→ pending_pickup)
  - Reject button with reason
  - Borrower information
- 🟡 **Cataloging** - Partially complete (80%)
  - Add books interface
  - Bulk operations
  - Missing: Course book assignments
- 🟡 **Reports** - Partially complete (60%)
  - Basic statistics display
  - Missing: Charts and advanced analytics

**Patron Pages** (85%)
- ✅ **Books Browse** - Search and reserve books
  - View available copies
  - Reserve button (creates loan request)
  - Due date calculation preview
  - Faculty/sort filtering
- ✅ **Bookbag** - Personal loan management
  - Current loans with status
  - **"Ready for Pickup"** indicator for approved loans
  - Loan history
  - Due date tracking with overdue warnings
  - Cancel request option
- 🟡 **Profile** - User information (70%)
  - View profile details
  - Missing: Edit functionality
- ⭕ **Notices** - Not implemented (0%)

**Infrastructure** (100%)
- Complete API service layer with all endpoints
- React Query for caching and state management
- Toast notifications
- Error handling middleware
- Axios interceptors
- Loading states and spinners

#### 🟡 Partially Complete (15%)

**Missing Features:**
- Patron notices/alerts page
- Profile editing
- Course book recommendations
- Advanced statistics with charts
- Course management interface

---

### 🟡 Testing Status (30% Complete)

#### ✅ Manual Testing
- All endpoints tested via FastAPI `/docs`
- Authentication flow verified
- Business logic validated
- **Complete loan workflow tested** (request → approve → checkout → return)

#### ⭕ Missing Automated Tests
- Unit tests (0% coverage)
- Integration tests (0% coverage)
- E2E tests (0% coverage)
- No CI/CD pipeline

**Priority:** Implement pytest framework and write critical tests for loan service and authentication
- Dashboard shell

#### Not Started (60%)
- Student pages (profile, course books, bookbag, notices)
- Admin pages (books, students, circulation, requests, database)
- Search interfaces
- Statistics dashboards

---

## Setup Instructions

### Prerequisites

- Python 3.10 or higher
- Supabase account and database
- Git

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd eui-lib-sys
```

### 2. Setup Database

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `backend/src/creationDB.sql`
3. Copy your Supabase URL and API Key

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
JWT_SECRET_KEY=your_secret_key_here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=30
```

### 4. Install Dependencies & Run

#### **Linux / macOS:**

```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn src.main:app --reload
```

#### **Windows (PowerShell):**

```powershell
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# If you get execution policy error, run:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn src.main:app --reload
```

#### **Windows (Command Prompt):**

```cmd
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate.bat

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn src.main:app --reload
```

### 5. Access the API

- **API Server:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

---

## API Endpoints Overview

### Authentication
- `POST /users/login` - Login with email/password (returns JWT token)

### Users
- `GET /users/` - List all users (paginated)
- `GET /users/search/?q={query}` - Search users by name, email, or university ID
- `POST /users/` - Create new user
- `GET /users/{id}` - Get user details
- `PUT /users/{id}` - Update user (full update)
- `DELETE /users/{id}` - Delete user (admin only)
- `POST /users/{id}/blacklist?reason=...` - Add user to blacklist (admin only)
- `DELETE /users/{id}/blacklist` - Remove from blacklist (admin only)
- `POST /users/{id}/clear-infractions` - Reset infractions to 0 (admin only)

### Books
- `GET /books/` - List all books (paginated)
- `GET /books/search/?q={query}` - Search books by title, author, or ISBN
- `POST /books/` - Create new book (admin only)
- `GET /books/{id}` - Get book details
- `PATCH /books/{id}` - Update book (partial update, admin only)
- `DELETE /books/{id}` - Delete book (admin only)

### Book Copies
- `GET /book-copies/` - List all copies (paginated)
- `POST /book-copies/` - Create single copy (admin only)
- `POST /book-copies/bulk?reference_percentage=30` - Create multiple copies with auto split (admin only)
- `GET /book-copies/book/{book_id}` - Get all copies for a book
- `GET /book-copies/book/{book_id}/stats` - Get availability statistics
- `GET /book-copies/accession/{number}` - Get copy by barcode/accession number
- `GET /book-copies/{id}` - Get single copy details

### Courses
- `GET /courses/` - List all courses
- `POST /courses/` - Create new course (admin only)
- `GET /courses/{code}` - Get course details
- `PATCH /courses/{code}` - Update course (admin only)
- `DELETE /courses/{code}` - Delete course (admin only)
- `POST /courses/enrollments` - Enroll student in course (admin only)
- `GET /courses/enrollments/student/{student_id}` - Get student's enrollments
- `DELETE /courses/enrollments/{id}` - Remove enrollment (admin only)
- `GET /courses/{code}/books` - Get required books for course
- `POST /courses/course-books` - Add book to course (admin only)
- `DELETE /courses/course-books/{id}` - Remove book from course (admin only)

### Loans
- `POST /loans/request?copy_id=...` - Create loan request (authenticated users)
- `GET /loans/search/?user_id=...&status=...&from_date=...&to_date=...` - Search loans with filters
- `POST /loans/{id}/approve` - Approve loan request (admin only)
- `POST /loans/{id}/reject` - Reject loan request (admin only)
- `POST /loans/{id}/return?increment_infractions=true` - Return book (admin only)
- `POST /loans/mark-overdue` - Mark overdue loans (admin only)
- `GET /loans/user/{user_id}` - Get user's loan history
- `GET /loans/status/{status}` - Filter loans by status (pending, active, returned, rejected, overdue)
- `GET /loans/overdue` - Get all overdue loans
- `GET /loans/{id}` - Get single loan details

### Statistics
- `GET /stats/dashboard` - Comprehensive dashboard statistics (books, users, loans)
- `GET /stats/books` - Book statistics (total, available, most borrowed)
- `GET /stats/books/most-borrowed?limit=10` - Most borrowed books
- `GET /stats/loans?year=2025` - Loan statistics (by status, by month, top borrowers)
- `GET /stats/loans/by-month?year=2025` - Loan count by month
- `GET /stats/loans/top-borrowers?limit=10` - Users with most loans
- `GET /stats/users` - User statistics (by role, blacklisted, infractions)
- `GET /stats/users/infractions` - Users with infractions > 0

---

## Architecture

```
backend/
├── src/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Singleton database connection
│   ├── dependencies.py      # Dependency injection
│   ├── auth.py              # JWT verification & authorization
│   ├── creationDB.sql       # Database schema
│   ├── Brokers/             # Database operations layer
│   │   ├── userBroker.py
│   │   ├── bookBroker.py
│   │   ├── bookCopyBroker.py
│   │   ├── courseBroker.py
│   │   └── loanBroker.py
│   ├── Services/            # Business logic layer
│   │   ├── userService.py
│   │   ├── bookService.py
│   │   ├── bookCopyService.py
│   │   ├── courseService.py
│   │   └── loanService.py
│   ├── routers/             # API endpoints layer
│   │   ├── userRouter.py
│   │   ├── bookRouter.py
│   │   ├── bookCopyRouter.py
│   │   ├── courseRouter.py
│   │   └── loanRouter.py
│   └── Models/              # Pydantic models
│       ├── Users.py
│       ├── Books.py
│       ├── Courses.py
│       └── Loans.py
└── requirements.txt

frontend/
├── src/
│   ├── pages/
│   │   ├── Login.jsx        # Login page
│   │   └── Dashboard.jsx    # Dashboard shell
│   ├── context/
│   │   └── AuthContext.jsx  # Global auth state
│   ├── services/
│   │   └── api.js           # Complete API integration
│   └── components/
│       └── ProtectedRoute.jsx
└── package.json
```

### Architecture Pattern

The backend follows a clean **3-layer architecture**:

1. **Routers (API Layer)** - Handle HTTP requests, validation, and authentication
2. **Services (Business Logic Layer)** - Implement business rules and orchestration
3. **Brokers (Data Access Layer)** - Execute database operations only

**Benefits:**
- Clear separation of concerns
- Easy testing (can test each layer independently)
- Maintainable and scalable
- Follows FastAPI best practices

## Database Schema

- **users** - Students, professors, TAs, admins
- **books** - Book catalog with ISBN, MARC data
- **book_copies** - Physical inventory with barcodes
- **courses** - Course catalog with custom loan durations
- **enrollments** - Student course registrations
- **course_books** - Required books per course
- **loans** - Circulation records
- **loan_policies** - Rules by user role

---

## Development Notes

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

**Getting a token:**
```bash
curl -X POST "http://localhost:8000/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@eui.edu.eg", "password": "admin123"}'
```

**Using the token:**
```bash
curl -X GET "http://localhost:8000/loans/status/pending" \
  -H "Authorization: Bearer <token_from_login>"
```

### Creating Test Data

Use the API documentation at `/docs` to create test data:

1. Create an admin user
2. Login to get JWT token
3. Create books
4. Add book copies (use bulk endpoint)
5. Create courses
6. Create student users
7. Enroll students
8. Add required books to courses
9. Login as student and create loan requests
10. Approve loans as admin

### Testing Loan System

**As a Student:**
1. Login with student credentials
2. Browse available books
3. Request a loan with `POST /loans/request?copy_id=...`

**As an Admin:**
1. Login with admin credentials
2. View pending requests: `GET /loans/status/pending`
3. Approve: `POST /loans/{id}/approve`
4. Process returns: `POST /loans/{id}/return`

### Role-Based Access

- **Public**: Login endpoint only
- **Student**: Can view data, create loan requests, edit own profile
- **Professor/TA**: Same as student + extended loan periods
- **Admin**: Full access to all operations

### Common Issues
📊 **[Project Progress Report](PROJECT-PROGRESS.md)** - Comprehensive progress tracking aligned with grading rubric (scope, testing, UI, architecture, features)
- 🗺️ **[UI-to-API Mapping](UI-TO-API-MAPPING.md)** - Complete mapping of all frontend pages to backend endpoints with request/response examples
- 🔧 **[Background Tasks Guide](BACKGROUND-TASKS.md)** - Documentation on automated processes and scheduler setup
- 💾 **[Database Schema](backend/src/creationDB.sql)** - Full PostgreSQL schema with constraints and relationship
- Make sure virtual environment is activated
- Make sure you're in the `backend` directory
- Reinstall dependencies: `pip install -r requirements.txt`

**Database Connection Error:**
- Verify `.env` file exists in project root
- Check Supabase URL and API key are correct
- Ensure database schema is created

**Authentication Error (401 Unauthorized):**
- Check JWT token is included in Authorization header
- Verify token hasn't expired (30 minute default)
- Login again to get fresh token

**Permission Error (403 Forbidden):**
- Check user role has permission for operation
- Admin operations require `role: "admin"`
- Some endpoints allow self-access (e.g., updating own profile)

**Port Already in Use:**
```bash
# Change port
uvicorn src.main:app --reload --port 8001
```

---

## Additional Documentation

- [UI-to-API Mapping](UI-TO-API-MAPPING.md) - Complete mapping of frontend pages to backend endpoints
- [Database Schema](backend/src/creationDB.sql) - Full database structure with constraints

---

## Contributing

This project follows a clean architecture pattern:
1. **Brokers** - Handle database operations only
2. **Services** - Contain business logic and orchestration
3. **Routers** - Define API endpoints, validation, and authentication

When adding new features:
1. Define Pydantic models in `Models/`
2. Create broker functions for database operations
3. Implement business logic in service layer
4. Add API endpoints in router with proper authentication
5. Update this README with new endpoints

---

## R✅ Completed
- ✅ Backend API (100%)
- ✅ Search endpoints (books, users, loans)
- ✅ Statistics/dashboard APIs
- ✅ Architecture refactoring (PascalCase naming, clean separation)
- ✅ Complete documentation

### 🎯 Current Sprint (Week of Dec 20, 2025)
- [ ] **Critical:** Set up pytest and write unit tests (target: 50% coverage)
- [ ] **Critical:** Build student dashboard page
- [ ] **High:** Implement book catalog with search
- [ ] **High:** Create loan request flow
- [ ] **Medium:** Build admin loan approval interface

### Short Term (Next 2-3 Weeks)
- [ ] Complete student UI pages
- [ ] Complete admin UI pages
- [ ] Increase test coverage to 70%
- [ ] Implement APScheduler for background tasks
- [ ] Add email notification service

### Medium Term (Next Month)
- [ ] E2E testing with Cypress/Playwright
- [ ] Fine/penalty calculation system
- [ ] Book reservation/hold system
- [ ] Advanced reporting and analytics
- [ ] Production deployment (Render/Railway)

### Long Term (Future Enhancements)
- [ ] Mobile app (React Native)
- [ ] QR code scanning for book copies
- [ ] Self-checkout kiosk mode
- [ ] Integration with university SSO
- [ ] Multi-language support
- [ ] Analytics dashboard with charts

**Target Grade:** 87/100 (B+) - achievable by completing testing and UIs
- [ ] Integration with university SSO
- [ ] Analytics dashboard

---

## License

MIT License

---

## Contact

For questions or issues, please open an issue on GitHub.

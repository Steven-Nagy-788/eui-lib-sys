# EUI Library Management System

A comprehensive library management system for universities built with FastAPI, Supabase, and React.

## Tech Stack

- **Backend:** FastAPI (Python)
- **Database:** Supabase (PostgreSQL)
- **Frontend:** React (Coming Soon)

## Project Status

### ✅ Completed Features

#### Backend API (85% Complete)
- **User Management** - CRUD operations, authentication with JWT
- **Book Catalog** - Book management with ISBN tracking
- **Book Copies** - Physical inventory management with barcode system
- **Courses** - Course management with faculty tracking
- **Enrollments** - Student course registration
- **Course Books** - Required reading lists per course
- **Loan System** - Full circulation system with:
  - Blacklist checking
  - Max books limit enforcement
  - Smart due date calculation (role-based + course overrides)
  - Approval/rejection workflow
  - Return processing with infractions tracking
  - Overdue detection

### 🔴 Missing Features

- Authentication middleware & role-based access control
- Search and filter endpoints
- Statistics dashboard
- Missing CRUD operations (Book update, User delete)
- Scheduled tasks (daily overdue checks)
- Frontend UI (0% complete)

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

### Users
- `POST /users/login` - Login with email/password
- `GET /users/` - List all users
- `POST /users/` - Create new user
- `GET /users/{id}` - Get user details
- `PUT /users/{id}` - Update user

### Books
- `GET /books/` - List all books
- `POST /books/` - Create new book
- `GET /books/{id}` - Get book details
- `DELETE /books/{id}` - Delete book

### Book Copies
- `GET /book-copies/` - List all copies
- `POST /book-copies/` - Create single copy
- `POST /book-copies/bulk` - Create multiple copies (auto 30/70 split)
- `GET /book-copies/book/{book_id}` - Get copies for a book
- `GET /book-copies/accession/{number}` - Get copy by barcode

### Courses
- `GET /courses/` - List all courses
- `POST /courses/` - Create new course
- `POST /courses/enrollments` - Enroll student
- `GET /courses/{code}/books` - Get required books
- `POST /courses/course-books` - Add book to course

### Loans
- `POST /loans/request` - Create loan request
- `POST /loans/{id}/approve` - Approve loan (admin)
- `POST /loans/{id}/reject` - Reject loan (admin)
- `POST /loans/{id}/return` - Return book (admin)
- `GET /loans/user/{user_id}` - Get user's loans
- `GET /loans/status/{status}` - Filter by status
- `GET /loans/overdue` - Get overdue loans

---

## Architecture

```
backend/
├── src/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Singleton database connection
│   ├── dependencies.py      # Dependency injection
│   ├── creationDB.sql       # Database schema
│   ├── Brokers/             # Database operations
│   │   ├── userBroker.py
│   │   ├── bookBroker.py
│   │   ├── bookCopyBroker.py
│   │   ├── courseBroker.py
│   │   └── loanBroker.py
│   ├── Services/            # Business logic
│   │   ├── userService.py
│   │   ├── bookService.py
│   │   ├── bookCopyService.py
│   │   ├── courseService.py
│   │   └── loanService.py
│   ├── routers/             # API endpoints
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
```

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

### Creating Test Data

Use the API documentation at `/docs` to create test data:

1. Create a user (admin role)
2. Create books
3. Add book copies (use bulk endpoint)
4. Create courses
5. Enroll students
6. Create loan requests

### Common Issues

**ModuleNotFoundError:**
- Make sure virtual environment is activated
- Make sure you're in the `backend` directory
- Reinstall dependencies: `pip install -r requirements.txt`

**Database Connection Error:**
- Verify `.env` file exists in project root
- Check Supabase URL and API key are correct
- Ensure database schema is created

**Port Already in Use:**
```bash
# Change port
uvicorn src.main:app --reload --port 8001
```

---

## Contributing

This project follows a clean architecture pattern:
1. **Brokers** - Handle database operations only
2. **Services** - Contain business logic
3. **Routers** - Define API endpoints and validation

---

## License

MIT License

---

## Contact

For questions or issues, please open an issue on GitHub.

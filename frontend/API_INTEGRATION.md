# Frontend API Integration

This document provides an overview of the API integration implemented in the frontend application.

## Structure

All API services are located in `src/api/`:

- **config.js** - Axios configuration and interceptors
- **authService.js** - Authentication (login, logout, token management)
- **booksService.js** - Book CRUD operations
- **bookCopiesService.js** - Book copy/inventory management
- **usersService.js** - User management
- **loansService.js** - Loan/circulation operations
- **coursesService.js** - Course, enrollment, and course book management
- **statsService.js** - Statistics and analytics
- **index.js** - Central export point for all services

## Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:8000
```

For production, update this to your backend API URL.

### Authentication

The API uses JWT Bearer token authentication:
- Tokens are stored in `localStorage` with key `auth_token`
- User data is stored in `localStorage` with key `user`
- The axios interceptor automatically adds the token to all requests
- 401 responses trigger automatic logout and redirect to login

## Usage Examples

### Authentication

```javascript
import { login, logout, getCurrentUser } from './api/authService';

// Login
try {
  const { user, token } = await login('user@example.com', 'password');
  console.log('Logged in:', user);
} catch (error) {
  console.error('Login failed:', error.message);
}

// Get current user
const user = getCurrentUser();

// Logout
logout();
```

### Books

```javascript
import { getBooks, searchBooks, createBook } from './api/booksService';

// Get all books
const books = await getBooks(0, 100);

// Search books
const results = await searchBooks('calculus');

// Create a book (Admin only)
const newBook = await createBook({
  isbn: '978-1234567890',
  title: 'Introduction to Programming',
  author: 'John Doe',
  publisher: 'Tech Press',
  publication_year: 2024
});
```

### Loans

```javascript
import { createLoanRequest, approveLoan, getUserLoans } from './api/loansService';

// Create a loan request
const loan = await createLoanRequest(copyId);

// Approve loan (Admin only)
const approved = await approveLoan(loanId);

// Get user's loans
const userLoans = await getUserLoans(userId, 'active');
```

### Statistics

```javascript
import { getDashboardStats, getMostBorrowedBooks } from './api/statsService';

// Get dashboard statistics
const stats = await getDashboardStats();

// Get most borrowed books
const topBooks = await getMostBorrowedBooks(10);
```

## Error Handling

All API calls use try-catch for error handling:

```javascript
try {
  const data = await getBooks();
  setBooks(data);
} catch (error) {
  console.error('Error:', error.message);
  setError(error.message);
}
```

The axios interceptor formats error messages from the API for display.

## Components Updated

### LoginPage.jsx
- Integrated with `authService.login()`
- Handles authentication and redirects based on user role
- Displays error messages from API

### AdminBooksPage.jsx
- Fetches books using `getBooks()` and `searchBooks()`
- Gets availability stats using `getCopyStats()`
- Implements debounced search (500ms)
- Shows loading and error states

## Installation

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Create `.env` file with API URL

3. Start the development server:
```bash
npm run dev
```

## API Endpoints

All endpoints are documented in the OpenAPI specification. Key endpoints:

- `POST /users/login` - User authentication
- `GET /books/` - List books
- `GET /books/search/` - Search books
- `GET /book-copies/book/{book_id}/stats` - Get copy statistics
- `POST /loans/request` - Create loan request
- `GET /stats/dashboard` - Get dashboard statistics

## Next Steps

To complete the integration:

1. Update remaining pages (PatronBooksPage, AdminCirculationPage, etc.)
2. Implement book detail modals/pages
3. Add loan request functionality for patrons
4. Implement admin approval workflows
5. Add course management interfaces
6. Integrate statistics dashboards

## Notes

- The backend doesn't have a `/users/me` endpoint, so user data is stored in localStorage after login
- Faculty filtering in books requires course data which isn't directly linked in the current schema
- Consider adding pagination controls for large datasets
- Add loading skeletons for better UX

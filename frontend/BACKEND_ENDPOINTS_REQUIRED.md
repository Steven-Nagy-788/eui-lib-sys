# Backend Endpoints Required - Library System

This document specifies the exact endpoint responses needed to fix frontend integration issues.

## Summary of Issues

1. ✅ **Bookbag "Unknown Book"**: GET /loans/user/{user_id} already returns book details - **RESOLVED**
2. ✅ **Incorrect availability count**: GET /books/with-stats - **BACKEND FIXED**
3. ✅ **Available copies include borrowed**: GET /book-copies/book/{book_id} - **BACKEND FIXED**
4. ✅ **Lost status**: Already supported in API - **WORKING**
5. ✅ **Borrower info**: Already returned in BookCopyWithBorrowerInfo schema - **WORKING**
6. ✅ **Frontend alignment**: All frontend code updated to match API schema - **COMPLETED**
7. ⚠️ **Duplicate books in reports**: GET /stats/books/most-borrowed returning duplicates - **NEEDS FIX**
8. ✅ **Loans with book details**: GET /loans/status/{status} returns full LoanWithBookInfo schema - **RESOLVED**

**Status**: ⚠️ Reports showing duplicate books - backend needs to GROUP BY book_id

---

## ✅ RESOLVED ISSUE #8: GET /loans/status/{status} Returns Full LoanWithBookInfo

**Status**: ✅ **RESOLVED** - Backend now returns full `LoanWithBookInfo` schema

**Solution Implemented**: The endpoint now includes both `book_id` and embedded book details (book_title, book_author, etc.), eliminating the need for frontend to make additional API calls.

**Backend Response** (Working):
```json
[
  {
    "id": 1,
    "user_id": 5,
    "copy_id": 123,
    "book_id": "uuid-here",
    "status": "pending",
    "request_date": "2025-12-23T10:00:00Z",
    "approval_date": null,
    "due_date": "2025-12-30T10:00:00Z",
    "return_date": null,
    "is_overdue": false,
    
    // ✅ Full book details included
    "book_title": "Code Complete",
    "book_author": "Steve McConnell",
    "book_isbn": "9780735619678",
    "book_publisher": "Microsoft Press",
    "book_pic_url": "https://example.com/book.jpg",
    "copy_accession_number": "10075"
  }
]
```

**Testing**:
```bash
# Test the endpoint
curl -H "Authorization: Bearer <token>" http://localhost:8000/loans/status/pending

# Verify response includes book_id field
# If using LoanWithBookInfo schema, verify book_title, book_author, etc. are included
```

---

## 1. GET /loans/user/{user_id}

**Purpose**: Get all loans for a specific user (for Bookbag page)

**Status**: ✅ API already returns `LoanWithBookInfo` schema with all required fields

**Expected Response** (already implemented):
```json
[
  {
    "id": 1,
    "user_id": 5,
    "copy_id": 123,
    "status": "pending",
    "request_date": "2025-12-23T10:00:00Z",
    "approval_date": null,
    "due_date": null,
    "return_date": null,
    "is_overdue": false,
    
    "book_id": 10,
    "book_title": "Code Complete",
    "book_author": "Steve McConnell",
    "book_isbn": "9780735619678",
    "book_publisher": "Microsoft Press",
    "book_pic_url": "https://example.com/book.jpg",
    "copy_accession_number": "10075"
  }
]
```

**Note**: This endpoint already implements the required joins. If books show as "Unknown", verify:
1. Book details are being joined correctly
2. Null values are handled (use `COALESCE` for optional fields)
3. Response matches the `LoanWithBookInfo` schema

---

## 2. GET /books/with-stats?skip=0&limit=50

**Purpose**: Get list of books with availability statistics

**Status**: ✅ **BACKEND FIXED** - Available count now correctly calculated

**API Schema** (BookCopyStats):
```json
{
  "total": 10,
  "available": 5,
  "reference": 3,
  "circulating": 7,
  "checked_out": 2
}
```

**Required Response**:
```json
[
  {
    "id": 10,
    "isbn": "9780735619678",
    "title": "Code Complete",
    "author": "Steve McConnell",
    "publisher": "Microsoft Press",
    "publication_year": 2004,
    "book_pic_url": "https://example.com/book.jpg",
    "call_number": "QA76.6",
    "faculty": "Computer and Informational Sciences",
    
    "copy_stats": {
      "total": 10,              // Total copies (all types)
      "available": 5,           // ⚠️ MUST be: circulating (is_reference=false) AND status='available'
      "reference": 3,           // Copies with is_reference=true
      "circulating": 7,         // Copies with is_reference=false
      "checked_out": 2          // Active loans count
    }
  }
]
```

**Critical Fix** (✅ **COMPLETED**):
```sql
-- Available count calculation:
SELECT COUNT(*) 
FROM book_copies 
WHERE book_id = ? 
  AND is_reference = false      -- NOT reference copies (use boolean, not string)
  AND status = 'available'      -- Only available status
  AND id NOT IN (               -- AND not currently loaned
    SELECT copy_id FROM loans 
    WHERE status IN ('pending', 'active')
  )
```

**Important**: 
- ✅ API uses `is_reference` (boolean) NOT `copy_type` (string)
- ✅ Status values: "available", "maintenance", "lost" (NOT "borrowed")
- ✅ A copy is borrowed if it has an active loan, not a status field
- ✅ Frontend updated to use `is_reference` boolean

---

## 3. GET /book-copies/book/{book_id}?available_only=true

**Purpose**: Get all copies of a specific book (for patron reservation and admin management)
**BACKEND FIXED** - Available copies now exclude active loan
**Status**: ✅ API already returns `BookCopyWithBorrowerInfo` schema with borrower details

**Query Parameters**:
- `available_only=true` - Return only available circulating copies (for patron)
- `available_only=false` (default) - Return all copies with borrower info (for admin)

**Expected Response** (already implemented):
```json
[
  {
    "id": 123,
    "book_id": 10,
    "accession_number": "10075",
    "is_reference": false,          // ⚠️ boolean, not "circulating" string
    "status": "available",          // "available" | "maintenance" | "lost"
    "created_at": "2025-01-01T00:00:00Z",
    "current_borrower_name": null,
    "current_borrower_id": null,
    "current_loan_id": null
  },
  {
    "id": 124,
    "book_id": 10,
    "accession_number": "10076",
    "is_reference": false,
    "status": "available",          // ⚠️ Copy is "borrowed" via active loan, not status
    "created_at": "2025-01-01T00:00:00Z",
    "current_borrower_name": "John Doe",
    "current_borrower_id": "21-101010",
    "current_loan_id": 45
  }
]
```

**Critical Fix** (✅ **COMPLETED**):
```sql
-- For available_only=true filter:
SELECT 
  book_copies.*,
  users.full_name as current_borrower_name,
  users.university_id as current_borrower_id,
  loans.id as current_loan_id
FROM book_copies
LEFT JOIN loans ON book_copies.id = loans.copy_id 
  AND loans.status IN ('pending', 'active')
LEFT JOIN users ON loans.user_id = users.id
WHERE book_copies.book_id = ?
  AND (? = false OR (                -- available_only parameter
    book_copies.is_reference = false 
    AND book_copies.status = 'available'
    AND loans.id IS NULL              -- No active loan
  ))
```

**Changes Completed**:
1. ✅ When `available_only=true`, excludes copies with active loans (checks `loans.id IS NULL`)
2. ✅ A copy can have `status='available'` but still be borrowed (if it has an active loan)
3. ✅ API returns borrower info via LEFT JOIN
4. ✅ Frontend updated to check `current_loan_id` for borrowed status

---

## 4. PATCH /book-copies/{copy_id}/status/{status}

**Purpose**: Update copy status (maintenance, lost, available)

**Status**: ✅ API already implements this endpoint

**Valid Status Values** (BookStatus enum):
- `available` - Copy is available for borrowing
- `maintenance` - Copy is under maintenance/repair
- `lost` - Copy has been lost

**⚠️ Note**: There is NO "borrowed" status. A copy is borrowed when it has an active loan in the `loans` table.

**Request**: No body required, status in URL

**Expected Response**:
```json
{
  "id": 123,
  "book_id": 10,
  "accession_number": "10075",
  "is_reference": false,
  "status": "maintenance",
  "created_at": "2025-01-01T00:00:00Z"
}
```

---

## 5. POST /loans/request?copy_id=123

**Purpose**: Create a loan request for a specific book copy

**Status**: ✅ API already implements this endpoint

**Request**: Copy ID in query parameter

**Expected Response**:
```json
{
  "id": 50,
  "user_id": 5,
  "copy_id": 123,
  "status": "pending",
  "request_date": "2025-12-23T10:00:00Z",
  "approval_date": null,
  "due_date": null,
  "return_date": null
}
```

**Frontend Behavior**: 
- Frontend automatically selects first circulating copy (`is_reference=false` AND `status='available'` AND no active loan)
- Frontend sends the `copy_id` of this auto-selected copy

---

## 6. GET /stats/dashboard

**Purpose**: Get overview statistics for reports page

**Status**: ⚠️ **VERIFY RESPONSE STRUCTURE**

**Expected Response Structure**:
```json
{
  "books": {
    "total": 50,
    "total_copies": 150,
    "available": 85
  },
  "users": {
    "total": 120
  },
  "loans": {
    "active": 45,
    "overdue": 5,
    "pending": 3
  }
}
```

**Frontend Mapping**:
- Total Books: `stats?.books?.total`
- Total Users: `stats?.users?.total`
- Active Loans: `stats?.loans?.active`
- Overdue Loans: `stats?.loans?.overdue`
- Total Copies: `stats?.books?.total_copies`
- Available Copies: `stats?.books?.available`

**Note**: If backend uses flat structure (e.g., `total_books` instead of `books.total`), frontend needs adjustment.

---

## 7. GET /stats/books/most-borrowed?limit=10

**Purpose**: Get list of most borrowed books for reports page

**Status**: ⚠️ **RETURNING DUPLICATES** - Same book appearing multiple times

**Current Problem**: Backend is likely counting each loan/copy separately instead of grouping by book

**Required Response**:
```json
[
  {
    "id": 10,
    "title": "Code Complete",
    "author": "Steve McConnell",
    "isbn": "9780735619678",
    "borrow_count": 15        // Total times THIS BOOK was borrowed
  },
  {
    "id": 11,
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "isbn": "9780132350884",
    "borrow_count": 12
  }
]
```

**Critical Fix Required**:
```sql
-- Must GROUP BY book_id, not copy_id
SELECT 
  books.id,
  books.title,
  books.author,
  books.isbn,
  COUNT(DISTINCT loans.id) as borrow_count
FROM books
JOIN book_copies ON books.id = book_copies.book_id
JOIN loans ON book_copies.id = loans.copy_id
WHERE loans.status IN ('active', 'returned')  -- Count completed loans
GROUP BY books.id, books.title, books.author, books.isbn  -- Group by BOOK
ORDER BY borrow_count DESC
LIMIT ?
```

**Current Issue**: Query is probably doing:
```sql
-- WRONG: Returns each copy as separate row
SELECT 
  books.*,
  COUNT(loans.id) as borrow_count
FROM book_copies
JOIN books ...
JOIN loans ...
GROUP BY book_copies.id  -- ❌ Groups by COPY, not BOOK
```

**Important**:
- Must use `DISTINCT loans.id` or `COUNT(*)` with proper grouping
- Must `GROUP BY books.id` not `book_copies.id`
- Should only count loans with status 'active' or 'returned' (exclude 'pending', 'rejected')

---

## 8. GET /stats/loans/top-borrowers?limit=10

**Purpose**: Get list of users with most loans

**Status**: ✅ Likely working correctly (verify it's counting distinct loans, not copies)

**Expected Response**:
```json
[
  {
    "id": 5,
    "full_name": "John Doe",
    "email": "john@example.com",
    "university_id": "21-101073",
    "borrow_count": 8
  }
]
```

**Verify SQL**:
```sql
SELECT 
  users.id,
  users.full_name,
  users.email,
  users.university_id,
  COUNT(loans.id) as borrow_count
FROM users
JOIN loans ON users.id = loans.user_id
WHERE loans.status IN ('active', 'returned')
GROUP BY users.id, users.full_name, users.email, users.university_id
ORDER BY borrow_count DESC
LIMIT ?
```

---

## Status Enums (from OpenAPI spec)

### Loan Status (LoanStatus)
- `pending` - Requested but not approved yet
- `active` - Currently borrowed
- `returned` - Returned to library
- `rejected` - Request was rejected
- `overdue` - Active loan past due date

### Copy Status (BookStatus)
- `available` - Available for borrowing
- `maintenance` - Under maintenance/repair
- `lost` - Copy has been lost
- ⚠️ **NO "borrowed" status** - borrowing is tracked via active loans

### Copy Type (boolean field)
- `is_reference: false` - Circulating copy (can be borrowed, ~70%)
- `is_reference: true` - Reference copy (library use only, ~30%)

---

## Implementation Checklist

### ⚠️ Current Issue - Reports:
- [ ] **GET /stats/books/most-borrowed**: Returns duplicate books
  - Problem: Same book appearing multiple times (grouped by copy_id instead of book_id)
  - Fix: Must GROUP BY books.id to aggregate all copies of same book
  - Query must count `COUNT(DISTINCT loans.id)` per book

### ✅ Previously Resolved:
- [x] **GET /books/with-stats**: `copy_stats.available` calculation fixed
- [x] **GET /book-copies/book/{book_id}?available_only=true**: Excludes copies with active loans
- [x] **Frontend Code Updated**: Changed to `is_reference` boolean
  - Removed "borrowed" status from status badge (borrowing tracked via loans)

### Already Working:
- [x] GET /loans/user/{user_id} includes book details (LoanWithBookInfo schema)
- [x] GET /book-copies/book/{book_id} includes borrower info (BookCopyWithBorrowerInfo schema)
- [x] PATCH /book-copies/{copy_id}/status/{status} supports 'lost' status
- [x] All date fields use ISO 8601 format
- [x] Auto-selects first circulating copy (is_reference=false) for reservations

---

## Testing Instructions

### Test 1: Bookbag Display
1. Create a loan for user
2. Call GET /loans/user/{user_id}
3. Verify response includes: book_title, book_author, book_isbn, book_publisher, book_pic_url, copy_accession_number
4. Frontend should display book details, not "Unknown Book"

### Test 2: Availability Count
1. Create book with 10 copies: 7 circulating (is_reference=false), 3 reference (is_reference=true)
2. Set 2 circulating copies to 'maintenance', 1 to 'lost'
3. Create active loan for 2 circulating copies
4. Call GET /books/with-stats
5. Verify copy_stats.available = 2 (only circulating + available + not loaned)

### Test 3: Available Copies with Loans
1. Create book with 5 circulating copies, all status='available'
2. Create active loan for 2 copies
3. Call GET /book-copies/book/{book_id}?available_only=true
4. Verify returns only 3 copies (excludes the 2 with active loans)
5. Call GET /book-copies/book/{book_id}?available_only=false
6. Verify returns all 5 copies with borrower_name filled for the 2 loaned copies

### Test 4: Copy Status Update
1. Call PATCH /book-copies/{copy_id}/status/lost
2. Verify status changes to 'lost'
3. Verify this copy no longer appears in available_only=true requests

### Test 5: Auto-Selection (Frontend)
1. User clicks "Reserve" on book with mixed copies
2. Frontend fetches GET /book-copies/book/{book_id}?available_only=true
3. Frontend auto-selects first copy from response
4. Frontend calls POST /loans/request?copy_id={selected_copy_id}
5. Verify reservation created for correct copy

### Test 6: Most Borrowed Books Report
1. Create 3 books: Book A (3 copies), Book B (2 copies), Book C (1 copy)
2. Create loans:
   - Book A: 5 total loans (across all 3 copies)
   - Book B: 3 total loans (across both copies)
   - Book C: 2 total loans
3. Call GET /stats/books/most-borrowed?limit=10
4. **Verify**: Returns 3 rows (one per book), not 6 rows (one per copy)
5. **Verify**: Book A shows borrow_count=5, Book B shows borrow_count=3, Book C shows borrow_count=2
6. **Verify**: Order is A, B, C (highest to lowest)
7. Frontend should display each book only once with correct total count

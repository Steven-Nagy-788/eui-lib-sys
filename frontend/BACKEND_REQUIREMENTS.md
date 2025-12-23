# Backend API Requirements for Full Performance

## 🎯 Priority 1: Pagination (CRITICAL)

### Current Issue:
Frontend loads 200 books at once → slow initial load

### Required Endpoint Change:

```python
# FILE: backend/app/routers/books.py

@router.get("/books/with-stats", response_model=List[BookWithStats])
async def get_books_with_stats(
    skip: int = 0,
    limit: int = 50,  # Add pagination
    db: Session = Depends(get_db)
):
    """Get books with copy statistics - PAGINATED"""
    # Add limit/offset to query
    books = db.query(Book).offset(skip).limit(limit).all()
    
    # Rest of the logic stays the same
    # ... (your existing code)
```

### Frontend Update (Already Ready):
```javascript
// In booksService.js - already accepts skip/limit
getBooksWithStats(0, 50)  // Loads 50 books
```

---

## 🎯 Priority 2: Server-Side Filtering

### Current Issue:
Frontend filters 200 books client-side → slow on large catalogs

### Required Endpoint:

```python
@router.get("/books/with-stats")
async def get_books_with_stats(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,      # Add search parameter
    faculty: Optional[str] = None,     # Add faculty filter
    sort: Optional[str] = "title_asc", # Add sorting
    db: Session = Depends(get_db)
):
    """Get books with filtering and sorting"""
    query = db.query(Book)
    
    # Search filter
    if search:
        query = query.filter(
            or_(
                Book.title.ilike(f"%{search}%"),
                Book.author.ilike(f"%{search}%"),
                Book.isbn.ilike(f"%{search}%"),
                Book.publisher.ilike(f"%{search}%")
            )
        )
    
    # Faculty filter
    if faculty and faculty != "all":
        query = query.filter(Book.faculty == faculty)
    
    # Sorting
    if sort == "title_asc":
        query = query.order_by(Book.title.asc())
    elif sort == "title_desc":
        query = query.order_by(Book.title.desc())
    elif sort == "author_asc":
        query = query.order_by(Book.author.asc())
    
    # Pagination
    books = query.offset(skip).limit(limit).all()
    
    # Rest of your copy_stats logic...
    return books_with_stats
```

### Frontend Usage:
```javascript
// BooksPage will call with filters
getBooksWithStats(0, 50, searchQuery, facultyFilter, sortOrder)
```

---

## 🎯 Priority 3: Batched Circulation Data

### Current Issue:
Frontend makes N+1 queries:
1. Get loans (2 queries: active + pending)
2. For each loan → get user (N queries)
3. For each loan → get book (N queries)

**Result: 1 + 2N queries (slow!)**

### Required Endpoint:

```python
# FILE: backend/app/routers/loans.py

@router.get("/loans/with-details", response_model=List[LoanWithDetails])
async def get_loans_with_details(
    status: Optional[str] = None,  # "active,pending" or "active" or "all"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get loans with user and book details in ONE query"""
    
    # Build query with joins
    query = (
        db.query(Loan)
        .join(User, Loan.user_id == User.id)
        .join(Book, Loan.book_id == Book.id)
    )
    
    # Filter by status
    if status and status != "all":
        statuses = status.split(",")  # "active,pending"
        query = query.filter(Loan.status.in_(statuses))
    
    loans = query.all()
    
    # Return with nested objects
    return [
        {
            "id": loan.id,
            "status": loan.status,
            "due_date": loan.due_date,
            "user": {
                "id": loan.user.id,
                "full_name": loan.user.full_name,
                "email": loan.user.email,
                "university_id": loan.user.university_id
            },
            "book": {
                "id": loan.book.id,
                "title": loan.book.title,
                "author": loan.book.author,
                "book_pic_url": loan.book.book_pic_url
            }
        }
        for loan in loans
    ]
```

### Response Model:
```python
class LoanWithDetails(BaseModel):
    id: int
    status: str
    due_date: Optional[datetime]
    user: UserBasic
    book: BookBasic
```

### Frontend Update:
```javascript
// In loansService.js - new function
export const getLoansWithDetails = async (status = 'active,pending') => {
  const { data } = await apiClient.get('/loans/with-details', {
    params: { status }
  })
  return data
}
```

---

## 🎯 Priority 4: Database Indexes

### Current Issue:
Queries without indexes are slow on large tables

### Required SQL Indexes:

```sql
-- Books table
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_books_faculty ON books(faculty);
CREATE INDEX idx_books_isbn ON books(isbn);

-- Book copies table
CREATE INDEX idx_book_copies_book_id ON book_copies(book_id);
CREATE INDEX idx_book_copies_status ON book_copies(status);

-- Loans table
CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_book_id ON loans(book_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_due_date ON loans(due_date);
CREATE INDEX idx_loans_copy_id ON loans(copy_id);

-- Users table
CREATE INDEX idx_users_university_id ON users(university_id);
CREATE INDEX idx_users_email ON users(email);
```

---

## 🎯 Priority 5: Response Caching Headers

### Current Issue:
No cache headers → browser refetches everything

### Add to Responses:

```python
# In main.py or middleware
from fastapi import Response

@app.middleware("http")
async def add_cache_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Cache GET requests for 2 minutes
    if request.method == "GET":
        response.headers["Cache-Control"] = "max-age=120, stale-while-revalidate=60"
    
    return response
```

---

## 📊 Performance Impact

| Change | Current | After | Improvement |
|--------|---------|-------|-------------|
| Books load | 200 books | 50 books | 75% faster |
| Circulation queries | 1 + 2N | 1 query | 95%+ faster |
| Search filter | Client-side | Server-side | Scalable ∞ |
| Database queries | No indexes | Indexed | 10-100x faster |

---

## 🔧 Implementation Order

1. **Day 1**: Add pagination to `/books/with-stats` (10 min)
2. **Day 1**: Add indexes to database (5 min)
3. **Day 2**: Add search/filter parameters to books (30 min)
4. **Day 3**: Create `/loans/with-details` endpoint (1 hour)
5. **Day 3**: Add cache headers (15 min)

---

## ✅ How to Test

### 1. Pagination:
```bash
# Before
curl http://localhost:8000/books/with-stats
# Returns 200 books (slow)

# After
curl http://localhost:8000/books/with-stats?skip=0&limit=50
# Returns 50 books (fast)
```

### 2. Filtering:
```bash
curl "http://localhost:8000/books/with-stats?search=python&faculty=Engineering"
# Returns filtered results instantly
```

### 3. Batched Loans:
```bash
curl http://localhost:8000/loans/with-details?status=active,pending
# Returns loans with user + book in ONE query
```

### 4. Check Query Performance:
```python
# Enable SQLAlchemy query logging
import logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# Run endpoint and check console for SQL queries
# Should see: SELECT ... FROM books ... LIMIT 50
```

---

## 🚀 Expected Results

After implementing all 5 priorities:

- **Books page**: 5 seconds → < 1 second (5x faster)
- **Circulation page**: 3 seconds → < 500ms (6x faster)
- **Search/filter**: Instant, scales to 10,000+ books
- **Navigation**: Cached, instant tab switches
- **Mobile**: Fully responsive

---

## 📝 Questions to Ask Your Backend Team

1. **Which query is slowest?** (Check PostgreSQL logs)
2. **Do you have indexes?** (Run `\d books` in psql)
3. **Can you add pagination today?** (10-minute change)
4. **Do you use SQLAlchemy or raw SQL?** (Affects join syntax)

Let me know which endpoints you want help implementing!

# Testing Infrastructure

This document outlines the testing strategy and infrastructure for the EUI Library System.

## Architecture

### Test Layers

1. **Unit Tests** (`backend/tests/unit/`)
   - Test individual methods with mocked dependencies
   - Fast execution, no database required
   - Coverage: Brokers, Services business logic
   - Run: `pytest tests/unit -m unit`

2. **Integration Tests** (`backend/tests/integration/`)
   - Test API endpoints with FastAPI TestClient
   - Mock external dependencies (database, auth)
   - Coverage: Routers, full request/response cycle
   - Run: `pytest tests/integration -m integration`

3. **E2E Tests** (`backend/tests/e2e/`)
   - Browser automation with Selenium
   - Test complete user workflows
   - Coverage: Frontend + Backend integration
   - Run: `pytest tests/e2e/`

## Abstract Base Classes (ABCs)

To enable dependency injection and testing, all layers use abstract interfaces:

### Broker Layer
- **File**: `backend/src/Brokers/IBroker.py`
- **Interfaces**: `IBookBroker`, `IUserBroker`, `ILoanBroker`, `ICourseBroker`, `IBookCopyBroker`, `IStatsBroker`
- **Purpose**: Define database operation contracts
- **Testing**: Mock these interfaces in service tests

### Service Layer
- **File**: `backend/src/Services/IService.py`
- **Interfaces**: `IBookService`, `IUserService`, `ILoanService`, `ICourseService`
- **Purpose**: Define business logic contracts
- **Testing**: Mock these interfaces in router tests

## Running Tests

### Install Dependencies
```bash
cd backend
pip install -r requirements-dev.txt
```

### Run All Tests
```bash
pytest
```

### Run Specific Test Types
```bash
# Unit tests only
pytest tests/unit -m unit

# Integration tests only
pytest tests/integration -m integration

# E2E tests only (Selenium)
pytest tests/e2e/

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/unit/test_book_broker.py -v
```

### Coverage Reports
```bash
# Generate HTML coverage report
pytest --cov=src --cov-report=html

# View report
# Open htmlcov/index.html in browser

# Terminal coverage summary
pytest --cov=src --cov-report=term-missing
```

## CI/CD Pipeline

### GitHub Actions Workflow
- **File**: `.github/workflows/tests.yml`
- **Triggers**: Push to `main`/`develop`, Pull Requests
- **Jobs**:
  1. **Test**: Run unit + integration tests (Python 3.11, 3.12)
  2. **Lint**: Code formatting (Black, isort, flake8, mypy)
  3. **Security**: Vulnerability scanning (Bandit, Safety)
  4. **Notify**: Report results

### Required Secrets
Configure these in GitHub repository settings:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_KEY`: Supabase service key
- `JWT_SECRET_KEY`: JWT token secret

### Coverage Threshold
- **Minimum**: 70% code coverage
- **Enforced in CI**: Pipeline fails if coverage drops below threshold

## Test Structure

### Example: Book Module Tests

#### Unit Test (Broker)
```python
# tests/unit/test_book_broker.py
async def test_select_all_books_success(broker, mock_supabase_client):
    mock_response = MagicMock()
    mock_response.data = [sample_book_dict]
    
    with patch('asyncio.to_thread', return_value=mock_response):
        result = await broker.SelectAllBooks()
    
    assert len(result) == 1
```

#### Unit Test (Service)
```python
# tests/unit/test_book_service.py
async def test_add_book_success(service, mock_broker):
    mock_broker.SelectBookByIsbn.return_value = None
    mock_broker.InsertBook.return_value = sample_book_dict
    
    result = await service.AddBook(book_create)
    
    assert isinstance(result, BookResponse)
```

#### Integration Test (Router)
```python
# tests/integration/test_book_router.py
def test_get_books_success(client, mock_admin_token):
    with patch('src.utils.auth.get_current_user', return_value=mock_admin):
        response = client.get("/books/", headers={"Authorization": mock_admin_token})
    
    assert response.status_code == 200
```

## Test Fixtures

Global fixtures defined in `conftest.py`:
- `mock_supabase_client`: Mocked Supabase client
- `sample_book_dict`: Sample book data
- `sample_user_dict`: Sample user data
- `sample_loan_dict`: Sample loan data
- `mock_admin_user`: Mock admin authentication
- `mock_student_user`: Mock student authentication

## Best Practices

### 1. Naming Conventions
- Test files: `test_<module_name>.py`
- Test classes: `TestClassName`
- Test methods: `test_<functionality>_<scenario>`

### 2. Test Organization
- Arrange: Set up test data and mocks
- Act: Execute the function/endpoint
- Assert: Verify results

### 3. Markers
```python
@pytest.mark.unit       # Unit test
@pytest.mark.integration # Integration test
@pytest.mark.slow       # Slow-running test
```

### 4. Async Testing
```python
@pytest.mark.asyncio
async def test_async_function():
    result = await async_function()
    assert result is not None
```

## Next Steps

### Expand Test Coverage
1. Add unit tests for remaining brokers (User, Loan, Course, BookCopy, Stats)
2. Add service tests for remaining services
3. Add integration tests for all routers
4. Add E2E Selenium tests for critical workflows:
   - Login flow
   - Book search and reserve
   - Admin loan approval
   - Book return process

### Improve CI/CD
1. Add deployment step after successful tests
2. Add performance testing
3. Add database migration tests
4. Add API documentation generation

## References

- [pytest Documentation](https://docs.pytest.org/)
- [pytest-asyncio](https://pytest-asyncio.readthedocs.io/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [Selenium Python](https://selenium-python.readthedocs.io/)

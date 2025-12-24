"""
Pytest configuration and fixtures
"""
import pytest
import asyncio
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
from datetime import datetime, timedelta

# Async fixture for event loop
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the event loop for the entire test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# Mock Supabase Client
@pytest.fixture
def mock_supabase_client():
    """Mock Supabase client for testing brokers"""
    client = MagicMock()
    client.table = MagicMock(return_value=client)
    client.select = MagicMock(return_value=client)
    client.insert = MagicMock(return_value=client)
    client.update = MagicMock(return_value=client)
    client.delete = MagicMock(return_value=client)
    client.eq = MagicMock(return_value=client)
    client.range = MagicMock(return_value=client)
    client.execute = MagicMock()
    return client


# Mock Book Data
@pytest.fixture
def sample_book_dict():
    """Sample book dictionary for testing"""
    return {
        "id": str(uuid4()),
        "title": "Test Book",
        "author": "Test Author",
        "isbn": "978-0-123456-78-9",
        "publisher": "Test Publisher",
        "publication_year": 2023,
        "book_number": "001",
        "call_number": "QA76.73",
        "faculty": "Engineering",
        "edition": "1st",
        "pages": 300,
        "language": "English",
        "marc_data": {},
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }


@pytest.fixture
def sample_book_create_dict():
    """Sample book create data for testing"""
    return {
        "title": "Test Book",
        "author": "Test Author",
        "isbn": "978-0-123456-78-9",
        "publisher": "Test Publisher",
        "publication_year": 2023,
        "book_number": "001",
        "call_number": "QA76.73",
        "faculty": "Engineering",
        "edition": "1st",
        "pages": 300,
        "language": "English"
    }


# Mock User Data
@pytest.fixture
def sample_user_dict():
    """Sample user dictionary for testing"""
    return {
        "id": str(uuid4()),
        "email": "test@eui.edu",
        "full_name": "Test User",
        "university_id": "20210001",
        "role": "student",
        "department": "Computer Science",
        "phone": "+123456789",
        "address": "Test Address",
        "is_blacklisted": False,
        "blacklist_reason": None,
        "infractions": 0,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }


# Mock Loan Data
@pytest.fixture
def sample_loan_dict():
    """Sample loan dictionary for testing"""
    return {
        "id": str(uuid4()),
        "user_id": str(uuid4()),
        "copy_id": str(uuid4()),
        "status": "pending",
        "request_date": datetime.now().isoformat(),
        "approved_date": None,
        "loan_date": None,
        "due_date": (datetime.now() + timedelta(days=14)).isoformat(),
        "return_date": None,
        "fine_amount": 0.0,
        "notes": None,
        "created_by": str(uuid4()),
        "approved_by": None,
        "checked_out_by": None,
        "returned_to": None,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }


# Mock Book Copy Data
@pytest.fixture
def sample_copy_dict():
    """Sample book copy dictionary for testing"""
    return {
        "id": str(uuid4()),
        "book_id": str(uuid4()),
        "accession_number": 1001,
        "barcode": "123456789",
        "is_reference": False,
        "status": "available",
        "location": "Main Library",
        "notes": None,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }


# Mock Authentication
@pytest.fixture
def mock_admin_user():
    """Mock admin user for testing protected endpoints"""
    return {
        "id": str(uuid4()),
        "email": "admin@eui.edu",
        "full_name": "Admin User",
        "role": "admin",
        "university_id": "20210000"
    }


@pytest.fixture
def mock_student_user():
    """Mock student user for testing protected endpoints"""
    return {
        "id": str(uuid4()),
        "email": "student@eui.edu",
        "full_name": "Student User",
        "role": "student",
        "university_id": "20210001"
    }


# Database Response Mock
@pytest.fixture
def mock_db_response():
    """Mock database response object"""
    response = MagicMock()
    response.data = []
    return response

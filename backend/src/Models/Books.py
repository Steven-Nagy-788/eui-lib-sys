from pydantic import BaseModel, UUID4
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

# --- ENUMS ---
class BookStatus(str, Enum):
    AVAILABLE = "available"
    LOST = "lost"
    maintenance = "maintenance"

# --- BOOKS (Catalog) ---
class BookBase(BaseModel):
    isbn: str
    book_number: Optional[str] = None
    call_number: Optional[str] = None
    title: str
    author: str
    faculty: Optional[str] = None
    publisher: Optional[str] = None
    publication_year: Optional[int] = None
    book_pic_url: Optional[str] = None
    marc_data: Optional[Dict[str, Any]] = None # JSONB

class BookCreate(BookBase):
    pass

class BookResponse(BookBase):
    id: UUID4
    created_at: datetime

class BookCopyStats(BaseModel):
    total: int = 0
    available: int = 0
    reference: int = 0
    circulating: int = 0
    checked_out: int = 0

class BookWithStatsResponse(BookBase):
    id: UUID4
    created_at: datetime
    copy_stats: BookCopyStats

class CourseInfo(BaseModel):
    course_code: str
    course_name: str
    faculty: Optional[str] = None
    term: Optional[str] = None

class BookWithStatsAndCoursesResponse(BookBase):
    id: UUID4
    created_at: datetime
    copy_stats: BookCopyStats
    courses: List[CourseInfo] = []

# --- COPIES (Inventory) ---
class BookCopyBase(BaseModel):
    book_id: UUID4
    is_reference: bool = False
    status: BookStatus = BookStatus.AVAILABLE

class BookCopyCreate(BookCopyBase):
    pass

class BookCopyUpdate(BaseModel):
    is_reference: Optional[bool] = None
    status: Optional[BookStatus] = None

class BookCopyResponse(BookCopyBase):
    id: UUID4
    accession_number: int  # The auto-generated barcode (10001)
    created_at: datetime

class BookCopyWithBorrowerInfo(BookCopyBase):
    """Book copy with borrower information for admin view"""
    id: UUID4
    accession_number: int
    created_at: datetime
    current_borrower_name: Optional[str] = None
    current_borrower_id: Optional[str] = None
    current_loan_id: Optional[UUID4] = None

# --- LOGIC INPUTS ---
class AddInventoryRequest(BaseModel):
    book_id: UUID4
    quantity: int = 1  # How many copies to add?
    # Logic determines 30% reference automatically
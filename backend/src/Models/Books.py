from pydantic import BaseModel, UUID4
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

# --- ENUMS ---
class BookStatus(str, Enum):
    AVAILABLE = "available"
    MAINTENANCE = "maintenance"
    LOST = "lost"

# --- BOOKS (Catalog) ---
class BookBase(BaseModel):
    isbn: str
    book_number: Optional[str] = None
    call_number: Optional[str] = None
    title: str
    author: str
    publisher: Optional[str] = None
    publication_year: Optional[int] = None
    book_pic_url: Optional[str] = None
    marc_data: Optional[Dict[str, Any]] = None # JSONB

class BookCreate(BookBase):
    pass

class BookResponse(BookBase):
    id: UUID4
    created_at: datetime

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

# --- LOGIC INPUTS ---
class AddInventoryRequest(BaseModel):
    book_id: UUID4
    quantity: int = 1  # How many copies to add?
    # Logic determines 30% reference automatically
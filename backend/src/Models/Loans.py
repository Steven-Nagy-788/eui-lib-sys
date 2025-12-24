from pydantic import BaseModel, UUID4
from datetime import datetime
from enum import Enum
from typing import Optional

# --- ENUMS ---
class LoanStatus(str, Enum):
    PENDING = "pending"
    PENDING_PICKUP = "pending_pickup"
    ACTIVE = "active"
    CANCELED = "canceled"
    RETURNED = "returned"
    OVERDUE = "overdue"
    REJECTED = "rejected"

# --- POLICIES ---
class LoanPolicyResponse(BaseModel):
    role: str
    max_books: int
    loan_days: int

class LoanPolicyUpdate(BaseModel):
    max_books: Optional[int] = None
    loan_days: Optional[int] = None

class DueDateCalculation(BaseModel):
    """Response model for due date calculation"""
    copy_id: UUID4
    user_id: UUID4
    due_date: datetime
    loan_days: int
    calculation_method: str  # 'course_override' or 'role_policy'
    role: str

# --- LOAN TRANSACTIONS ---
class LoanBase(BaseModel):
    user_id: UUID4
    copy_id: UUID4

class LoanRequest(BaseModel):
    copy_id: UUID4
    # User ID is usually injected via Token, but can be explicit for Admins

class LoanCreate(LoanBase):
    status: LoanStatus = LoanStatus.PENDING

class LoanUpdate(BaseModel):
    status: Optional[LoanStatus] = None
    approval_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    return_date: Optional[datetime] = None

class LoanResponse(BaseModel):
    id: UUID4
    user_id: UUID4
    copy_id: UUID4
    status: LoanStatus
    request_date: datetime
    approval_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    return_date: Optional[datetime] = None

class LoanWithBookInfo(BaseModel):
    """Loan response with book details for frontend display"""
    id: UUID4
    user_id: UUID4
    copy_id: UUID4
    status: LoanStatus
    request_date: datetime
    approval_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    return_date: Optional[datetime] = None
    is_overdue: bool = False
    
    # Book information from JOIN
    book_id: UUID4
    book_title: str
    book_author: str
    book_isbn: str
    book_publisher: Optional[str] = None
    book_pic_url: Optional[str] = None
    copy_accession_number: int
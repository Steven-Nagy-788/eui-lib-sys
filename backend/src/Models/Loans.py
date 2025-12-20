from pydantic import BaseModel, UUID4
from datetime import datetime
from enum import Enum
from typing import Optional

# --- ENUMS ---
class LoanStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    RETURNED = "returned"
    OVERDUE = "overdue"
    REJECTED = "rejected"

# --- POLICIES ---
class LoanPolicyResponse(BaseModel):
    role: str
    max_books: int
    loan_days: int

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
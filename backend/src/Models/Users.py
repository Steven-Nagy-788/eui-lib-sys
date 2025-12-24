from pydantic import BaseModel, EmailStr, UUID4
from enum import Enum
from typing import Optional
from datetime import datetime

# --- ENUMS ---
class UserRole(str, Enum):
    ADMIN = "admin"
    STUDENT = "student"
    PROFESSOR = "professor"

# --- SHARED BASE ---
class UserBase(BaseModel):
    university_id: str
    full_name: str
    email: EmailStr
    role: UserRole = UserRole.STUDENT
    faculty: Optional[str] = None
    academic_year: Optional[int] = None

# --- INPUTS ---
class UserCreate(UserBase):
    password: str  # Plain text, will be hashed by Service

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    university_id: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None
    faculty: Optional[str] = None
    academic_year: Optional[int] = None
    infractions_count: Optional[int] = None
    is_blacklisted: Optional[bool] = None
    blacklist_note: Optional[str] = None

# --- OUTPUTS ---
class UserResponse(UserBase):
    id: UUID4
    infractions_count: int = 0
    is_blacklisted: bool
    blacklist_note: Optional[str] = None
    created_at: datetime
    active_loans_count: int = 0
    total_loans_count: int = 0

class Token(BaseModel):
    access_token: str
    token_type: str

class UserStats(BaseModel):
    active_loans: int = 0
    total_loans: int = 0
    overdue_loans: int = 0
    infractions: int = 0
    pending_requests: int = 0

class UserDashboardResponse(BaseModel):
    user: UserResponse
    stats: UserStats
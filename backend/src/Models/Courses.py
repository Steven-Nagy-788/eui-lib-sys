from typing import Optional

from pydantic import UUID4, BaseModel


# --- COURSES ---
class CourseBase(BaseModel):
    code: str  # Primary Key e.g., "C-MA111"
    name: str
    term: Optional[str] = None
    faculty: Optional[str] = None
    course_loan_days: int = 90


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    term: Optional[str] = None
    faculty: Optional[str] = None
    course_loan_days: Optional[int] = None


class CourseResponse(CourseBase):
    pass


# --- ENROLLMENTS ---
class EnrollmentBase(BaseModel):
    student_id: UUID4
    course_code: str
    semester: str


class EnrollmentCreate(EnrollmentBase):
    pass


class EnrollmentResponse(EnrollmentBase):
    id: UUID4


# --- COURSE BOOKS ---
class CourseBookBase(BaseModel):
    course_code: str
    book_id: UUID4


class CourseBookCreate(CourseBookBase):
    pass


class CourseBookResponse(CourseBookBase):
    pass

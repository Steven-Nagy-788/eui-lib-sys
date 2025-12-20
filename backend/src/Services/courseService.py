from typing import List, Optional
from uuid import UUID
from ..Models.Courses import (
    CourseCreate, 
    CourseResponse, 
    CourseUpdate,
    EnrollmentCreate,
    EnrollmentResponse,
    CourseBookCreate,
    CourseBookResponse
)
from ..Brokers.courseBroker import CourseBroker


class CourseService:
    def __init__(self, broker: CourseBroker):
        self.broker = broker

    # ==================== COURSES ====================
    
    async def get_all_courses(self, skip: int = 0, limit: int = 10) -> List[CourseResponse]:
        """Get all courses with pagination"""
        courses = await self.broker.select_all_courses(skip=skip, limit=limit)
        return [CourseResponse(**course) for course in courses]
    
    async def get_course_by_code(self, code: str) -> Optional[CourseResponse]:
        """Get a course by its code"""
        course_data = await self.broker.select_course_by_code(code)
        return CourseResponse(**course_data) if course_data else None
    
    async def get_courses_by_faculty(self, faculty: str) -> List[CourseResponse]:
        """Get all courses for a specific faculty"""
        courses = await self.broker.select_courses_by_faculty(faculty)
        return [CourseResponse(**course) for course in courses]
    
    async def create_course(self, course: CourseCreate) -> CourseResponse:
        """Create a new course"""
        # Check if course already exists
        existing = await self.broker.select_course_by_code(course.code)
        if existing:
            raise ValueError(f"Course with code {course.code} already exists")
        
        course_data = course.model_dump()
        created_course = await self.broker.insert_course(course_data)
        return CourseResponse(**created_course)
    
    async def update_course(self, code: str, course_update: CourseUpdate) -> Optional[CourseResponse]:
        """Update a course"""
        # Check if course exists
        existing = await self.broker.select_course_by_code(code)
        if not existing:
            return None
        
        update_data = course_update.model_dump(exclude_unset=True)
        updated_course = await self.broker.update_course(code, update_data)
        return CourseResponse(**updated_course) if updated_course else None
    
    async def delete_course(self, code: str) -> bool:
        """Delete a course (will cascade delete enrollments and course_books)"""
        return await self.broker.delete_course(code)

    # ==================== ENROLLMENTS ====================
    
    async def get_all_enrollments(self, skip: int = 0, limit: int = 10) -> List[EnrollmentResponse]:
        """Get all enrollments with pagination"""
        enrollments = await self.broker.select_all_enrollments(skip=skip, limit=limit)
        return [EnrollmentResponse(**enrollment) for enrollment in enrollments]
    
    async def get_enrollment_by_id(self, enrollment_id: UUID) -> Optional[EnrollmentResponse]:
        """Get an enrollment by ID"""
        enrollment_data = await self.broker.select_enrollment_by_id(enrollment_id)
        return EnrollmentResponse(**enrollment_data) if enrollment_data else None
    
    async def get_enrollments_by_student(self, student_id: UUID) -> List[EnrollmentResponse]:
        """Get all enrollments for a student"""
        enrollments = await self.broker.select_enrollments_by_student(student_id)
        return [EnrollmentResponse(**enrollment) for enrollment in enrollments]
    
    async def get_enrollments_by_course(self, course_code: str) -> List[EnrollmentResponse]:
        """Get all students enrolled in a course"""
        enrollments = await self.broker.select_enrollments_by_course(course_code)
        return [EnrollmentResponse(**enrollment) for enrollment in enrollments]
    
    async def is_student_enrolled(self, student_id: UUID, course_code: str) -> bool:
        """Check if a student is enrolled in a course"""
        return await self.broker.check_enrollment_exists(student_id, course_code)
    
    async def enroll_student(self, enrollment: EnrollmentCreate) -> EnrollmentResponse:
        """Enroll a student in a course"""
        # Verify course exists
        course = await self.broker.select_course_by_code(enrollment.course_code)
        if not course:
            raise ValueError(f"Course {enrollment.course_code} does not exist")
        
        # Check if already enrolled
        already_enrolled = await self.broker.check_enrollment_exists(
            enrollment.student_id, 
            enrollment.course_code
        )
        if already_enrolled:
            raise ValueError(f"Student already enrolled in course {enrollment.course_code}")
        
        enrollment_data = enrollment.model_dump()
        enrollment_data['student_id'] = str(enrollment_data['student_id'])
        
        created_enrollment = await self.broker.insert_enrollment(enrollment_data)
        return EnrollmentResponse(**created_enrollment)
    
    async def unenroll_student(self, enrollment_id: UUID) -> bool:
        """Remove student enrollment by enrollment ID"""
        return await self.broker.delete_enrollment(enrollment_id)
    
    async def unenroll_student_from_course(self, student_id: UUID, course_code: str) -> bool:
        """Remove student from a specific course"""
        return await self.broker.delete_enrollment_by_student_course(student_id, course_code)

    # ==================== COURSE BOOKS ====================
    
    async def get_books_for_course(self, course_code: str) -> List[CourseBookResponse]:
        """Get all books required for a course"""
        course_books = await self.broker.select_books_by_course(course_code)
        return [CourseBookResponse(**cb) for cb in course_books]
    
    async def get_courses_for_book(self, book_id: UUID) -> List[CourseBookResponse]:
        """Get all courses that require a specific book"""
        course_books = await self.broker.select_courses_by_book(book_id)
        return [CourseBookResponse(**cb) for cb in course_books]
    
    async def add_book_to_course(self, course_book: CourseBookCreate) -> CourseBookResponse:
        """Associate a book with a course"""
        # Verify course exists
        course = await self.broker.select_course_by_code(course_book.course_code)
        if not course:
            raise ValueError(f"Course {course_book.course_code} does not exist")
        
        # Check if association already exists
        already_exists = await self.broker.check_course_book_exists(
            course_book.course_code,
            course_book.book_id
        )
        if already_exists:
            raise ValueError(f"Book already associated with course {course_book.course_code}")
        
        course_book_data = course_book.model_dump()
        course_book_data['book_id'] = str(course_book_data['book_id'])
        
        created_course_book = await self.broker.insert_course_book(course_book_data)
        return CourseBookResponse(**created_course_book)
    
    async def remove_book_from_course(self, course_code: str, book_id: UUID) -> bool:
        """Remove a book from a course"""
        return await self.broker.delete_course_book(course_code, book_id)

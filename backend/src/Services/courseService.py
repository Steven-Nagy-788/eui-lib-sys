from typing import List, Optional
from uuid import UUID
from ..Models.Courses import (
    CourseCreate,
    CourseResponse,
    CourseUpdate,
    EnrollmentCreate,
    EnrollmentResponse,
    CourseBookCreate,
    CourseBookResponse,
)
from ..Brokers.courseBroker import CourseBroker


class CourseService:
    def __init__(self, broker: CourseBroker):
        self.broker = broker

    # ==================== COURSES ====================

    async def RetrieveAllCourses(
        self, skip: int = 0, limit: int = 10
    ) -> List[CourseResponse]:
        """Get all courses with pagination"""
        courses = await self.broker.SelectAllCourses(skip=skip, limit=limit)
        return [CourseResponse(**course) for course in courses]

    async def RetrieveCourseByCode(self, code: str) -> Optional[CourseResponse]:
        """Get a course by its code"""
        course_data = await self.broker.SelectCourseByCode(code)
        return CourseResponse(**course_data) if course_data else None

    async def RetrieveCoursesByFaculty(self, faculty: str) -> List[CourseResponse]:
        """Get all courses for a specific faculty"""
        courses = await self.broker.SelectCoursesByFaculty(faculty)
        return [CourseResponse(**course) for course in courses]

    async def AddCourse(self, course: CourseCreate) -> CourseResponse:
        """Create a new course"""
        # Check if course already exists
        existing = await self.broker.SelectCourseByCode(course.code)
        if existing:
            raise ValueError(f"Course with code {course.code} already exists")

        course_data = course.model_dump()
        created_course = await self.broker.InsertCourse(course_data)
        return CourseResponse(**created_course)

    async def ModifyCourse(
        self, code: str, course_update: CourseUpdate
    ) -> Optional[CourseResponse]:
        """Update a course"""
        # Check if course exists
        existing = await self.broker.SelectCourseByCode(code)
        if not existing:
            return None

        update_data = course_update.model_dump(exclude_unset=True)
        updated_course = await self.broker.UpdateCourse(code, update_data)
        return CourseResponse(**updated_course) if updated_course else None

    async def RemoveCourse(self, code: str) -> bool:
        """Delete a course (will cascade delete enrollments and course_books)"""
        return await self.broker.DeleteCourse(code)

    # ==================== ENROLLMENTS ====================

    async def RetrieveAllEnrollments(
        self, skip: int = 0, limit: int = 10
    ) -> List[EnrollmentResponse]:
        """Get all enrollments with pagination"""
        enrollments = await self.broker.SelectAllEnrollments(skip=skip, limit=limit)
        return [EnrollmentResponse(**enrollment) for enrollment in enrollments]

    async def RetrieveEnrollmentById(
        self, enrollment_id: UUID
    ) -> Optional[EnrollmentResponse]:
        """Get an enrollment by ID"""
        enrollment_data = await self.broker.SelectEnrollmentById(enrollment_id)
        return EnrollmentResponse(**enrollment_data) if enrollment_data else None

    async def RetrieveEnrollmentsByStudent(
        self, student_id: UUID
    ) -> List[EnrollmentResponse]:
        """Get all enrollments for a student"""
        enrollments = await self.broker.SelectEnrollmentsByStudent(student_id)
        return [EnrollmentResponse(**enrollment) for enrollment in enrollments]

    async def RetrieveEnrollmentsByCourse(
        self, course_code: str
    ) -> List[EnrollmentResponse]:
        """Get all students enrolled in a course"""
        enrollments = await self.broker.SelectEnrollmentsByCourse(course_code)
        return [EnrollmentResponse(**enrollment) for enrollment in enrollments]

    async def CheckStudentEnrolled(self, student_id: UUID, course_code: str) -> bool:
        """Check if a student is enrolled in a course"""
        return await self.broker.CheckEnrollmentExists(student_id, course_code)

    async def AddEnrollment(self, enrollment: EnrollmentCreate) -> EnrollmentResponse:
        """Enroll a student in a course"""
        # Verify course exists
        course = await self.broker.SelectCourseByCode(enrollment.course_code)
        if not course:
            raise ValueError(f"Course {enrollment.course_code} does not exist")

        # Check if already enrolled
        already_enrolled = await self.broker.CheckEnrollmentExists(
            enrollment.student_id, enrollment.course_code
        )
        if already_enrolled:
            raise ValueError(
                f"Student already enrolled in course {enrollment.course_code}"
            )

        enrollment_data = enrollment.model_dump()
        enrollment_data["student_id"] = str(enrollment_data["student_id"])

        created_enrollment = await self.broker.InsertEnrollment(enrollment_data)
        return EnrollmentResponse(**created_enrollment)

    async def RemoveEnrollment(self, enrollment_id: UUID) -> bool:
        """Remove student enrollment by enrollment ID"""
        return await self.broker.DeleteEnrollment(enrollment_id)

    async def RemoveEnrollmentByStudentCourse(
        self, student_id: UUID, course_code: str
    ) -> bool:
        """Remove student from a specific course"""
        return await self.broker.DeleteEnrollmentByStudentCourse(
            student_id, course_code
        )

    # ==================== COURSE BOOKS ====================

    async def RetrieveBooksForCourse(
        self, course_code: str
    ) -> List[CourseBookResponse]:
        """Get all books required for a course"""
        course_books = await self.broker.SelectBooksByCourse(course_code)
        return [CourseBookResponse(**cb) for cb in course_books]

    async def RetrieveCoursesForBook(self, book_id: UUID) -> List[CourseBookResponse]:
        """Get all courses that require a specific book"""
        course_books = await self.broker.SelectCoursesByBook(book_id)
        return [CourseBookResponse(**cb) for cb in course_books]

    async def AddCourseBook(self, course_book: CourseBookCreate) -> CourseBookResponse:
        """Associate a book with a course"""
        # Verify course exists
        course = await self.broker.SelectCourseByCode(course_book.course_code)
        if not course:
            raise ValueError(f"Course {course_book.course_code} does not exist")

        # Check if association already exists
        already_exists = await self.broker.CheckCourseBookExists(
            course_book.course_code, course_book.book_id
        )
        if already_exists:
            raise ValueError(
                f"Book already associated with course {course_book.course_code}"
            )

        course_book_data = course_book.model_dump()
        course_book_data["book_id"] = str(course_book_data["book_id"])

        created_course_book = await self.broker.InsertCourseBook(course_book_data)
        return CourseBookResponse(**created_course_book)

    async def RemoveCourseBook(self, course_code: str, book_id: UUID) -> bool:
        """Remove a book from a course"""
        return await self.broker.DeleteCourseBook(course_code, book_id)

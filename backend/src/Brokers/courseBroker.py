import asyncio
from typing import Optional
from uuid import UUID

from supabase import Client


class CourseBroker:
    def __init__(self, client: Client):
        self.client = client

    # ==================== COURSES ====================

    async def SelectAllCourses(self, skip: int = 0, limit: int = 10) -> list[dict]:
        """Get all courses with pagination"""

        def _fetch():
            return (
                self.client.table("courses")
                .select("*")
                .range(skip, skip + limit - 1)
                .execute()
            )

        courses = await asyncio.to_thread(_fetch)
        return courses.data

    async def SelectCourseByCode(self, code: str) -> Optional[dict]:
        """Get a course by its code (primary key)"""

        def _fetch():
            return self.client.table("courses").select("*").eq("code", code).execute()

        response = await asyncio.to_thread(_fetch)
        return response.data[0] if response.data else None

    async def SelectCoursesByFaculty(self, faculty: str) -> list[dict]:
        """Get all courses for a specific faculty"""

        def _fetch():
            return (
                self.client.table("courses")
                .select("*")
                .eq("faculty", faculty)
                .execute()
            )

        response = await asyncio.to_thread(_fetch)
        return response.data if response.data else []

    async def InsertCourse(self, course_data: dict) -> dict:
        """Insert a new course"""

        def _insert():
            return self.client.table("courses").insert(course_data).execute()

        return (await asyncio.to_thread(_insert)).data[0]

    async def UpdateCourse(self, code: str, update_data: dict) -> Optional[dict]:
        """Update a course by code"""

        def _update():
            return (
                self.client.table("courses")
                .update(update_data)
                .eq("code", code)
                .execute()
            )

        response = await asyncio.to_thread(_update)
        if response.data:
            return response.data[0]
        return None

    async def DeleteCourse(self, code: str) -> bool:
        """Delete a course"""

        def _delete():
            return self.client.table("courses").delete().eq("code", code).execute()

        result = await asyncio.to_thread(_delete)
        return len(result.data) > 0

    # ==================== ENROLLMENTS ====================

    async def SelectAllEnrollments(self, skip: int = 0, limit: int = 10) -> list[dict]:
        """Get all enrollments with pagination"""

        def _fetch():
            return (
                self.client.table("enrollments")
                .select("*")
                .range(skip, skip + limit - 1)
                .execute()
            )

        enrollments = await asyncio.to_thread(_fetch)
        return enrollments.data

    async def SelectEnrollmentById(self, enrollment_id: UUID) -> Optional[dict]:
        """Get an enrollment by ID"""

        def _fetch():
            return (
                self.client.table("enrollments")
                .select("*")
                .eq("id", str(enrollment_id))
                .execute()
            )

        response = await asyncio.to_thread(_fetch)
        return response.data[0] if response.data else None

    async def SelectEnrollmentsByStudent(self, student_id: UUID) -> list[dict]:
        """Get all enrollments for a specific student"""

        def _fetch():
            return (
                self.client.table("enrollments")
                .select("*")
                .eq("student_id", str(student_id))
                .execute()
            )

        response = await asyncio.to_thread(_fetch)
        return response.data if response.data else []

    async def SelectEnrollmentsByCourse(self, course_code: str) -> list[dict]:
        """Get all enrollments for a specific course"""

        def _fetch():
            return (
                self.client.table("enrollments")
                .select("*")
                .eq("course_code", course_code)
                .execute()
            )

        response = await asyncio.to_thread(_fetch)
        return response.data if response.data else []

    async def CheckEnrollmentExists(self, student_id: UUID, course_code: str) -> bool:
        """Check if a student is enrolled in a course"""

        def _fetch():
            return (
                self.client.table("enrollments")
                .select("id")
                .eq("student_id", str(student_id))
                .eq("course_code", course_code)
                .execute()
            )

        response = await asyncio.to_thread(_fetch)
        return len(response.data) > 0

    async def InsertEnrollment(self, enrollment_data: dict) -> dict:
        """Insert a new enrollment"""

        def _insert():
            return self.client.table("enrollments").insert(enrollment_data).execute()

        return (await asyncio.to_thread(_insert)).data[0]

    async def DeleteEnrollment(self, enrollment_id: UUID) -> bool:
        """Delete an enrollment"""

        def _delete():
            return (
                self.client.table("enrollments")
                .delete()
                .eq("id", str(enrollment_id))
                .execute()
            )

        result = await asyncio.to_thread(_delete)
        return len(result.data) > 0

    async def DeleteEnrollmentByStudentCourse(
        self, student_id: UUID, course_code: str
    ) -> bool:
        """Delete enrollment by student and course"""

        def _delete():
            return (
                self.client.table("enrollments")
                .delete()
                .eq("student_id", str(student_id))
                .eq("course_code", course_code)
                .execute()
            )

        result = await asyncio.to_thread(_delete)
        return len(result.data) > 0

    # ==================== COURSE BOOKS ====================

    async def SelectBooksByCourse(self, course_code: str) -> list[dict]:
        """Get all books for a specific course"""

        def _fetch():
            return (
                self.client.table("course_books")
                .select("*")
                .eq("course_code", course_code)
                .execute()
            )

        response = await asyncio.to_thread(_fetch)
        return response.data if response.data else []

    async def SelectCoursesByBook(self, book_id: UUID) -> list[dict]:
        """Get all courses that require a specific book"""

        def _fetch():
            return (
                self.client.table("course_books")
                .select("*")
                .eq("book_id", str(book_id))
                .execute()
            )

        response = await asyncio.to_thread(_fetch)
        return response.data if response.data else []

    async def CheckCourseBookExists(self, course_code: str, book_id: UUID) -> bool:
        """Check if a book is already associated with a course"""

        def _fetch():
            return (
                self.client.table("course_books")
                .select("course_code")
                .eq("course_code", course_code)
                .eq("book_id", str(book_id))
                .execute()
            )

        response = await asyncio.to_thread(_fetch)
        return len(response.data) > 0

    async def InsertCourseBook(self, course_book_data: dict) -> dict:
        """Associate a book with a course"""

        def _insert():
            return self.client.table("course_books").insert(course_book_data).execute()

        return (await asyncio.to_thread(_insert)).data[0]

    async def DeleteCourseBook(self, course_code: str, book_id: UUID) -> bool:
        """Remove book from course"""

        def _delete():
            return (
                self.client.table("course_books")
                .delete()
                .eq("course_code", course_code)
                .eq("book_id", str(book_id))
                .execute()
            )

        result = await asyncio.to_thread(_delete)
        return len(result.data) > 0

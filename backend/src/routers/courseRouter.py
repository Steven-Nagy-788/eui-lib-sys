from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from uuid import UUID

from ..dependencies import get_course_service
from ..Services.courseService import CourseService
from ..Models.Courses import (
    CourseCreate,
    CourseResponse,
    CourseUpdate,
    EnrollmentCreate,
    EnrollmentResponse,
    CourseBookCreate,
    CourseBookResponse
)

router = APIRouter(
    prefix="/courses",
    tags=["courses"]
)

# ==================== COURSES ====================

@router.get("/", response_model=List[CourseResponse])
async def get_all_courses(
    skip: int = 0,
    limit: int = 100,
    service: CourseService = Depends(get_course_service)
):
    """Get all courses with pagination"""
    return await service.get_all_courses(skip=skip, limit=limit)


@router.get("/faculty/{faculty}", response_model=List[CourseResponse])
async def get_courses_by_faculty(
    faculty: str,
    service: CourseService = Depends(get_course_service)
):
    """Get all courses for a specific faculty"""
    return await service.get_courses_by_faculty(faculty)


@router.get("/{course_code}", response_model=CourseResponse)
async def get_course(
    course_code: str,
    service: CourseService = Depends(get_course_service)
):
    """Get a course by its code"""
    course = await service.get_course_by_code(course_code)
    if course is None:
        raise HTTPException(status_code=404, detail=f"Course {course_code} not found")
    return course


@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course: CourseCreate,
    service: CourseService = Depends(get_course_service)
):
    """Create a new course"""
    try:
        new_course = await service.create_course(course)
        return new_course
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/{course_code}", response_model=CourseResponse)
async def update_course(
    course_code: str,
    course_update: CourseUpdate,
    service: CourseService = Depends(get_course_service)
):
    """Update a course"""
    try:
        updated_course = await service.update_course(course_code, course_update)
        if updated_course is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Course {course_code} not found"
            )
        return updated_course
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{course_code}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_code: str,
    service: CourseService = Depends(get_course_service)
):
    """Delete a course (cascades to enrollments and course books)"""
    success = await service.delete_course(course_code)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course {course_code} not found"
        )
    return None


# ==================== ENROLLMENTS ====================

@router.get("/enrollments/all", response_model=List[EnrollmentResponse])
async def get_all_enrollments(
    skip: int = 0,
    limit: int = 100,
    service: CourseService = Depends(get_course_service)
):
    """Get all enrollments with pagination"""
    return await service.get_all_enrollments(skip=skip, limit=limit)


@router.get("/{course_code}/enrollments", response_model=List[EnrollmentResponse])
async def get_course_enrollments(
    course_code: str,
    service: CourseService = Depends(get_course_service)
):
    """Get all students enrolled in a specific course"""
    return await service.get_enrollments_by_course(course_code)


@router.get("/enrollments/student/{student_id}", response_model=List[EnrollmentResponse])
async def get_student_enrollments(
    student_id: UUID,
    service: CourseService = Depends(get_course_service)
):
    """Get all courses a student is enrolled in"""
    return await service.get_enrollments_by_student(student_id)


@router.get("/enrollments/{enrollment_id}", response_model=EnrollmentResponse)
async def get_enrollment(
    enrollment_id: UUID,
    service: CourseService = Depends(get_course_service)
):
    """Get a specific enrollment by ID"""
    enrollment = await service.get_enrollment_by_id(enrollment_id)
    if enrollment is None:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    return enrollment


@router.post("/enrollments", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
async def enroll_student(
    enrollment: EnrollmentCreate,
    service: CourseService = Depends(get_course_service)
):
    """Enroll a student in a course"""
    try:
        new_enrollment = await service.enroll_student(enrollment)
        return new_enrollment
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/enrollments/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unenroll_student(
    enrollment_id: UUID,
    service: CourseService = Depends(get_course_service)
):
    """Remove a student enrollment by enrollment ID"""
    success = await service.unenroll_student(enrollment_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found"
        )
    return None


@router.delete("/enrollments/student/{student_id}/course/{course_code}", status_code=status.HTTP_204_NO_CONTENT)
async def unenroll_student_from_course(
    student_id: UUID,
    course_code: str,
    service: CourseService = Depends(get_course_service)
):
    """Remove a student from a specific course"""
    success = await service.unenroll_student_from_course(student_id, course_code)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student not enrolled in course {course_code}"
        )
    return None


# ==================== COURSE BOOKS ====================

@router.get("/{course_code}/books", response_model=List[CourseBookResponse])
async def get_course_books(
    course_code: str,
    service: CourseService = Depends(get_course_service)
):
    """Get all books required for a course"""
    return await service.get_books_for_course(course_code)


@router.get("/books/{book_id}/courses", response_model=List[CourseBookResponse])
async def get_book_courses(
    book_id: UUID,
    service: CourseService = Depends(get_course_service)
):
    """Get all courses that require a specific book"""
    return await service.get_courses_for_book(book_id)


@router.post("/course-books", response_model=CourseBookResponse, status_code=status.HTTP_201_CREATED)
async def add_book_to_course(
    course_book: CourseBookCreate,
    service: CourseService = Depends(get_course_service)
):
    """Associate a book with a course"""
    try:
        new_course_book = await service.add_book_to_course(course_book)
        return new_course_book
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{course_code}/books/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_book_from_course(
    course_code: str,
    book_id: UUID,
    service: CourseService = Depends(get_course_service)
):
    """Remove a book from a course"""
    success = await service.remove_book_from_course(course_code, book_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book not associated with course {course_code}"
        )
    return None

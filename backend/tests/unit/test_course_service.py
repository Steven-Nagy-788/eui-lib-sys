"""
Unit tests for CourseService
Tests business logic with mocked CourseBroker
"""

from unittest.mock import AsyncMock

import pytest

from src.Models.Courses import CourseCreate, CourseResponse, CourseUpdate
from src.Services.courseService import CourseService


class TestCourseService:
    """Test suite for CourseService business logic"""

    @pytest.fixture
    def mock_broker(self):
        """Create mocked CourseBroker"""
        return AsyncMock()

    @pytest.fixture
    def service(self, mock_broker):
        """Create CourseService instance with mocked broker"""
        return CourseService(mock_broker)

    @pytest.fixture
    def sample_course_dict(self):
        """Sample course data"""
        return {
            "code": "CS101",
            "name": "Introduction to Computer Science",
            "faculty": "Engineering",
            "required_books": [],
        }

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_retrieve_all_courses_success(
        self, service, mock_broker, sample_course_dict
    ):
        """Test successful retrieval of all courses"""
        mock_broker.SelectAllCourses.return_value = [sample_course_dict]

        result = await service.RetrieveAllCourses(skip=0, limit=50)

        assert len(result) == 1
        assert isinstance(result[0], CourseResponse)
        mock_broker.SelectAllCourses.assert_called_once_with(skip=0, limit=50)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_retrieve_course_by_code_found(
        self, service, mock_broker, sample_course_dict
    ):
        """Test successful retrieval of course by code"""
        course_code = "CS101"
        mock_broker.SelectCourseByCode.return_value = sample_course_dict

        result = await service.RetrieveCourseByCode(course_code)

        assert result is not None
        assert isinstance(result, CourseResponse)
        assert result.code == course_code

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_retrieve_course_by_code_not_found(self, service, mock_broker):
        """Test retrieval when course doesn't exist"""
        mock_broker.SelectCourseByCode.return_value = None

        result = await service.RetrieveCourseByCode("NOTFOUND")

        assert result is None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_add_course_success(self, service, mock_broker, sample_course_dict):
        """Test successful course creation"""
        course_create = CourseCreate(
            code="CS101", name="Introduction to Computer Science", faculty="Engineering"
        )
        mock_broker.SelectCourseByCode.return_value = None
        mock_broker.InsertCourse.return_value = sample_course_dict

        result = await service.AddCourse(course_create)

        assert isinstance(result, CourseResponse)
        mock_broker.InsertCourse.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_add_course_duplicate_code(
        self, service, mock_broker, sample_course_dict
    ):
        """Test course creation with duplicate code"""
        course_create = CourseCreate(
            code="CS101", name="Test Course", faculty="Engineering"
        )
        mock_broker.SelectCourseByCode.return_value = sample_course_dict

        with pytest.raises(ValueError, match="Course with code .* already exists"):
            await service.AddCourse(course_create)

        mock_broker.InsertCourse.assert_not_called()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_modify_course_success(
        self, service, mock_broker, sample_course_dict
    ):
        """Test successful course update"""
        course_code = "CS101"
        course_update = CourseUpdate(name="Updated Course Name")
        updated_course = {**sample_course_dict, "name": "Updated Course Name"}

        mock_broker.SelectCourseByCode.return_value = sample_course_dict
        mock_broker.UpdateCourse.return_value = updated_course

        result = await service.ModifyCourse(course_code, course_update)

        assert result is not None
        assert isinstance(result, CourseResponse)
        assert result.name == "Updated Course Name"

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_remove_course_success(self, service, mock_broker):
        """Test successful course deletion"""
        course_code = "CS101"
        mock_broker.DeleteCourse.return_value = True

        result = await service.RemoveCourse(course_code)

        assert result is True
        mock_broker.DeleteCourse.assert_called_once_with(course_code)

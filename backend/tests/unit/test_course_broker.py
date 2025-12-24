"""
Unit tests for CourseBroker
Tests database operations with mocked Supabase client
"""

import pytest
from unittest.mock import MagicMock, patch
from src.Brokers.courseBroker import CourseBroker


class TestCourseBroker:
    """Test suite for CourseBroker database operations"""

    @pytest.fixture
    def broker(self, mock_supabase_client):
        """Create CourseBroker instance with mocked client"""
        return CourseBroker(mock_supabase_client)

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
    async def test_select_all_courses_success(
        self, broker, mock_supabase_client, sample_course_dict
    ):
        """Test successful retrieval of all courses"""
        mock_response = MagicMock()
        mock_response.data = [sample_course_dict]
        mock_supabase_client.execute.return_value = mock_response

        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.SelectAllCourses(skip=0, limit=50)

        assert result == [sample_course_dict]
        assert len(result) == 1

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_select_course_by_code_found(
        self, broker, mock_supabase_client, sample_course_dict
    ):
        """Test successful retrieval of course by code"""
        course_code = "CS101"
        mock_response = MagicMock()
        mock_response.data = [sample_course_dict]
        mock_supabase_client.execute.return_value = mock_response

        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.SelectCourseByCode(course_code)

        assert result == sample_course_dict
        mock_supabase_client.eq.assert_called_with("code", course_code)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_select_course_by_code_not_found(self, broker, mock_supabase_client):
        """Test retrieval when course doesn't exist"""
        mock_response = MagicMock()
        mock_response.data = []
        mock_supabase_client.execute.return_value = mock_response

        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.SelectCourseByCode("NOTFOUND")

        assert result is None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_select_courses_by_faculty(
        self, broker, mock_supabase_client, sample_course_dict
    ):
        """Test retrieval of courses by faculty"""
        faculty = "Engineering"
        mock_response = MagicMock()
        mock_response.data = [sample_course_dict]
        mock_supabase_client.execute.return_value = mock_response

        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.SelectCoursesByFaculty(faculty)

        assert result == [sample_course_dict]

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_insert_course_success(
        self, broker, mock_supabase_client, sample_course_dict
    ):
        """Test successful course insertion"""
        course_data = {"code": "CS101", "name": "Intro to CS", "faculty": "Engineering"}
        mock_response = MagicMock()
        mock_response.data = [sample_course_dict]
        mock_supabase_client.execute.return_value = mock_response

        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.InsertCourse(course_data)

        assert result == sample_course_dict
        mock_supabase_client.insert.assert_called_once_with(course_data)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_update_course_success(
        self, broker, mock_supabase_client, sample_course_dict
    ):
        """Test successful course update"""
        course_code = "CS101"
        update_data = {"name": "Updated Course Name"}
        updated_course = {**sample_course_dict, **update_data}
        mock_response = MagicMock()
        mock_response.data = [updated_course]
        mock_supabase_client.execute.return_value = mock_response

        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.UpdateCourse(course_code, update_data)

        assert result == updated_course
        mock_supabase_client.update.assert_called_once_with(update_data)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_delete_course_success(self, broker, mock_supabase_client):
        """Test successful course deletion"""
        course_code = "CS101"
        mock_response = MagicMock()
        mock_response.data = [{"code": course_code}]  # Return deleted row
        mock_supabase_client.execute.return_value = mock_response

        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.DeleteCourse(course_code)

        assert result is True

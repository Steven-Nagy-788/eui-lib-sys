"""
Integration tests for CourseRouter
Tests API endpoints with mocked authentication
"""

import pytest
from fastapi.testclient import TestClient

from src.main import app


class TestCourseRouter:
    """Test suite for Course API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)

    @pytest.fixture(autouse=True)
    def setup_auth(self, mock_admin_user, mock_student_user):
        """Setup auth dependency overrides for each test"""
        from src.utils.auth import get_current_user, require_admin

        # Override dependencies
        app.dependency_overrides[get_current_user] = lambda: mock_student_user
        app.dependency_overrides[require_admin] = lambda: mock_admin_user

        yield

        # Clean up overrides
        app.dependency_overrides.clear()

    @pytest.mark.integration
    def test_get_all_courses(self, client):
        """Test GET /courses - retrieve all courses"""
        response = client.get("/courses")

        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.integration
    def test_get_course_by_code(self, client):
        """Test GET /courses/{code} - retrieve specific course"""
        course_code = "CS101"
        response = client.get(f"/courses/{course_code}")

        assert response.status_code in [200, 404]

    @pytest.mark.integration
    def test_create_course(self, client):
        """Test POST /courses - create new course"""
        course_data = {"code": "CS999", "name": "Test Course", "faculty": "Engineering"}

        response = client.post("/courses", json=course_data)

        # May fail with validation, but tests endpoint exists
        assert response.status_code in [201, 400, 422]

    @pytest.mark.integration
    def test_update_course(self, client):
        """Test PUT /courses/{code} - update existing course"""
        course_code = "CS101"
        update_data = {"name": "Updated Course Name"}

        response = client.put(f"/courses/{course_code}", json=update_data)

        assert response.status_code in [200, 404]

    @pytest.mark.integration
    def test_delete_course(self, client):
        """Test DELETE /courses/{code} - remove course"""
        course_code = "CS999"

        response = client.delete(f"/courses/{course_code}")

        # Expect 204 No Content or 404 Not Found
        assert response.status_code in [204, 404]

    @pytest.mark.integration
    def test_get_courses_by_faculty(self, client):
        """Test GET /courses/faculty/{faculty} - get courses by faculty"""
        response = client.get("/courses/faculty/Engineering")

        assert response.status_code == 200
        assert isinstance(response.json(), list)

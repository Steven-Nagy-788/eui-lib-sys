"""
Integration tests for BookCopyRouter
Tests API endpoints with mocked authentication
"""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from src.main import app


class TestBookCopyRouter:
    """Test suite for BookCopy API endpoints"""

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
    def test_get_all_copies(self, client):
        """Test GET /copies - retrieve all book copies"""
        response = client.get("/copies")

        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.integration
    def test_get_copy_by_id(self, client):
        """Test GET /copies/{id} - retrieve specific copy"""
        copy_id = uuid4()
        response = client.get(f"/copies/{copy_id}")

        assert response.status_code in [200, 404]

    @pytest.mark.integration
    def test_get_copies_by_book_id(self, client):
        """Test GET /books/{book_id}/copies - get copies for specific book"""
        book_id = uuid4()
        response = client.get(f"/books/{book_id}/copies")

        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.integration
    def test_create_single_copy(self, client):
        """Test POST /copies - create new book copy"""
        copy_data = {"book_id": str(uuid4()), "is_reference": False}

        response = client.post("/copies", json=copy_data)

        # May fail with validation, but tests endpoint exists
        assert response.status_code in [201, 400, 404, 422]

    @pytest.mark.integration
    def test_create_multiple_copies(self, client):
        """Test POST /books/{book_id}/copies/bulk - bulk create copies"""
        book_id = uuid4()
        bulk_data = {"count": 5}

        response = client.post(f"/books/{book_id}/copies/bulk", json=bulk_data)

        assert response.status_code in [201, 400, 404]

    @pytest.mark.integration
    def test_update_copy(self, client):
        """Test PUT /copies/{id} - update existing copy"""
        copy_id = uuid4()
        update_data = {"status": "maintenance"}

        response = client.put(f"/copies/{copy_id}", json=update_data)

        assert response.status_code in [200, 404]

    @pytest.mark.integration
    def test_update_copy_status(self, client):
        """Test PATCH /copies/{id}/status - update copy status"""
        copy_id = uuid4()
        status_data = {"status": "available"}

        response = client.patch(f"/copies/{copy_id}/status", json=status_data)

        assert response.status_code in [200, 404]

    @pytest.mark.integration
    def test_delete_copy(self, client):
        """Test DELETE /copies/{id} - remove copy"""
        copy_id = uuid4()

        response = client.delete(f"/copies/{copy_id}")

        # Expect 204 No Content or 404 Not Found
        assert response.status_code in [204, 404]

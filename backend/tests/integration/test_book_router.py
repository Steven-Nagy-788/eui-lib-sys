"""
Integration tests for Book Router
Tests API endpoints with TestClient and mocked dependencies
"""

from unittest.mock import patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.Models.Books import BookResponse
from src.utils.auth import get_current_user, require_admin


class TestBookRouter:
    """Test suite for Book API endpoints"""

    @pytest.fixture
    def client(self):
        """Create TestClient instance"""
        # Clear dependency overrides before each test
        app.dependency_overrides = {}
        return TestClient(app)

    @pytest.fixture
    def mock_admin_token(self, mock_admin_user):
        """Mock JWT token for admin user"""
        return "Bearer mock_admin_token"

    @pytest.fixture
    def mock_student_token(self, mock_student_user):
        """Mock JWT token for student user"""
        return "Bearer mock_student_token"

    @pytest.mark.integration
    def test_get_books_unauthorized(self, client):
        """Test GET /books without authentication"""
        # Act
        response = client.get("/books/")

        # Assert
        assert response.status_code == 401

    @pytest.mark.integration
    def test_get_books_success(
        self, client, mock_student_token, sample_book_dict, mock_student_user
    ):
        """Test GET /books with valid authentication"""
        # Arrange - Override auth dependency
        app.dependency_overrides[get_current_user] = lambda: mock_student_user

        with patch(
            "src.Services.bookService.BookService.RetrieveAllBooks"
        ) as mock_retrieve:
            mock_retrieve.return_value = [BookResponse(**sample_book_dict)]

            # Act
            response = client.get(
                "/books/", headers={"Authorization": mock_student_token}
            )

        # Cleanup
        app.dependency_overrides = {}

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == sample_book_dict["title"]

    @pytest.mark.integration
    def test_get_books_with_pagination(
        self, client, mock_student_token, sample_book_dict, mock_student_user
    ):
        """Test GET /books with pagination parameters"""
        # Arrange
        app.dependency_overrides[get_current_user] = lambda: mock_student_user

        with patch(
            "src.Services.bookService.BookService.RetrieveAllBooks"
        ) as mock_retrieve:
            mock_retrieve.return_value = [BookResponse(**sample_book_dict)]

            # Act
            response = client.get(
                "/books/?skip=0&limit=5", headers={"Authorization": mock_student_token}
            )

        # Cleanup
        app.dependency_overrides = {}

        # Assert
        assert response.status_code == 200
        mock_retrieve.assert_called_once_with(skip=0, limit=5)

    @pytest.mark.integration
    def test_get_book_by_id_found(
        self, client, mock_student_token, sample_book_dict, mock_student_user
    ):
        """Test GET /books/{book_id} when book exists"""
        # Arrange
        book_id = sample_book_dict["id"]
        app.dependency_overrides[get_current_user] = lambda: mock_student_user

        with patch(
            "src.Services.bookService.BookService.RetrieveBookById"
        ) as mock_retrieve:
            mock_retrieve.return_value = BookResponse(**sample_book_dict)

            # Act
            response = client.get(
                f"/books/{book_id}", headers={"Authorization": mock_student_token}
            )

        # Cleanup
        app.dependency_overrides = {}

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == book_id
        assert data["title"] == sample_book_dict["title"]

    @pytest.mark.integration
    def test_get_book_by_id_not_found(
        self, client, mock_student_token, mock_student_user
    ):
        """Test GET /books/{book_id} when book doesn't exist"""
        # Arrange
        book_id = str(uuid4())
        app.dependency_overrides[get_current_user] = lambda: mock_student_user

        with patch(
            "src.Services.bookService.BookService.RetrieveBookById"
        ) as mock_retrieve:
            mock_retrieve.return_value = None

            # Act
            response = client.get(
                f"/books/{book_id}", headers={"Authorization": mock_student_token}
            )

        # Cleanup
        app.dependency_overrides = {}

        # Assert
        assert response.status_code == 404
        assert response.json()["detail"] == "Book not found"

    @pytest.mark.integration
    def test_create_book_success(
        self,
        client,
        mock_admin_token,
        sample_book_create_dict,
        sample_book_dict,
        mock_admin_user,
    ):
        """Test POST /books with admin authentication"""
        # Arrange
        app.dependency_overrides[get_current_user] = lambda: mock_admin_user
        app.dependency_overrides[require_admin] = lambda: mock_admin_user

        with patch("src.Services.bookService.BookService.AddBook") as mock_add:
            mock_add.return_value = BookResponse(**sample_book_dict)

            # Act
            response = client.post(
                "/books/",
                json=sample_book_create_dict,
                headers={"Authorization": mock_admin_token},
            )

        # Cleanup
        app.dependency_overrides = {}

        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == sample_book_dict["title"]

    @pytest.mark.integration
    def test_create_book_duplicate_isbn(
        self, client, mock_admin_token, sample_book_create_dict, mock_admin_user
    ):
        """Test POST /books with duplicate ISBN"""
        # Arrange
        app.dependency_overrides[get_current_user] = lambda: mock_admin_user
        app.dependency_overrides[require_admin] = lambda: mock_admin_user

        with patch("src.Services.bookService.BookService.AddBook") as mock_add:
            mock_add.side_effect = ValueError("ISBN 978-0-123456-78-9 already exists")

            # Act
            response = client.post(
                "/books/",
                json=sample_book_create_dict,
                headers={"Authorization": mock_admin_token},
            )

        # Cleanup
        app.dependency_overrides = {}

        # Assert
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    @pytest.mark.integration
    def test_create_book_unauthorized_student(
        self, client, mock_student_token, sample_book_create_dict, mock_student_user
    ):
        """Test POST /books as student (should fail)"""
        # Arrange
        with patch("src.utils.auth.get_current_user", return_value=mock_student_user):
            with patch("src.utils.auth.require_admin") as mock_admin:
                mock_admin.side_effect = Exception("Admin access required")

                # Act
                response = client.post(
                    "/books/",
                    json=sample_book_create_dict,
                    headers={"Authorization": mock_student_token},
                )

        # Assert - Should be 401 or 403 depending on implementation
        assert response.status_code in [401, 403, 500]

    @pytest.mark.integration
    def test_update_book_success(
        self,
        client,
        mock_admin_token,
        sample_book_create_dict,
        sample_book_dict,
        mock_admin_user,
    ):
        """Test PUT /books/{book_id} with admin authentication"""
        # Arrange
        book_id = sample_book_dict["id"]
        updated_book = {**sample_book_dict, "title": "Updated Title"}

        app.dependency_overrides[get_current_user] = lambda: mock_admin_user
        app.dependency_overrides[require_admin] = lambda: mock_admin_user

        with patch("src.Services.bookService.BookService.ModifyBook") as mock_modify:
            mock_modify.return_value = BookResponse(**updated_book)

            # Act
            response = client.put(
                f"/books/{book_id}",
                json=sample_book_create_dict,
                headers={"Authorization": mock_admin_token},
            )

        # Cleanup
        app.dependency_overrides = {}

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"

    @pytest.mark.integration
    def test_delete_book_success(
        self, client, mock_admin_token, sample_book_dict, mock_admin_user
    ):
        """Test DELETE /books/{book_id} with admin authentication"""
        # Arrange
        book_id = sample_book_dict["id"]

        app.dependency_overrides[get_current_user] = lambda: mock_admin_user
        app.dependency_overrides[require_admin] = lambda: mock_admin_user

        with patch("src.Services.bookService.BookService.RemoveBook") as mock_remove:
            mock_remove.return_value = True

            # Act
            response = client.delete(
                f"/books/{book_id}", headers={"Authorization": mock_admin_token}
            )

        # Cleanup
        app.dependency_overrides = {}

        # Assert
        assert response.status_code == 204  # No Content

    @pytest.mark.integration
    def test_delete_book_not_found(self, client, mock_admin_token, mock_admin_user):
        """Test DELETE /books/{book_id} when book doesn't exist"""
        # Arrange
        book_id = str(uuid4())

        app.dependency_overrides[get_current_user] = lambda: mock_admin_user
        app.dependency_overrides[require_admin] = lambda: mock_admin_user

        with patch("src.Services.bookService.BookService.RemoveBook") as mock_remove:
            mock_remove.return_value = False

            # Act
            response = client.delete(
                f"/books/{book_id}", headers={"Authorization": mock_admin_token}
            )

        # Cleanup
        app.dependency_overrides = {}

        # Assert
        assert response.status_code == 404

    @pytest.mark.integration
    def test_get_books_with_stats(
        self, client, mock_student_token, sample_book_dict, mock_student_user
    ):
        """Test GET /books/with-stats endpoint"""
        # Arrange
        book_with_stats = {
            **sample_book_dict,
            "copy_stats": {
                "total": 10,
                "available": 7,
                "reference": 3,
                "circulating": 7,
            },
        }

        app.dependency_overrides[get_current_user] = lambda: mock_student_user

        with patch(
            "src.Services.bookService.BookService.RetrieveBooksWithStats"
        ) as mock_retrieve:
            from src.Models.Books import BookCopyStats, BookWithStatsResponse

            mock_retrieve.return_value = [
                BookWithStatsResponse(
                    **sample_book_dict,
                    copy_stats=BookCopyStats(**book_with_stats["copy_stats"]),
                )
            ]

            # Act
            response = client.get(
                "/books/with-stats", headers={"Authorization": mock_student_token}
            )

        # Cleanup
        app.dependency_overrides = {}

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert "copy_stats" in data[0]
        assert data[0]["copy_stats"]["total"] == 10

"""
Unit tests for BookBroker
Tests database operations with mocked Supabase client
"""

import pytest
from unittest.mock import MagicMock, patch
from uuid import UUID, uuid4
from src.Brokers.bookBroker import BookBroker


class TestBookBroker:
    """Test suite for BookBroker database operations"""

    @pytest.fixture
    def broker(self, mock_supabase_client):
        """Create BookBroker instance with mocked client"""
        return BookBroker(mock_supabase_client)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_select_all_books_success(
        self, broker, mock_supabase_client, sample_book_dict
    ):
        """Test successful retrieval of all books"""
        # Arrange
        mock_response = MagicMock()
        mock_response.data = [sample_book_dict]
        mock_supabase_client.execute.return_value = mock_response

        # Act - asyncio.to_thread executes the function synchronously in tests
        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.SelectAllBooks(skip=0, limit=10)

        # Assert
        assert result == [sample_book_dict]
        assert len(result) == 1
        mock_supabase_client.table.assert_called_once_with("books")

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_select_all_books_empty(self, broker, mock_supabase_client):
        """Test retrieval when no books exist"""
        # Arrange
        mock_response = MagicMock()
        mock_response.data = []
        mock_supabase_client.execute.return_value = mock_response

        # Act
        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.SelectAllBooks(skip=0, limit=10)

        # Assert
        assert result == []
        assert len(result) == 0

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_select_book_by_id_found(
        self, broker, mock_supabase_client, sample_book_dict
    ):
        """Test successful retrieval of book by ID"""
        # Arrange
        book_id = UUID(sample_book_dict["id"])
        mock_response = MagicMock()
        mock_response.data = [sample_book_dict]
        mock_supabase_client.execute.return_value = mock_response

        # Act
        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.SelectBookById(book_id)

        # Assert
        assert result == sample_book_dict
        assert result["id"] == sample_book_dict["id"]
        mock_supabase_client.eq.assert_called_once_with("id", str(book_id))

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_select_book_by_id_not_found(self, broker, mock_supabase_client):
        """Test retrieval when book ID doesn't exist"""
        # Arrange
        book_id = uuid4()
        mock_response = MagicMock()
        mock_response.data = []
        mock_supabase_client.execute.return_value = mock_response

        # Act
        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.SelectBookById(book_id)

        # Assert
        assert result is None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_select_book_by_isbn_found(
        self, broker, mock_supabase_client, sample_book_dict
    ):
        """Test successful retrieval of book by ISBN"""
        # Arrange
        isbn = sample_book_dict["isbn"]
        mock_response = MagicMock()
        mock_response.data = [sample_book_dict]
        mock_supabase_client.execute.return_value = mock_response

        # Act
        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.SelectBookByIsbn(isbn)

        # Assert
        assert result == sample_book_dict
        assert result["isbn"] == isbn
        mock_supabase_client.eq.assert_called_once_with("isbn", isbn)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_insert_book_success(
        self, broker, mock_supabase_client, sample_book_create_dict, sample_book_dict
    ):
        """Test successful book insertion"""
        # Arrange
        mock_response = MagicMock()
        mock_response.data = [sample_book_dict]
        mock_supabase_client.execute.return_value = mock_response

        # Act
        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.InsertBook(sample_book_create_dict)

        # Assert
        assert result == sample_book_dict
        assert result["title"] == sample_book_dict["title"]
        mock_supabase_client.insert.assert_called_once_with(sample_book_create_dict)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_update_book_success(
        self, broker, mock_supabase_client, sample_book_dict
    ):
        """Test successful book update"""
        # Arrange
        book_id = UUID(sample_book_dict["id"])
        update_data = {"title": "Updated Title"}
        updated_book = {**sample_book_dict, **update_data}
        mock_response = MagicMock()
        mock_response.data = [updated_book]
        mock_supabase_client.execute.return_value = mock_response

        # Act
        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.UpdateBook(book_id, update_data)

        # Assert
        assert result == updated_book
        assert result["title"] == "Updated Title"
        mock_supabase_client.update.assert_called_once_with(update_data)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_update_book_not_found(self, broker, mock_supabase_client):
        """Test update when book doesn't exist"""
        # Arrange
        book_id = uuid4()
        update_data = {"title": "Updated Title"}
        mock_response = MagicMock()
        mock_response.data = []
        mock_supabase_client.execute.return_value = mock_response

        # Act
        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.UpdateBook(book_id, update_data)

        # Assert
        assert result is None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_delete_book_success(
        self, broker, mock_supabase_client, sample_book_dict
    ):
        """Test successful book deletion"""
        # Arrange
        book_id = UUID(sample_book_dict["id"])
        mock_response = MagicMock()
        mock_response.data = [sample_book_dict]
        mock_supabase_client.execute.return_value = mock_response

        # Act
        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.DeleteBook(book_id)

        # Assert
        assert result is True
        mock_supabase_client.delete.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_delete_book_not_found(self, broker, mock_supabase_client):
        """Test deletion when book doesn't exist"""
        # Arrange
        book_id = uuid4()
        mock_response = MagicMock()
        mock_response.data = []
        mock_supabase_client.execute.return_value = mock_response

        # Act
        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.DeleteBook(book_id)

        # Assert
        assert result is False

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_search_books_found(
        self, broker, mock_supabase_client, sample_book_dict
    ):
        """Test successful book search"""
        # Arrange
        query = "Test"
        mock_response = MagicMock()
        mock_response.data = [sample_book_dict]
        mock_supabase_client.or_.return_value = mock_supabase_client
        mock_supabase_client.execute.return_value = mock_response

        # Act
        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.SearchBooks(query)

        # Assert
        assert result == [sample_book_dict]
        assert len(result) == 1

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_search_books_not_found(self, broker, mock_supabase_client):
        """Test search with no results"""
        # Arrange
        query = "NonExistent"
        mock_response = MagicMock()
        mock_response.data = []
        mock_supabase_client.or_.return_value = mock_supabase_client
        mock_supabase_client.execute.return_value = mock_response

        # Act
        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.SearchBooks(query)

        # Assert
        assert result == []

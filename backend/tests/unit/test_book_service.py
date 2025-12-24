"""
Unit tests for BookService
Tests business logic with mocked BookBroker
"""

import pytest
from unittest.mock import AsyncMock
from uuid import UUID, uuid4
from src.Services.bookService import BookService
from src.Models.Books import BookCreate, BookResponse


class TestBookService:
    """Test suite for BookService business logic"""

    @pytest.fixture
    def mock_broker(self):
        """Create mocked BookBroker"""
        broker = AsyncMock()
        return broker

    @pytest.fixture
    def service(self, mock_broker):
        """Create BookService instance with mocked broker"""
        return BookService(mock_broker)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_retrieve_all_books_success(
        self, service, mock_broker, sample_book_dict
    ):
        """Test successful retrieval of all books"""
        # Arrange
        mock_broker.SelectAllBooks.return_value = [sample_book_dict]

        # Act
        result = await service.RetrieveAllBooks(skip=0, limit=10)

        # Assert
        assert len(result) == 1
        assert isinstance(result[0], BookResponse)
        assert result[0].title == sample_book_dict["title"]
        mock_broker.SelectAllBooks.assert_called_once_with(skip=0, limit=10)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_retrieve_all_books_empty(self, service, mock_broker):
        """Test retrieval when no books exist"""
        # Arrange
        mock_broker.SelectAllBooks.return_value = []

        # Act
        result = await service.RetrieveAllBooks(skip=0, limit=10)

        # Assert
        assert result == []
        mock_broker.SelectAllBooks.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_retrieve_book_by_id_found(
        self, service, mock_broker, sample_book_dict
    ):
        """Test successful retrieval of book by ID"""
        # Arrange
        book_id = UUID(sample_book_dict["id"])
        mock_broker.SelectBookById.return_value = sample_book_dict

        # Act
        result = await service.RetrieveBookById(book_id)

        # Assert
        assert result is not None
        assert isinstance(result, BookResponse)
        assert result.id == UUID(sample_book_dict["id"])
        mock_broker.SelectBookById.assert_called_once_with(book_id)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_retrieve_book_by_id_not_found(self, service, mock_broker):
        """Test retrieval when book doesn't exist"""
        # Arrange
        book_id = uuid4()
        mock_broker.SelectBookById.return_value = None

        # Act
        result = await service.RetrieveBookById(book_id)

        # Assert
        assert result is None
        mock_broker.SelectBookById.assert_called_once_with(book_id)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_add_book_success(
        self, service, mock_broker, sample_book_create_dict, sample_book_dict
    ):
        """Test successful book creation"""
        # Arrange
        book_create = BookCreate(**sample_book_create_dict)
        mock_broker.SelectBookByIsbn.return_value = None  # ISBN doesn't exist
        mock_broker.InsertBook.return_value = sample_book_dict

        # Act
        result = await service.AddBook(book_create)

        # Assert
        assert isinstance(result, BookResponse)
        assert result.title == sample_book_dict["title"]
        mock_broker.SelectBookByIsbn.assert_called_once_with(book_create.isbn)
        mock_broker.InsertBook.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_add_book_duplicate_isbn(
        self, service, mock_broker, sample_book_create_dict, sample_book_dict
    ):
        """Test book creation with duplicate ISBN"""
        # Arrange
        book_create = BookCreate(**sample_book_create_dict)
        mock_broker.SelectBookByIsbn.return_value = sample_book_dict  # ISBN exists

        # Act & Assert
        with pytest.raises(ValueError, match="ISBN .* already exists"):
            await service.AddBook(book_create)

        mock_broker.SelectBookByIsbn.assert_called_once_with(book_create.isbn)
        mock_broker.InsertBook.assert_not_called()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_modify_book_success(
        self, service, mock_broker, sample_book_create_dict, sample_book_dict
    ):
        """Test successful book update"""
        # Arrange
        book_id = UUID(sample_book_dict["id"])
        book_update = BookCreate(**sample_book_create_dict)
        updated_book = {**sample_book_dict, "title": "Updated Title"}

        mock_broker.SelectBookById.return_value = sample_book_dict  # Book exists
        mock_broker.UpdateBook.return_value = updated_book

        # Act
        result = await service.ModifyBook(book_id, book_update)

        # Assert
        assert result is not None
        assert isinstance(result, BookResponse)
        assert result.title == "Updated Title"
        mock_broker.SelectBookById.assert_called_once_with(book_id)
        mock_broker.UpdateBook.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_modify_book_not_found(
        self, service, mock_broker, sample_book_create_dict
    ):
        """Test update when book doesn't exist"""
        # Arrange
        book_id = uuid4()
        book_update = BookCreate(**sample_book_create_dict)
        mock_broker.SelectBookById.return_value = None  # Book doesn't exist

        # Act
        result = await service.ModifyBook(book_id, book_update)

        # Assert
        assert result is None
        mock_broker.SelectBookById.assert_called_once_with(book_id)
        mock_broker.UpdateBook.assert_not_called()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_remove_book_success(self, service, mock_broker):
        """Test successful book deletion"""
        # Arrange
        book_id = uuid4()
        mock_broker.DeleteBook.return_value = True

        # Act
        result = await service.RemoveBook(book_id)

        # Assert
        assert result is True
        mock_broker.DeleteBook.assert_called_once_with(book_id)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_remove_book_not_found(self, service, mock_broker):
        """Test deletion when book doesn't exist"""
        # Arrange
        book_id = uuid4()
        mock_broker.DeleteBook.return_value = False

        # Act
        result = await service.RemoveBook(book_id)

        # Assert
        assert result is False
        mock_broker.DeleteBook.assert_called_once_with(book_id)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_search_books_found(self, service, mock_broker, sample_book_dict):
        """Test successful book search"""
        # Arrange
        query = "Test Book"
        mock_broker.SearchBooks.return_value = [sample_book_dict]

        # Act
        result = await service.SearchBooks(query)

        # Assert
        assert len(result) == 1
        assert isinstance(result[0], BookResponse)
        assert result[0].title == sample_book_dict["title"]
        mock_broker.SearchBooks.assert_called_once_with(query)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_search_books_not_found(self, service, mock_broker):
        """Test search with no results"""
        # Arrange
        query = "NonExistent"
        mock_broker.SearchBooks.return_value = []

        # Act
        result = await service.SearchBooks(query)

        # Assert
        assert result == []
        mock_broker.SearchBooks.assert_called_once_with(query)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_retrieve_books_with_stats_success(
        self, service, mock_broker, sample_book_dict
    ):
        """Test retrieval of books with copy statistics"""
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
        mock_broker.SelectAllBooksWithStats.return_value = [book_with_stats]

        # Act
        result = await service.RetrieveBooksWithStats(skip=0, limit=50)

        # Assert
        assert len(result) == 1
        assert result[0].copy_stats.total == 10
        assert result[0].copy_stats.available == 7
        mock_broker.SelectAllBooksWithStats.assert_called_once_with(skip=0, limit=50)

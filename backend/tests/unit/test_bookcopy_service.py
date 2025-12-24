"""
Unit tests for BookCopyService
Tests business logic with mocked BookCopyBroker
"""

import pytest
from unittest.mock import AsyncMock
from uuid import UUID, uuid4
from src.Services.bookCopyService import BookCopyService
from src.Models.Books import BookCopyCreate, BookCopyResponse, BookCopyUpdate


class TestBookCopyService:
    """Test suite for BookCopyService business logic"""

    @pytest.fixture
    def mock_broker(self):
        """Create mocked BookCopyBroker"""
        return AsyncMock()

    @pytest.fixture
    def service(self, mock_broker):
        """Create BookCopyService instance with mocked broker"""
        return BookCopyService(mock_broker)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_retrieve_all_copies_success(
        self, service, mock_broker, sample_copy_dict
    ):
        """Test successful retrieval of all copies"""
        mock_broker.SelectAllCopies.return_value = [sample_copy_dict]

        result = await service.RetrieveAllCopies(skip=0, limit=50)

        assert len(result) == 1
        assert isinstance(result[0], BookCopyResponse)
        mock_broker.SelectAllCopies.assert_called_once_with(skip=0, limit=50)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_retrieve_copies_by_book_id(
        self, service, mock_broker, sample_copy_dict
    ):
        """Test retrieval of copies by book ID"""
        book_id = uuid4()
        mock_broker.SelectCopiesByBookId.return_value = [sample_copy_dict]

        result = await service.RetrieveCopiesByBookId(book_id)

        assert len(result) == 1
        assert isinstance(result[0], BookCopyResponse)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_retrieve_copy_by_id_found(
        self, service, mock_broker, sample_copy_dict
    ):
        """Test successful retrieval of copy by ID"""
        copy_id = UUID(sample_copy_dict["id"])
        mock_broker.SelectCopyById.return_value = sample_copy_dict

        result = await service.RetrieveCopyById(copy_id)

        assert result is not None
        assert isinstance(result, BookCopyResponse)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_add_copy_success(self, service, mock_broker, sample_copy_dict):
        """Test successful copy creation"""
        copy_create = BookCopyCreate(book_id=uuid4(), is_reference=False)
        mock_broker.InsertCopy.return_value = sample_copy_dict

        result = await service.AddSingleCopy(copy_create)

        assert isinstance(result, BookCopyResponse)
        mock_broker.InsertCopy.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_bulk_add_copies_success(
        self, service, mock_broker, sample_copy_dict
    ):
        """Test bulk creation of copies"""
        book_id = uuid4()
        quantity = 5
        mock_broker.InsertCopiesBulk.return_value = [sample_copy_dict] * quantity

        result = await service.AddBulkCopies(book_id, quantity)

        assert len(result) == quantity
        mock_broker.InsertCopiesBulk.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_modify_copy_success(self, service, mock_broker, sample_copy_dict):
        """Test successful copy update"""
        copy_id = UUID(sample_copy_dict["id"])
        copy_update = BookCopyUpdate(status="maintenance")
        updated_copy = {**sample_copy_dict, "status": "maintenance"}

        mock_broker.SelectCopyById.return_value = sample_copy_dict
        mock_broker.UpdateCopy.return_value = updated_copy

        result = await service.ModifyCopy(copy_id, copy_update)

        assert result is not None
        assert isinstance(result, BookCopyResponse)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_remove_copy_success(self, service, mock_broker):
        """Test successful copy deletion"""
        copy_id = uuid4()
        mock_broker.DeleteCopy.return_value = True

        result = await service.RemoveCopy(copy_id)

        assert result is True
        mock_broker.DeleteCopy.assert_called_once_with(copy_id)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_retrieve_copy_stats(self, service, mock_broker):
        """Test retrieving copy statistics"""
        book_id = uuid4()
        stats = {"total": 10, "available": 5, "reference": 3}
        mock_broker.CountCopiesByBookId.return_value = stats

        result = await service.RetrieveCopyStats(book_id)

        assert result == stats

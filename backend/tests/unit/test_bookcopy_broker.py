"""
Unit tests for BookCopyBroker
Tests database operations with mocked Supabase client
"""
import pytest
from unittest.mock import MagicMock, patch
from uuid import uuid4
from src.Brokers.bookCopyBroker import BookCopyBroker


class TestBookCopyBroker:
    """Test suite for BookCopyBroker database operations"""
    
    @pytest.fixture
    def broker(self, mock_supabase_client):
        """Create BookCopyBroker instance with mocked client"""
        return BookCopyBroker(mock_supabase_client)
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_select_all_copies_success(self, broker, mock_supabase_client, sample_copy_dict):
        """Test successful retrieval of all book copies"""
        mock_response = MagicMock()
        mock_response.data = [sample_copy_dict]
        mock_supabase_client.execute.return_value = mock_response
        
        with patch('asyncio.to_thread', side_effect=lambda f: f()):
            result = await broker.SelectAllCopies(skip=0, limit=50)
        
        assert result == [sample_copy_dict]
        assert len(result) == 1
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_select_copies_by_book_id(self, broker, mock_supabase_client, sample_copy_dict):
        """Test retrieval of copies by book ID"""
        book_id = uuid4()
        mock_response = MagicMock()
        mock_response.data = [sample_copy_dict]
        mock_supabase_client.execute.return_value = mock_response
        
        with patch('asyncio.to_thread', side_effect=lambda f: f()):
            result = await broker.SelectCopiesByBookId(book_id)
        
        assert result == [sample_copy_dict]
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_select_copy_by_id_found(self, broker, mock_supabase_client, sample_copy_dict):
        """Test successful retrieval of copy by ID"""
        copy_id = uuid4()
        mock_response = MagicMock()
        mock_response.data = [sample_copy_dict]
        mock_supabase_client.execute.return_value = mock_response
        
        with patch('asyncio.to_thread', side_effect=lambda f: f()):
            result = await broker.SelectCopyById(copy_id)
        
        assert result == sample_copy_dict
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_insert_copy_success(self, broker, mock_supabase_client, sample_copy_dict):
        """Test successful copy insertion"""
        copy_data = {"book_id": str(uuid4()), "status": "available"}
        mock_response = MagicMock()
        mock_response.data = [sample_copy_dict]
        mock_supabase_client.execute.return_value = mock_response
        
        with patch('asyncio.to_thread', side_effect=lambda f: f()):
            result = await broker.InsertCopy(copy_data)
        
        assert result == sample_copy_dict
        mock_supabase_client.insert.assert_called_once_with(copy_data)
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_bulk_insert_copies(self, broker, mock_supabase_client, sample_copy_dict):
        """Test bulk insertion of multiple copies"""
        copies_data = [sample_copy_dict, sample_copy_dict]
        mock_response = MagicMock()
        mock_response.data = copies_data
        mock_supabase_client.execute.return_value = mock_response
        
        with patch('asyncio.to_thread', side_effect=lambda f: f()):
            result = await broker.InsertCopiesBulk(copies_data)
        
        assert len(result) == 2
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_update_copy_status(self, broker, mock_supabase_client, sample_copy_dict):
        """Test successful copy status update"""
        copy_id = uuid4()
        new_status = "checked_out"
        updated_copy = {**sample_copy_dict, "status": new_status}
        mock_response = MagicMock()
        mock_response.data = [updated_copy]
        mock_supabase_client.execute.return_value = mock_response
        
        with patch('asyncio.to_thread', side_effect=lambda f: f()):
            result = await broker.UpdateCopyStatus(copy_id, new_status)
        
        assert result == updated_copy
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_delete_copy_success(self, broker, mock_supabase_client):
        """Test successful copy deletion"""
        copy_id = uuid4()
        mock_response = MagicMock()
        mock_response.data = [{"id": str(copy_id)}]  # Return deleted row
        mock_supabase_client.execute.return_value = mock_response
        
        with patch('asyncio.to_thread', side_effect=lambda f: f()):
            result = await broker.DeleteCopy(copy_id)
        
        assert result is True
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_count_copies_by_book_id(self, broker, mock_supabase_client):
        """Test counting copies for a book"""
        book_id = uuid4()
        mock_response = MagicMock()
        mock_response.data = [{"id": "1"}, {"id": "2"}, {"id": "3"}]
        mock_supabase_client.execute.return_value = mock_response
        
        with patch('asyncio.to_thread', side_effect=lambda f: f()):
            result = await broker.CountCopiesByBookId(book_id)
        
        # Method returns dict, not int
        assert isinstance(result, dict)

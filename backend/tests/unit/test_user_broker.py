"""
Unit tests for UserBroker
Tests database operations with mocked Supabase client
"""
import pytest
from unittest.mock import MagicMock, patch
from uuid import UUID
from src.Brokers.userBroker import UserBroker


class TestUserBroker:
    """Test suite for UserBroker database operations"""
    
    @pytest.fixture
    def broker(self, mock_supabase_client):
        """Create UserBroker instance with mocked client"""
        return UserBroker(mock_supabase_client)
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_select_all_users_success(self, broker, mock_supabase_client, sample_user_dict):
        """Test successful retrieval of all users"""
        # Add loan count fields that SelectAllUsers adds
        user_with_loans = {**sample_user_dict, "active_loans_count": 0, "total_loans_count": 0}
        mock_response = MagicMock()
        mock_response.data = [user_with_loans]
        mock_supabase_client.execute.return_value = mock_response
        
        with patch('asyncio.to_thread', side_effect=lambda f: f()):
            result = await broker.SelectAllUsers(skip=0, limit=50)
        
        assert len(result) == 1
        assert "active_loans_count" in result[0]
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_select_user_by_id_found(self, broker, mock_supabase_client, sample_user_dict):
        """Test successful retrieval of user by ID"""
        user_id = UUID(sample_user_dict["id"])
        mock_response = MagicMock()
        mock_response.data = [sample_user_dict]
        mock_supabase_client.execute.return_value = mock_response
        
        with patch('asyncio.to_thread', side_effect=lambda f: f()):
            result = await broker.SelectUserById(user_id)
        
        assert result == sample_user_dict
        mock_supabase_client.eq.assert_called_with("id", str(user_id))
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_select_user_by_email_found(self, broker, mock_supabase_client, sample_user_dict):
        """Test successful retrieval of user by email"""
        email = sample_user_dict["email"]
        mock_response = MagicMock()
        mock_response.data = [sample_user_dict]
        mock_supabase_client.execute.return_value = mock_response
        
        with patch('asyncio.to_thread', side_effect=lambda f: f()):
            result = await broker.SelectUserByEmail(email)
        
        assert result == sample_user_dict
        assert result["email"] == email
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_select_user_by_university_id(self, broker, mock_supabase_client, sample_user_dict):
        """Test successful retrieval of user by university ID"""
        university_id = sample_user_dict["university_id"]
        mock_response = MagicMock()
        mock_response.data = [sample_user_dict]
        mock_supabase_client.execute.return_value = mock_response
        
        with patch('asyncio.to_thread', side_effect=lambda f: f()):
            result = await broker.SelectUserByUniversityId(university_id)
        
        assert result == sample_user_dict
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_insert_user_success(self, broker, mock_supabase_client, sample_user_dict):
        """Test successful user insertion"""
        user_data = {"email": "new@eui.edu", "full_name": "New User"}
        mock_response = MagicMock()
        mock_response.data = [sample_user_dict]
        mock_supabase_client.execute.return_value = mock_response
        
        with patch('asyncio.to_thread', side_effect=lambda f: f()):
            result = await broker.InsertUser(user_data)
        
        assert result == sample_user_dict
        mock_supabase_client.insert.assert_called_once_with(user_data)
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_update_user_success(self, broker, mock_supabase_client, sample_user_dict):
        """Test successful user update"""
        user_id = UUID(sample_user_dict["id"])
        update_data = {"full_name": "Updated Name"}
        updated_user = {**sample_user_dict, **update_data}
        mock_response = MagicMock()
        mock_response.data = [updated_user]
        mock_supabase_client.execute.return_value = mock_response
        
        with patch('asyncio.to_thread', side_effect=lambda f: f()):
            result = await broker.UpdateUser(user_id, update_data)
        
        assert result == updated_user
        mock_supabase_client.update.assert_called_once_with(update_data)
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_delete_user_success(self, broker, mock_supabase_client, sample_user_dict):
        """Test successful user deletion"""
        user_id = UUID(sample_user_dict["id"])
        mock_response = MagicMock()
        mock_response.data = [sample_user_dict]
        mock_supabase_client.execute.return_value = mock_response
        
        with patch('asyncio.to_thread', side_effect=lambda f: f()):
            result = await broker.DeleteUser(user_id)
        
        assert result is True
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_search_users_found(self, broker, mock_supabase_client, sample_user_dict):
        """Test successful user search"""
        query = "Test"
        mock_response = MagicMock()
        mock_response.data = [sample_user_dict]
        mock_supabase_client.or_.return_value = mock_supabase_client
        mock_supabase_client.execute.return_value = mock_response
        
        with patch('asyncio.to_thread', side_effect=lambda f: f()):
            result = await broker.SearchUsers(query)
        
        assert result == [sample_user_dict]

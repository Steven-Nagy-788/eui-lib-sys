"""
Unit tests for UserService
Tests business logic with mocked UserBroker
"""
import pytest
from unittest.mock import AsyncMock
from uuid import UUID, uuid4
from src.Services.userService import UserService
from src.Models.Users import UserCreate, UserResponse, UserUpdate


class TestUserService:
    """Test suite for UserService business logic"""
    
    @pytest.fixture
    def mock_broker(self):
        """Create mocked UserBroker"""
        return AsyncMock()
    
    @pytest.fixture
    def service(self, mock_broker):
        """Create UserService instance with mocked broker"""
        return UserService(mock_broker)
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_retrieve_all_users_success(self, service, mock_broker, sample_user_dict):
        """Test successful retrieval of all users"""
        mock_broker.SelectAllUsers.return_value = [sample_user_dict]
        
        result = await service.RetrieveAllUsers(skip=0, limit=50)
        
        assert len(result) == 1
        assert isinstance(result[0], UserResponse)
        mock_broker.SelectAllUsers.assert_called_once_with(skip=0, limit=50)
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_retrieve_user_by_id_found(self, service, mock_broker, sample_user_dict):
        """Test successful retrieval of user by ID"""
        user_id = UUID(sample_user_dict["id"])
        mock_broker.SelectUserById.return_value = sample_user_dict
        
        result = await service.RetrieveUserById(user_id)
        
        assert result is not None
        assert isinstance(result, UserResponse)
        assert result.id == user_id
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_retrieve_user_by_id_not_found(self, service, mock_broker):
        """Test retrieval when user doesn't exist"""
        user_id = uuid4()
        mock_broker.SelectUserById.return_value = None
        
        result = await service.RetrieveUserById(user_id)
        
        assert result is None
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_add_user_success(self, service, mock_broker, sample_user_dict):
        """Test successful user creation"""
        user_create = UserCreate(
            university_id="20210001",
            full_name="Test User",
            email="test@eui.edu",
            password="password123",
            role="student"
        )
        mock_broker.SelectUserByUniversityId.return_value = None
        mock_broker.InsertUser.return_value = sample_user_dict
        
        result = await service.AddUser(user_create)
        
        assert isinstance(result, UserResponse)
        mock_broker.SelectUserByUniversityId.assert_called_once()
        mock_broker.InsertUser.assert_called_once()
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_add_user_duplicate_university_id(self, service, mock_broker, sample_user_dict):
        """Test user creation with duplicate university ID"""
        user_create = UserCreate(
            university_id="20210001",
            full_name="Test User",
            email="test@eui.edu",
            password="password123",
            role="student"
        )
        mock_broker.SelectUserByUniversityId.return_value = sample_user_dict
        
        with pytest.raises(ValueError, match="University ID .* already exists"):
            await service.AddUser(user_create)
        
        mock_broker.InsertUser.assert_not_called()
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_modify_user_success(self, service, mock_broker, sample_user_dict):
        """Test successful user update"""
        user_id = UUID(sample_user_dict["id"])
        user_update = UserUpdate(full_name="Updated Name")
        updated_user = {**sample_user_dict, "full_name": "Updated Name"}
        
        mock_broker.SelectUserById.return_value = sample_user_dict
        mock_broker.UpdateUser.return_value = updated_user
        
        result = await service.ModifyUser(user_id, user_update)
        
        assert result is not None
        assert isinstance(result, UserResponse)
        assert result.full_name == "Updated Name"
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_remove_user_success(self, service, mock_broker):
        """Test successful user deletion"""
        user_id = uuid4()
        mock_broker.DeleteUser.return_value = True
        
        result = await service.RemoveUser(user_id)
        
        assert result is True
        mock_broker.DeleteUser.assert_called_once_with(user_id)
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_search_users_found(self, service, mock_broker, sample_user_dict):
        """Test successful user search"""
        query = "Test User"
        mock_broker.SearchUsers.return_value = [sample_user_dict]
        
        result = await service.SearchUsers(query)
        
        assert len(result) == 1
        assert isinstance(result[0], UserResponse)
        mock_broker.SearchUsers.assert_called_once_with(query)

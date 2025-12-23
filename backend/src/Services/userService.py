from typing import List, Optional
from uuid import UUID
from werkzeug.security import generate_password_hash, check_password_hash
from ..Models.Users import UserCreate, UserResponse, UserRole, UserUpdate, UserDashboardResponse, UserStats
from ..Brokers.userBroker import UserBroker


class UserService:
    def __init__(self, broker: UserBroker):
        self.broker = broker

    async def RetrieveAllUsers(self, skip: int = 0, limit: int = 10) -> List[UserResponse]:
        return [UserResponse(**user) for user in await self.broker.SelectAllUsers(skip=skip, limit=limit)]
    
    async def RetrieveUserById(self, user_id: UUID) -> Optional[UserResponse]:
        user_data = await self.broker.SelectUserById(user_id)
        return UserResponse(**user_data) if user_data is not None else None
    
    async def AddUser(self, user: UserCreate) -> UserResponse:
        existing_user = await self.broker.SelectUserByUniversityId(user.university_id)
        if existing_user:
            raise ValueError(f"University ID {user.university_id} already exists")
        hashed_password = generate_password_hash(user.password)
        user_data = {
            'university_id': user.university_id,
            'role': user.role.value,
            'full_name': user.full_name,
            'email': user.email,
            'hashed_password': hashed_password,
            'faculty': user.faculty,
            'academic_year': user.academic_year
        }
        return UserResponse(**await self.broker.InsertUser(user_data))
    
    async def ModifyUser(self, user_id: UUID, user: UserUpdate) -> Optional[UserResponse]: 
        if not await self.broker.SelectUserById(user_id):
            return None
        update_data = user.model_dump(exclude_unset=True)
        if 'password' in update_data:
            update_data['hashed_password'] = generate_password_hash(update_data.pop('password'))
        updated_user = await self.broker.UpdateUser(user_id, update_data)
        return UserResponse(**updated_user) if updated_user is not None else None
        
    async def RemoveUser(self, user_id: UUID) -> bool:
        return await self.broker.DeleteUser(user_id)
    
    async def AuthenticateUser(self, email: str, password: str) -> Optional[UserResponse]:
        user_data = await self.broker.SelectUserByEmail(email)
        
        if not user_data or 'hashed_password' not in user_data:
            return None
        
        if not check_password_hash(user_data['hashed_password'], password):
            return None
        
        return UserResponse(**user_data)
    
    async def SearchUsers(self, query: str) -> List[UserResponse]:
        """Search users by name, email, or university ID"""
        users = await self.broker.SearchUsers(query)
        return [UserResponse(**user) for user in users]
    
    async def RetrieveUserDashboard(self, user_id: UUID) -> Optional[UserDashboardResponse]:
        """Get user profile with loan statistics"""
        user_data = await self.broker.SelectUserById(user_id)
        if not user_data:
            return None
        
        stats_data = await self.broker.SelectUserDashboardStats(user_id)
        
        return UserDashboardResponse(
            user=UserResponse(**user_data),
            stats=UserStats(**stats_data)
        )

from typing import List, Optional
from uuid import UUID
from werkzeug.security import generate_password_hash, check_password_hash
from ..Models.Users import UserCreate, UserResponse, UserRole, UserUpdate
from ..Brokers.userBroker import UserBroker


class UserService:
    def __init__(self, broker: UserBroker):
        self.broker = broker

    async def get_all_users(self, skip: int = 0, limit: int = 10) -> List[UserResponse]:
        return [UserResponse(**user) for user in await self.broker.select_all_users(skip=skip, limit=limit)]
    
    async def get_user_by_id(self, user_id: UUID) -> Optional[UserResponse]:
        user_data = await self.broker.select_user_by_id(user_id)
        return UserResponse(**user_data) if user_data is not None else None
    
    async def create_user(self, user: UserCreate) -> UserResponse:
        existing_user = await self.broker.select_user_by_university_id(user.university_id)
        if existing_user:
            raise ValueError(f"University ID {user.university_id} already exists")
        hashed_password = generate_password_hash(user.password)
        user_data = {
            'university_id': user.university_id,
            'role': user.role.value,
            'full_name': user.full_name,
            'email': user.email,
            'hashed_password': hashed_password
        }
        return UserResponse(**await self.broker.insert_user(user_data))
    
    async def update_user(self, user_id: UUID, user: UserUpdate) -> Optional[UserResponse]: 
        if not await self.broker.select_user_by_id(user_id):
            return None
        update_data = user.model_dump(exclude_unset=True)
        if 'password' in update_data:
            update_data['hashed_password'] = generate_password_hash(update_data.pop('password'))
        updated_user = await self.broker.update_user(user_id, update_data)
        return UserResponse(**updated_user) if updated_user is not None else None
        
    async def delete_user(self, user_id: UUID) -> bool:
        return await self.broker.delete_user(user_id)
    
    async def authenticate_user(self, email: str, password: str) -> Optional[UserResponse]:
        user_data = await self.broker.get_user_by_email(email)
        
        if not user_data or 'hashed_password' not in user_data:
            return None
        
        if not check_password_hash(user_data['hashed_password'], password):
            return None
        
        return UserResponse(**user_data)

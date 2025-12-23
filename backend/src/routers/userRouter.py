from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from uuid import UUID
from datetime import datetime, timedelta
from jose import jwt

from ..utils.dependencies import get_user_service
from ..utils.auth import require_admin, get_current_user
from ..Services.userService import UserService
from ..Models.Users import UserCreate, UserResponse, UserLogin, Token, UserUpdate, UserDashboardResponse
from ..utils.config import get_settings

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 10,
    service: UserService = Depends(get_user_service),
    current_user: dict = Depends(require_admin)
):
    return await service.RetrieveAllUsers(skip=skip, limit=limit)

@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    service: UserService = Depends(get_user_service)
):
    user = await service.AuthenticateUser(credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    settings = get_settings()
    expires = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRATION_MINUTES)
    token_data = {
        "id": str(user.id),
        "role": user.role,
        "exp": expires
    }
    access_token = jwt.encode(token_data, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return Token(access_token=access_token, token_type="bearer")

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user)
):
    user_id = UUID(current_user["id"])
    user = await service.RetrieveUserById(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/me/dashboard", response_model=UserDashboardResponse)
async def get_user_dashboard(
    service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user)
):
    """Get user profile with loan statistics"""
    user_id = UUID(current_user["id"])
    dashboard = await service.RetrieveUserDashboard(user_id)
    if dashboard is None:
        raise HTTPException(status_code=404, detail="User not found")
    return dashboard

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    service: UserService = Depends(get_user_service),
    current_user: dict = Depends(require_admin)
):
    user = await service.RetrieveUserById(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserCreate,
    service: UserService = Depends(get_user_service)
):
    """Create a new user"""
    try:
        new_user = await service.AddUser(user)
        return new_user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user: UserUpdate,
    service: UserService = Depends(get_user_service)
):
    """Update an existing user"""
    try:
        updated_user = await service.ModifyUser(user_id, user)
        if updated_user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with id {user_id} not found"
            )
        return updated_user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    service: UserService = Depends(get_user_service),
    current_user: dict = Depends(require_admin)
):
    """Delete a user (Admin only)"""
    success = await service.RemoveUser(user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    return None


@router.post("/{user_id}/clear-infractions", response_model=UserResponse)
async def clear_infractions(
    user_id: UUID,
    service: UserService = Depends(get_user_service),
    current_user: dict = Depends(require_admin)
):
    """Clear user's infractions count (Admin only)"""
    user = await service.ModifyUser(user_id, UserUpdate(infractions_count=0))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    return user


@router.post("/{user_id}/blacklist", response_model=UserResponse)
async def add_to_blacklist(
    user_id: UUID,
    reason: str,
    service: UserService = Depends(get_user_service),
    current_user: dict = Depends(require_admin)
):
    """Add user to blacklist (Admin only)"""
    user = await service.ModifyUser(
        user_id,
        UserUpdate(is_blacklisted=True, blacklist_note=reason)
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    return user


@router.delete("/{user_id}/blacklist", response_model=UserResponse)
async def remove_from_blacklist(
    user_id: UUID,
    service: UserService = Depends(get_user_service),
    current_user: dict = Depends(require_admin)
):
    """Remove user from blacklist (Admin only)"""
    user = await service.ModifyUser(
        user_id,
        UserUpdate(is_blacklisted=False, blacklist_note=None)
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    return user


@router.get("/search/", response_model=List[UserResponse])
async def search_users(
    q: str,
    service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user)
):
    """Search users by name, email, or university ID"""
    if not q or len(q.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query must be at least 2 characters"
        )
    return await service.SearchUsers(q)

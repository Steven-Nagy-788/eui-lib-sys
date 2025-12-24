from datetime import datetime
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from ..Models.Users import UserRole
from .config import get_settings

security = HTTPBearer()


def verify_token(token: str) -> dict:
    """
    Verify JWT token and return payload
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    token = credentials.credentials
    payload = verify_token(token)
    exp = payload.get("exp")
    if exp and datetime.utcnow().timestamp() > exp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "id": user_id,
        "role": payload.get("role"),
    }


def get_current_active_user(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency to get current active user (can add blacklist check here)
    """
    # You can add additional checks here like:
    # - Check if user is blacklisted
    # - Check if user account is active
    return current_user


def require_role(allowed_roles: list[UserRole]):
    """
    Factory function to create role-based access control dependency

    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_role([UserRole.ADMIN]))])
    """

    def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role")

        # Convert role string to UserRole enum for comparison
        if user_role not in [role.value for role in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {[r.value for r in allowed_roles]}",
            )

        return current_user

    return role_checker


# Shorthand dependencies for common role checks
def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency that requires admin role"""
    if current_user.get("role") != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )
    return current_user


def require_admin_or_self(user_id: str):
    """
    Dependency factory that allows admin or the user themselves

    Usage:
        @router.get("/users/{user_id}")
        async def get_user(
            user_id: str,
            current_user: dict = Depends(require_admin_or_self)
        )
    """

    def checker(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("role") == UserRole.ADMIN.value:
            return current_user

        if current_user.get("id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own data",
            )

        return current_user

    return checker


# Optional authentication (for endpoints that work with or without auth)
def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    ),
) -> Optional[dict]:
    """
    Optional authentication - returns user if token is provided and valid, None otherwise
    """
    if not credentials:
        return None

    try:
        token = credentials.credentials
        payload = verify_token(token)
        return {
            "id": payload.get("id"),
            "role": payload.get("role"),
        }
    except HTTPException:
        return None

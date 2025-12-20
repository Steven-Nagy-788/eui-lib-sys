import asyncio
from supabase import Client
from typing import Optional
from uuid import UUID
from fastapi import HTTPException

class UserBroker:
    def __init__(self, client: Client):
        self.client = client

    async def SelectAllUsers(self, skip: int = 0, limit: int = 10) -> list[dict]:
        def _fetch():
            return self.client.table("users").select("*").range(skip, skip + limit - 1).execute()  
        user = await asyncio.to_thread(_fetch)      
        return user.data
    
    async def SelectUserById(self, user_id: UUID) -> Optional[dict]:
        def _fetch():
            return self.client.table("users").select("*").eq("id", str(user_id)).execute()
        response = await asyncio.to_thread(_fetch)
        return response.data[0] if response.data else None
    
    async def SelectUserByEmail(self, email: str) -> Optional[dict]:
        """Get a user by email"""
        def _fetch():
            return self.client.table("users").select("*").eq("email", email).execute()
        response = await asyncio.to_thread(_fetch)
        return response.data[0] if response.data else None         
    async def SelectUserByUniversityId(self, university_id: str) -> Optional[dict]:
        """Get a user by university ID"""
        def _fetch():
            return self.client.table("users").select("*").eq("university_id", university_id).execute()
        response = await asyncio.to_thread(_fetch)
        return response.data[0] if response.data else None

    async def InsertUser(self, user_data: dict) -> dict:
        def _insert():
            return self.client.table("users").insert(user_data).execute()
        return (await asyncio.to_thread(_insert)).data[0]
    
    async def UpdateUser(self, user_id: UUID, update_data: dict) -> Optional[dict]:
        """Update a user by ID"""
        def _update():
            return self.client.table("users").update(update_data).eq("id", str(user_id)).execute()
        response = await asyncio.to_thread(_update)
        return response.data[0] if response.data else None
    
    async def DeleteUser(self, user_id: UUID) -> bool:
        def _delete():
            return self.client.table("users").delete().eq("id", str(user_id)).execute()
        response = await asyncio.to_thread(_delete)
        return len(response.data) > 0
    
    async def SearchUsers(self, query: str) -> list[dict]:
        """Search users by name, email, or university ID (case-insensitive)"""
        def _search():
            return self.client.table("users").select("*").or_(
                f"full_name.ilike.%{query}%,"
                f"email.ilike.%{query}%,"
                f"university_id.ilike.%{query}%"
            ).execute()
        response = await asyncio.to_thread(_search)
        return response.data if response.data else []
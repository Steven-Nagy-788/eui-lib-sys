import asyncio
from supabase import Client
from typing import Optional
from uuid import UUID
from fastapi import HTTPException

class UserBroker:
    def __init__(self, client: Client):
        self.client = client

    async def select_all_users(self, skip: int = 0, limit: int = 10) -> list[dict]:
        def _fetch():
            return self.client.table("users").select("*").range(skip, skip + limit - 1).execute()  
        user = await asyncio.to_thread(_fetch)      
        return user.data
    
    async def select_user_by_id(self, user_id: UUID) -> Optional[dict]:
        def _fetch():
            return self.client.table("users").select("*").eq("id", str(user_id)).execute()
        response = await asyncio.to_thread(_fetch)
        return response.data[0] if response.data else None
    
    async def get_user_by_email(self, email: str) -> Optional[dict]:
        """Get a user by email"""
        def _fetch():
            return self.client.table("users").select("*").eq("email", email).execute()
        
        try:
            response = await asyncio.to_thread(_fetch)
            if response.data:
                return response.data[0]
            return None
        except Exception:
            return None         
    async def select_user_by_university_id(self, university_id: str) -> Optional[dict]:
        """Get a user by university ID"""
        def _fetch():
            return self.client.table("users").select("*").eq("university_id", university_id).execute()
        
        try:
            response = await asyncio.to_thread(_fetch)
            if response.data:
                return response.data[0]
            return None
        except Exception:
            return None

    async def insert_user(self, user_data: dict) -> dict:
        def _insert():
            return self.client.table("users").insert(user_data).execute()
        return (await asyncio.to_thread(_insert)).data[0]
    
    async def update_user(self, user_id: UUID, update_data: dict) -> Optional[dict]:
        """Update a user by ID"""
        def _update():
            return self.client.table("users").update(update_data).eq("id", str(user_id)).execute()
        
        try:
            response = await asyncio.to_thread(_update)
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            if "unique constraint" in str(e).lower():
                raise HTTPException(status_code=400, detail="Duplicate value")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def delete_user(self, user_id: UUID) -> bool:
        def _delete():
            return self.client.table("users").delete().eq("id", str(user_id)).execute()
        return len(await asyncio.to_thread(_delete).data) > 0
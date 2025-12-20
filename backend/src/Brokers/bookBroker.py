import asyncio
from supabase import Client
from typing import Optional
from uuid import UUID
from fastapi import HTTPException

class BookBroker:
    def __init__(self, client: Client):
        self.client = client

    async def select_all_books(self, skip: int = 0, limit: int = 10) -> list[dict]:
        def _fetch():
            return self.client.table("books").select("*").range(skip, skip + limit - 1).execute()  
        books = await asyncio.to_thread(_fetch)      
        return books.data
    
    async def select_book_by_id(self, book_id: UUID) -> Optional[dict]:
        def _fetch():
            return self.client.table("books").select("*").eq("id", str(book_id)).execute()
        response = await asyncio.to_thread(_fetch)
        return response.data[0] if response.data else None
    
    async def select_book_by_isbn(self, isbn: str) -> Optional[dict]:
        """Get a book by ISBN"""
        def _fetch():
            return self.client.table("books").select("*").eq("isbn", isbn).execute()
        
        try:
            response = await asyncio.to_thread(_fetch)
            if response.data:
                return response.data[0]
            return None
        except Exception:
            return None

    async def insert_book(self, book_data: dict) -> dict:
        def _insert():
            return self.client.table("books").insert(book_data).execute()
        return (await asyncio.to_thread(_insert)).data[0]
    
    async def update_book(self, book_id: UUID, update_data: dict) -> Optional[dict]:
        """Update a book by ID"""
        def _update():
            return self.client.table("books").update(update_data).eq("id", str(book_id)).execute()
        
        try:
            response = await asyncio.to_thread(_update)
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            if "unique constraint" in str(e).lower():
                raise HTTPException(status_code=400, detail="Duplicate value")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def delete_book(self, book_id: UUID) -> bool:
        def _delete():
            return self.client.table("books").delete().eq("id", str(book_id)).execute()
        return len(await asyncio.to_thread(_delete).data) > 0

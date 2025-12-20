import asyncio
from supabase import Client
from typing import Optional
from uuid import UUID

class BookBroker:
    def __init__(self, client: Client):
        self.client = client

    async def SelectAllBooks(self, skip: int = 0, limit: int = 10) -> list[dict]:
        def _fetch():
            return self.client.table("books").select("*").range(skip, skip + limit - 1).execute()  
        books = await asyncio.to_thread(_fetch)      
        return books.data
    
    async def SelectBookById(self, book_id: UUID) -> Optional[dict]:
        def _fetch():
            return self.client.table("books").select("*").eq("id", str(book_id)).execute()
        response = await asyncio.to_thread(_fetch)
        return response.data[0] if response.data else None
    
    async def SelectBookByIsbn(self, isbn: str) -> Optional[dict]:
        """Get a book by ISBN"""
        def _fetch():
            return self.client.table("books").select("*").eq("isbn", isbn).execute()
        
        response = await asyncio.to_thread(_fetch)
        if response.data:
            return response.data[0]
        return None

    async def InsertBook(self, book_data: dict) -> dict:
        def _insert():
            return self.client.table("books").insert(book_data).execute()
        return (await asyncio.to_thread(_insert)).data[0]
    
    async def UpdateBook(self, book_id: UUID, update_data: dict) -> Optional[dict]:
        """Update a book by ID"""
        def _update():
            return self.client.table("books").update(update_data).eq("id", str(book_id)).execute()
        
        response = await asyncio.to_thread(_update)
        if response.data:
            return response.data[0]
        return None
    
    async def DeleteBook(self, book_id: UUID) -> bool:
        def _delete():
            return self.client.table("books").delete().eq("id", str(book_id)).execute()
        return len(await asyncio.to_thread(_delete).data) > 0
    
    async def SearchBooks(self, query: str) -> list[dict]:
        """Search books by title, author, or ISBN (case-insensitive)"""
        def _search():
            # Search in title, author, and ISBN fields
            return self.client.table("books").select("*").or_(
                f"title.ilike.%{query}%,"
                f"author.ilike.%{query}%,"
                f"isbn.ilike.%{query}%"
            ).execute()
        
        response = await asyncio.to_thread(_search)
        return response.data if response.data else []

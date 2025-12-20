import asyncio
from supabase import Client
from typing import Optional, List
from uuid import UUID


class BookCopyBroker:
    def __init__(self, client: Client):
        self.client = client

    async def SelectAllCopies(self, skip: int = 0, limit: int = 10) -> list[dict]:
        """Get all book copies with pagination"""
        def _fetch():
            return self.client.table("book_copies").select("*").range(skip, skip + limit - 1).execute()  
        copies = await asyncio.to_thread(_fetch)      
        return copies.data
    
    async def SelectCopiesByBookId(self, book_id: UUID) -> list[dict]:
        """Get all copies of a specific book"""
        def _fetch():
            return self.client.table("book_copies").select("*").eq("book_id", str(book_id)).execute()
        response = await asyncio.to_thread(_fetch)
        return response.data if response.data else []
    
    async def SelectAvailableCopiesByBookId(self, book_id: UUID) -> list[dict]:
        """Get all available copies of a specific book"""
        def _fetch():
            return (
                self.client.table("book_copies")
                .select("*")
                .eq("book_id", str(book_id))
                .eq("status", "available")
                .execute()
            )
        response = await asyncio.to_thread(_fetch)
        return response.data if response.data else []
    
    async def SelectCopyById(self, copy_id: UUID) -> Optional[dict]:
        """Get a specific copy by ID"""
        def _fetch():
            return self.client.table("book_copies").select("*").eq("id", str(copy_id)).execute()
        response = await asyncio.to_thread(_fetch)
        return response.data[0] if response.data else None
    
    async def SelectCopyByAccessionNumber(self, accession_number: int) -> Optional[dict]:
        """Get a copy by its barcode/accession number"""
        def _fetch():
            return (
                self.client.table("book_copies")
                .select("*")
                .eq("accession_number", accession_number)
                .execute()
            )
        response = await asyncio.to_thread(_fetch)
        return response.data[0] if response.data else None

    async def InsertCopy(self, copy_data: dict) -> dict:
        """Insert a single book copy"""
        def _insert():
            return self.client.table("book_copies").insert(copy_data).execute()
        return (await asyncio.to_thread(_insert)).data[0]
    
    async def InsertCopiesBulk(self, copies_data: List[dict]) -> List[dict]:
        """Insert multiple book copies at once"""
        def _insert():
            return self.client.table("book_copies").insert(copies_data).execute()
        result = await asyncio.to_thread(_insert)
        return result.data
    
    async def UpdateCopy(self, copy_id: UUID, update_data: dict) -> Optional[dict]:
        """Update a book copy by ID"""
        def _update():
            return (
                self.client.table("book_copies")
                .update(update_data)
                .eq("id", str(copy_id))
                .execute()
            )
        
        response = await asyncio.to_thread(_update)
        if response.data:
            return response.data[0]
        return None
    
    async def DeleteCopy(self, copy_id: UUID) -> bool:
        """Delete a book copy"""
        def _delete():
            return self.client.table("book_copies").delete().eq("id", str(copy_id)).execute()
        result = await asyncio.to_thread(_delete)
        return len(result.data) > 0
    
    async def CountCopiesByBookId(self, book_id: UUID) -> dict:
        """Count total, available, and reference copies for a book"""
        def _fetch_all():
            return self.client.table("book_copies").select("*").eq("book_id", str(book_id)).execute()
        
        response = await asyncio.to_thread(_fetch_all)
        copies = response.data if response.data else []
        
        total = len(copies)
        available = sum(1 for c in copies if c.get("status") == "available")
        reference = sum(1 for c in copies if c.get("is_reference") is True)
        
        return {
            "total": total,
            "available": available,
            "reference": reference,
            "circulating": total - reference
        }

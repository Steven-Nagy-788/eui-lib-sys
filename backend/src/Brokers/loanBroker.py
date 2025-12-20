import asyncio
from supabase import Client
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from fastapi import HTTPException


class LoanBroker:
    def __init__(self, client: Client):
        self.client = client

    # ==================== LOANS ====================
    
    async def select_all_loans(self, skip: int = 0, limit: int = 10) -> list[dict]:
        """Get all loans with pagination"""
        def _fetch():
            return self.client.table("loans").select("*").range(skip, skip + limit - 1).execute()  
        loans = await asyncio.to_thread(_fetch)      
        return loans.data
    
    async def select_loan_by_id(self, loan_id: UUID) -> Optional[dict]:
        """Get a specific loan by ID"""
        def _fetch():
            return self.client.table("loans").select("*").eq("id", str(loan_id)).execute()
        response = await asyncio.to_thread(_fetch)
        return response.data[0] if response.data else None
    
    async def select_loans_by_user(self, user_id: UUID, status: Optional[str] = None) -> list[dict]:
        """Get all loans for a specific user, optionally filtered by status"""
        def _fetch():
            query = self.client.table("loans").select("*").eq("user_id", str(user_id))
            if status:
                query = query.eq("status", status)
            return query.execute()
        response = await asyncio.to_thread(_fetch)
        return response.data if response.data else []
    
    async def select_loans_by_copy(self, copy_id: UUID) -> list[dict]:
        """Get all loans for a specific book copy"""
        def _fetch():
            return self.client.table("loans").select("*").eq("copy_id", str(copy_id)).execute()
        response = await asyncio.to_thread(_fetch)
        return response.data if response.data else []
    
    async def select_loans_by_status(self, status: str, skip: int = 0, limit: int = 100) -> list[dict]:
        """Get all loans with a specific status"""
        def _fetch():
            return (
                self.client.table("loans")
                .select("*")
                .eq("status", status)
                .range(skip, skip + limit - 1)
                .execute()
            )
        response = await asyncio.to_thread(_fetch)
        return response.data if response.data else []
    
    async def select_active_loans_by_user(self, user_id: UUID) -> list[dict]:
        """Get all active loans for a user (pending or active status)"""
        def _fetch():
            return (
                self.client.table("loans")
                .select("*")
                .eq("user_id", str(user_id))
                .in_("status", ["pending", "active"])
                .execute()
            )
        response = await asyncio.to_thread(_fetch)
        return response.data if response.data else []
    
    async def check_user_has_copy_on_loan(self, user_id: UUID, copy_id: UUID) -> bool:
        """Check if user already has this specific copy on loan (active or pending)"""
        def _fetch():
            return (
                self.client.table("loans")
                .select("id")
                .eq("user_id", str(user_id))
                .eq("copy_id", str(copy_id))
                .in_("status", ["pending", "active"])
                .execute()
            )
        response = await asyncio.to_thread(_fetch)
        return len(response.data) > 0
    
    async def select_overdue_loans(self) -> list[dict]:
        """Get all loans that are overdue (due_date < now and status = active)"""
        def _fetch():
            now = datetime.utcnow().isoformat()
            return (
                self.client.table("loans")
                .select("*")
                .eq("status", "active")
                .lt("due_date", now)
                .execute()
            )
        response = await asyncio.to_thread(_fetch)
        return response.data if response.data else []
    
    async def insert_loan(self, loan_data: dict) -> dict:
        """Insert a new loan request"""
        def _insert():
            return self.client.table("loans").insert(loan_data).execute()
        return (await asyncio.to_thread(_insert)).data[0]
    
    async def update_loan(self, loan_id: UUID, update_data: dict) -> Optional[dict]:
        """Update a loan by ID"""
        def _update():
            return (
                self.client.table("loans")
                .update(update_data)
                .eq("id", str(loan_id))
                .execute()
            )
        
        try:
            response = await asyncio.to_thread(_update)
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    async def delete_loan(self, loan_id: UUID) -> bool:
        """Delete a loan"""
        def _delete():
            return self.client.table("loans").delete().eq("id", str(loan_id)).execute()
        result = await asyncio.to_thread(_delete)
        return len(result.data) > 0

    # ==================== LOAN POLICIES ====================
    
    async def select_loan_policy(self, role: str) -> Optional[dict]:
        """Get loan policy for a specific role"""
        def _fetch():
            return self.client.table("loan_policies").select("*").eq("role", role).execute()
        response = await asyncio.to_thread(_fetch)
        return response.data[0] if response.data else None
    
    async def select_all_loan_policies(self) -> list[dict]:
        """Get all loan policies"""
        def _fetch():
            return self.client.table("loan_policies").select("*").execute()
        response = await asyncio.to_thread(_fetch)
        return response.data if response.data else []
